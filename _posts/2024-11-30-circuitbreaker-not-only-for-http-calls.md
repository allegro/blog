---
layout: post
title: Circuit Breaker not only for HTTP calls! (based on resilience4j)
author: [ patryk.bernacki ]
tags: [ programming, principles, code, tech  ]
---

When we think about the Circuit Breaker pattern, we instantly associate it with the HTTP client. Just make some annotation or wrapper and proceed with coding.
In this article, I will encourage you to use this pattern to resolve business problems.
Based on a live example from Allegro I will show you how to use the implementation of CircuitBreaker from [Resiliance4j](https://resilience4j.readme.io/) library for cases other than HTTP calls.

## What's the circuit breaker pattern
The circuit breaker is a simple but powerful pattern for detecting failures and ensuring reliability of the system.
It tracks how many times the operation has failed and if it exceeds a specific threshold.
The circuit will transition to **OPEN** when the threshold is exceeded, and it will not allow us to execute a given task.
After some time, it will change its state to **HALF_OPEN** during which some operations will be allowed to check if the system is back to normal.
If an operation is successful, the circuit will change its state to **CLOSED** and will allow all operations.
If the operation fails, the circuit will change its state to **OPEN** again.

![cb](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/cb.png)

For me, at first, it was a little bit confusing to remember that **OPEN** is a negative state. However, if you think about it like about an electronic circuit,
it all makes sense.

![cb_ele_schema](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/cb_electric.png)

## Allegro requirements
Allegro is complex but must be simple to use, fast and reliable. The payment process (which we will focus on) is no exception -
there are a lot of things going in the background, starting from adding items to a basket,
choosing a delivery method as well as a payment method and ending on payment itself. There are dozens of services and many third-party companies involved.

In such a complex system, it is normal that some part of it fails from time to time, but we need to ensure that we handle them properly.

## Buisness problem to be solved
One of the responsibilities of the team which I am a part of is to provide payment methods from which user can choose their preferred one.

![payment_methods](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/payment_methods.png)
![pbl](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/pbl.png)

As we can see above, there are plenty of methods, and each one has to be handled differently. For each method, a different third party is involved,
and the risk of failure is increasing. More importantly, many of those failures are not fixable in the Allegro system.

How should we handle it? We have basically two choices:
- Return exceptions during payments to users and wait patiently for a fix.
- Handle it gracefully and switch off the payment method.

Of course, we choose the second option. In the "Stone Age" we had to turn off services responsible for payment methods, then we evolved,
and we moved from turning off methods to configuration. However, both of these methods were slow -
many users had already experienced problems after clicking the "pay" button before methods were turned off.

We needed something faster that did not require human intervention.
We therefore came up with the idea to use Circuit Breaker implementation for this problem from the Resiliance4j library.
We had never used it for any other reason than annotation for http calls. Were a little bit uncertain, but we decided to give it a try.

## Solution with implementation

![arch](/assets/img/articles/2024-11-30-circuitbreaker-not-only-for-http-calls/arch.png)

We are using a message broker that receives information about failures from different payment services for each
payment method and passes this information to a microservice that holds implementation of circuitbreakers.

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

We have created SimpleCircuitBreakers class which holds:
- circuitBreakerConfig: configuration for circuit breakers (failure threshold and many more; for more information please refer to [official documentation](https://resilience4j.readme.io/docs/circuitbreaker)),
- circuitBreakerRegistry: holds circuit breakers separately for each payment method,
- executorService - schedules tasks that are triggered after changing the state of the circuit breaker.
- paymentMethodsStateRepository: a custom class which is responsible for handling transition between the states of circuit breakers.

### Event to be processed
```kotlin
data class CircuitBreakerEvent(
    val isSuccess: Boolean,
    val paymentMethod: String
)
```
CircuitBreakerEvent is an event received from a message broker. It contains the name of the selected payment method,
and information about whether the payment was successful or not.

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

private fun CircuitBreaker.addStateTransitionsHandling() =
    this.apply {
        this.eventPublisher
            .onStateTransition {
                executorService.schedule({
                    paymentMethodsStateRepository.save(it.circuitBreakerName, it.stateTransition)
                }, 0, TimeUnit.SECONDS)
            }
    }
```
In the findOrAdd method, we look for circuit breakers in the registry. If it is not present, we create a new one with the given configuration.

Function addStateTransitionsHandling applies logic to handle state transitions (e.g. from **CLOSED** to **OPEN**, from **HALF_OPEN** to **CLOSED**).
In our example, we save the new state to a repository so the services responsible for providing methods can filter out one that is turned off.


#### Important note
Please note that if a task was added to onStateTransition it will run on the same thread as the one that triggered processing,
so it can be shut down before execution of task ends - we learned this the hard way. Make sure to use the right implementation of the interface.
We used:

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

In the process method, we look for circuit breakers in the registry and then we publish events to it.

In the publishEvent method, we check if the payment was successful or not, and then we call the proper method on the circuit breaker.
I am sure that you noticed some "hack" right away; the implementation in Resiliance4j requires us to provide the duration of the task execution since
circuit breakers can also treat slow tasks as failures. Therefore, we provided 1 second as the default. Next hack is in tryAcquirePermission.
Ideally, it should be invoked in a service that is responsible for filtering out methods to decide whether we can make a payment with a particular method or not.
However, we gather events in a separate microservice, and we were not able to do so.

Here, some interesting questions can be raised:
What about **HALF_OPEN**?
How do we handle it if we are not using tryAcquirePermission correctly?
Should we turn off the method or not?
We definitely need to allow some kind of traffic to check if the method is back to normal.
Therefore, we came up with the idea of calculating what percentage of users should try to pay with methods in a **HALF_OPEN** state based on method popularity
to make sure everything is back to normal.

## Conclusions
In the above example, we show how to use circuit breakers from Resiliance4j for handling cases other than http calls.
With that ~70 lines of code we were able to significantly improve our response time to failures, redirect users to functioning payment providers,
meet business requirements regarding reliability, and take off developers' shoulders by manually switching off methods.
