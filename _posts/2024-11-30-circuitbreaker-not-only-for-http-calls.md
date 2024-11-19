---
layout: post
title: Circuit Breaker not only for HTTP calls! based on resiliance4j
author: [ patryk.bernacki ]
tags: [ programming, principles, code, tech  ]
---

When we think about Circuit Breaker pattern, we instantly connect it to http client in our mind. Just make some annotation or wrapper and proceed with codding. In this article I will try to encourage you to use this pattern for resolving business problems. Based on live example in allegro I will show you how to use implementation of CircuitBreaker from [Resiliance4j](https://resilience4j.readme.io/) library for cases other then http calls.

## What's circuit breaker pattern
Circuit breaker is a simple but powerful pattern for detecting failures and ensuring reliability of system.
It tracks how many times the operation has failed and if it exceeds the threshold. The circuit will transit to **OPEN** when the threshold is exceeded, and it will not allow to execute given task. After some time it will change its state to **HALF_OPEN** during which some operation will be allowed to check if the system is back to normal. If the operation is successful, the circuit will change its state to **CLOSED** and will allow all operations. If the operation fails, the circuit will change its state to **OPEN** again.

![cb](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/cb.png)

For me at first it was a little bit confusing to remember that **OPEN** is negative state but if you think about it like about electronic circuit it all makes sense.

![cb_ele_schema](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/cb_electric.png)

## Allegro requirements
Allegro is complex but must be simple to use, fast and reliable and payment process (on which we will focus) is not an exception - there are a lot of going in the background starting from adding item to a basket, choosing delivery, payment method and ending on payment. There are dozens of services and many third party company involved.

In such complex system it is normal that from time to time some part of it will fail, but we have to make sure that we are handling it properly.

## Buisness problem to be solved
One of responsibilities of team which I am a part of is to provide payment methods from which user can choose preferable one.

![payment_methods](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/payment_methods.png)
![pbl](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/pbl.png)

As we can see there are plenty of methods and every one have to be handled differently. For each a different third party is involved and risk of failure is increasing and more important - part of those failures are not fixable in allegro system.

How to handle it? We have two choices:
- return an exceptions during payments to users and wait patiently for fix
- handle it gracefully and switch off payment method.

Of course, we choose second option. In "stone age" we had to turn off services responsible for payment methods, then we evolved, and we move turning off methods to configuration but both of these method were slow - many users have already experienced problem after clicking "pay" button before methods were turned them off.

We needed something faster and not requiring human intervention.
We came up with idea to use Circuit Breaker implementation for this problem from Resiliance4j library. We never use it for other reason than annotation for http calls. Were a little bit uncertain, but we decided to gave it a try.

## Solution with implementation

![arch](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/arch.png)

We are using message broker which receives information about failures from different payment services on each payment method and pass them to microservice which holds implementation of circuitbreakers.

We are using Resiliance4j library for Circuit Breaker implementation.
https://github.com/resilience4j/resilience4j


```kotlin
class SimpleCircuitBreakers(
    private val circuitBreakerConfig: CircuitBreakerConfig,
    private val circuitBreakerRegistry: CircuitBreakerRegistry,
    private val executorService: ScheduledExecutorService,
    private val paymentMethodsStateRepository: PaymentMethodsStateRepository
)
```

We have created SimpleCircuitBreakers class which hold:
- circuitBreakerConfig - configuration for circuit breakers (failure threshold and many more, for more information please refer to [official documentation](https://resilience4j.readme.io/docs/circuitbreaker)),
- circuitBreakerRegistry - holds circuit breakers separate for each payment method,
- executorService - scheduling tasks which are triggered after changing state of circuit breaker.
- paymentMethodsStateRepository - custom class which is responsible for handling transition between states of circuit breakers.
### Event to be processed
```kotlin
data class CircuitBreakerEvent(
    val isSuccess: Boolean,
    val paymentMethod: String
)
```
CircuitBreakerEvent is en event received from message broker. It contains name of selected payment method in payment and information if payment was successful or not.

### Adding new circuit breaker to CircuitBreakerRegistry
```kotlin
private fun findOrAdd(circuitBreakerName: String): CircuitBreaker =
    circuitBreakerRegistry.find(circuitBreakerName)
        .orElseGet {
            circuitBreakerRegistry.circuitBreaker(
                circuitBreakerName,
                circuitBreakerConfig
            )
                .addStateTransitionsHandling()
                .addMetricsHandling()
        }

private fun CircuitBreaker.v() =
    this.apply {
        this.eventPublisher
            .onStateTransition {
                executorService.schedule({
                    paymentMethodsStateRepository.save(it.circuitBreakerName, it.stateTransition)
                }, 0, TimeUnit.SECONDS)
            }
    }
```
In findOrAdd method we are looking for circuit breaker in registry. If it is not present we are creating new one with given configuration.

Function addStateTransitionsHandling apply logic to handle state transitions (e.g. from CLOSED TO OPEN, FROM HALF_OPEN to CLOSED). In our example we are saving new state to repository so services responsible for providing methods can filter out one which are turned off.


#### Important note
Please note that if tas was added to onStateTransition it will run on the same thread as the one which triggered processing so it can be shut down before executions of task ends - we learned it in hard way. Make sure to use right implementation of interface. We used:

```kotlin
Executors.newSingleThreadScheduledExecutor { threadTask: Runnable? ->
        val thread = Thread(threadTask, "SavingRepositoryScheduler")
        thread.isDaemon = true
        thread
    }
```

### Handling events
```kotlin
    fun process(event: CircuitBreakerEvent) =
        findOrAdd(event.paymentMethod)
            .publishEvent(event)

    private fun CircuitBreaker.publishEvent(methodResult: CircuitBreakerEvent) =
        when (methodResult.isSuccess) {
            true -> this.processEvent({ this.onSuccess(1, TimeUnit.SECONDS) })
            false -> this.onError(1, TimeUnit.SECONDS, Throwable())
        }

    private fun CircuitBreaker.processEvent(funs: () -> Unit) {
        if (this.tryAcquirePermission()) {
            funs.invoke()
        } else {
            this.releasePermission()
        }
    }
```

In process method we are looking for circuit breaker in registry and then we are publishing event to it.

In publishEvent method we are checking if payment was successful or not and then we are calling proper method on circuit breaker. I am sure that You can noticed some "hack" right away, implementation in resiliance4j needs us to provide time of task execution since circuitBreakres can also resolve slow task as failures, so we provided 1s as default.
Next hack is in tryAcquirePermission. Rightfully it should be invoked in service which is responsible for filtering out method to decide if we can make a payment with method or not, but we gather events in separate microservice and we were not able to do it.

Here the interesting questions can be risen, what about HALF_OPEN? How do we handle it if we are not using tryAcquirePermission correctly? Should we turn off method or not? We have to for sure allow some kind of traffic to check if method is back to normal. So we came up with idea to calculate what percentage of user should try to pay with methods in HALF_OPEN state based on method popularity to make sure everything is back to normal.

## Conclusions
In above example we show how to use circuit breakers from resiliance4j for handling cases other then http calls.
With that ~70 lines of code we were able to significantly improve time of reaction to failures, redirect users to working payment providers, meet business requirement about reliability and take of developers shoulders need to switching off method manually.
