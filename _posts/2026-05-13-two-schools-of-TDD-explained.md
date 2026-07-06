---
layout: post
title: "Two schools of TDD explained"
author: michal.przysucha
tags: [ tech, tdd, Kotlin, testing, test doubles, mock, stub, fake, dummy, spy ]
excerpt: >
    This article presents two approaches of how TDD can be applied. The first is the classic one where the objects are treated as black-boxes and verification
    is based on the objects state. The second one is focused on interactions.
---
<style>
.language-kotlin .err { color: inherit; background-color: transparent; }
</style>

This article presents two approaches of how TDD can be applied. The first is the classic one where the objects are treated as black-boxes and verification is
based on the objects state. The second one is focused on interactions. Both are explained using so-called test doubles, e.g. mocks, stubs and others.
However, this is not a tutorial for any specific framework such as [MockK](https://mockk.io/) or [Mockito](https://mockito.org/).
I intentionally avoided using any, because I wanted to present a concept rather than focus on an API which may be different
in different frameworks and may evolve in the future. The examples are written in pure Kotlin and the full code can be found in:
[mprzysucha/two-schools-of-testing](https://github.com/mprzysucha/two-schools-of-tdd-explained/tree/main/src/test/kotlin) GitHub repository.

## Problem statement

Let’s assume we need to create a simple service that can estimate a property price. A domain expert would like the estimate to depend on the size of the
property in square meters, the number of rooms and a location. Later the example will be extended with a functionality of generating a price report that
will be sent by email, but first let’s start with the simpler one. We can imagine a simple test:

```kotlin
//when
val actualValue = propertyPriceCalculator.price(area = 60, rooms = 2, city = WRO)

//then
assertThat(actualValue == 792000)
```

The code tests the method `price()` with the object `propertyPriceCalculator` which is called **the object under test** or **the system under test**
(hereinafter **SUT**). The actual value calculated by SUT is compared with the expected value which is 792 000.

Expected value is calculated based on the knowledge of the domain expert who said the logic of `price` method should follow the following rules:
 - it should compute the property price by multiplying the property size by the price of one square meter in a given city
 - it should multiply it by a factor whose value depends on the number of rooms:
    - 1.09 for one room
    - 1.0 for two rooms
    - 0.93 for three rooms
    - 0.87 for four rooms
    - 0.83 for five and more rooms

We need to know the average prices of 1 m² for given cites. Our expert said that for today the average price for one square meter in Wrocław is 13 200 zł.

For the sake of simplicity let’s assume that factors describing the relation between the number of rooms and the property price change very rarely and can be
incorporated into the logic of the calculator. But average prices in different cities change often. So we need to have a different service that will provide
the average price for each city reading it from an external storage, e.g. a database. The method `price()` of SUT is no longer a pure
function. It has a side effect which in this context means that it needs to call another service. For our SUT that second object is called a
collaborator.

<img style="display: block; margin: 0 auto;"  alt="Diagram showing the interaction between testing code, SUT and the collaborator"
src="/assets/img/articles/2026-05-13-two-schools-of-testing/systemundertest_and_collaborator.png"/>

If we have an instance of the collaborator in our test we could insert some fake data, run a test, validate the result and remove fake data.
Although it sounds logical, we need an established connection to the storage for the first and the last step. But it may be even more complicated if the
collaborator can only read data from the storage and doesn’t provide a method to insert and/or delete, especially if it reads from an external application
which we can’t change.

Instead of a real implementation of the collaborator we can create our own and return some predefined value. This means that we will create a stub.

```kotlin
//given
val marketPricesProviderStub = object : MarketPricesProvider {
    override fun providePrice(city: City): Int = when(city) {
        WRO -> 13200
        else -> 11800
    }
}
val propertyPriceCalculator = PropertyPriceCalculator(marketPricesProviderStub)

//when
val actualValue = propertyPriceCalculator.price(area = 60, rooms = 2, city = WRO)

//then
assertThat(actualValue == 792000)
```

## Indirect inputs

SUT receives predefined values not directly from the test code but indirectly from the collaborator stub. That’s why they
are called indirect inputs. We can distinguish between direct inputs and indirect inputs.
The former is passed to the system via public API, whereas the latter is supplied indirectly by its collaborators.
Test code is using stub to generate predefined values that are constant in each test invocation, so that the test result is deterministic.

## The classic way of TDD

The above example shows the test without the actual implementation which of course means that the code will not compile. Simple implementation with fake
values could make not only the test compiled but also passed. After adding some more tests the fake values should be changed to real implementation, so
that all test scenarios could end with success. This is the classic way of TDD where you first write a test that fails, create simple implementation with
fake values, add more tests, change the implementation to real which makes all tests pass. Then another tests can be added, which may require the
implementation to be extended. This loop is called `Red - Green - Refactor`.

The part of the test where assertions are used is the verification part. In the classic way of TDD the verification is based on the state of the objects.
In the example shown above the state is the value returned by the calculator that was compared to some expected value.

In some informal articles you can find a term ***Detroit school of TDD*** as an alternative name for the classic TDD.

## Extended example

Let’s now extend the example and assume that we have an orchestrator that uses our property price calculator and then creates a report based on the result of
the calculator and a report templating service. As a next step it sends the report using an email service. We see that the orchestrator has three collaborators:
 - property price calculator
 - report templates engine
 - email sender

The test of the orchestrator in the classic way could look e.g. like this:

```kotlin
//given
val propertyPriceReportOrchestrator = PropertyPriceReportOrchestrator(propertyPriceCalculator, propertyPriceReportTemplates, emailSender)
val template = SimpleTextReportTemplate()
val reportInputData = ReportInputData(area = 60, rooms = 2, city = WRO)
val emailMetadata = EmailMetadata(to = "customer@company.com", subject = "Property price report")

//when
val emailSent = propertyPriceReportOrchestrator.generatePricesReportAndSend(template, reportInputData, emailMetadata)

//then
assertThat(emailSent != null)
assertEquals(emailSent!!.to, "customer@company.com")
assertEquals(emailSent.subject, "Property price report")
assertEquals(emailSent.body, "The property in Wroclaw with 2 rooms having 60 m2 costs 792000.")
```

The state can be verified by checking the properties of email sent, e.g. the recipient address, the email subject or the email body. To
verify the state we need to assume that the tested method will return the email that was sent. But what if the method `generatePricesReportAndSend` uses the
`emailSender` to just send the email and doesn’t return it? We can assume that real implementation doesn’t need it and returning it just for the purpouse of
the test would be considered as a bad design. In such a way the code above will not compile, because `generatePricesReportAndSend` will return `Unit`.
Still the method can be tested which will be shown in next paragraphs.

## Interactions vs state

Using the classic way we would like to check the final state, which means that we need to somehow check the email that was sent by `EmailSender`.
It is still possible, and it will be shown later, but there is a different approach that may be taken. Instead of verifying the state we can verify if all
the interactions happen and whether they happen in a specific order. Moreover, we could even inspect the values exchanged during the interactions.
This can be achieved using so called mocks. The below example shows the custom mock implementation that allows us to verify the interactions — if the method
calls happen and whether they happen in the specific order.

```kotlin
//given
val propertyPriceReportOrchestrator = PropertyPriceReportOrchestrator(propertyPriceCalculatorMock, propertyPriceReportTemplatesMock, emailSenderMock)
val template = ReportTemplate()
val reportInputData = ReportInputData(area = 50, rooms = 2, city = WRO)
val emailData = EmailData(to = "customer@company.com", subject = "Property price report")

//when
propertyPriceReportOrchestrator.generatePricesReportAndSend(template, reportInputData, emailData)

//then
propertyPriceCalculatorMock.verifyMethodCallInOrder(order = 1)
propertyPriceReportTemplatesMock.verifyMethodCallInOrder(order = 2)
emailSenderMock.verifyMethodCallInOrder(order = 3)
```

## Indirect outputs

In the first example our observation point was the values returned by SUT. Contrary to that, in the above example the observation point
is the interaction between SUT and its collaborators. Those interactions are called indirect outputs. Indirect, because these are the
outputs that can’t be observed using public API of SUT.

## London school of TDD

The second example presents the approach where assertions checks the interactions rather than a state. Those verifications where focus
is shifted to interactions is often and informally named ***London school of TDD***. However, it’s worth mentioning that the boundary
between the classic and London school is not strict and the state verification is still important part of this TDD approach.

## Test doubles

You might have noticed that for indirect inputs the object pretending to be the collaborator was called a **stub**. In the second approach with indirect
outputs the object was called a **mock**. The objects that act as a collaborators of SUT are in general called test doubles. Stubs and mocks are used
most often, but we can distinguish more.

### Dummy
```kotlin
//given
val marketPricesProviderDummy = object : MarketPricesProvider {
    override fun providePrice(city: City): Int = TODO("Not implemented")
}
val propertyPriceCalculator = RealPropertyPriceCalculator(marketPricesProviderDummy)

//when
val result = Try { propertyPriceCalculator.price(area = -100, rooms = 2, city = WRO) }

//then
assertThat(result is Failure)
assertThat((result as Failure).e is NonPositiveNumber)
assertThat(result.e.message == "Flat area")
```

In the first example, we can imagine a test in which we just want to check if the calculator reacts to incorrect input arguments (a negative number).
The collaborator will not even be called in this test. In this case we can even leave `TODO()` which actually would throw `NotImplementedError` if it was
called. It could also return some dummy value. So we can pass a dummy object only to fulfil the method contract that expects the type
`MarketPricesProvider`. The behavior is not important.

### Spy

Similar to mocks, a spy spies on the interactions but then hands over the execution to the real object. Once the execution is complete, we can verify
the interactions between SUT and the collaborator. Assuming the class `OneArgSpy` can count interactions and capture one argument passed to the collaborator
we can imagine the following test:

```kotlin
//given
val marketPricesProviderSpy = object : MarketPricesProvider, OneArgSpy<City>() {
    private val realObject = RealMarketPricesProvider()
    override fun providePrice(city: City): Int {
        super.storeArg(city)
        return realObject.providePrice(city)
    }
}
val propertyPriceCalculator = RealPropertyPriceCalculator(marketPricesProviderSpy)

//when
propertyPriceCalculator.price(area = 50, rooms = 2, city = WRO)

//then
assertThat(marketPricesProviderSpy.methodWasCalled(numOfTimes = 1))
assertThat(marketPricesProviderSpy.capturedArgument() == WRO)
```

It is worth noting that you don’t always need to forward every invocation to a real object. For instance, imagine a collaborator with three methods where only
one requires verification. If that specific method does not need to pass the invocation through, its behavior can be stubbed, while the real object is used
for the other two methods.

### Fake

A fake is a simple implementation that mimics a real object with some limitations. It is usually some object with a state, where you can put some entries and
then retrieve them or where you place objects to be sent somewhere else, but you have some internal state such as a counter. In the example of the report
generator we had to use the verification of the interactions to test if the email sent is correct, because the tested method doesn’t return it.
However, I mentioned that the state verification is still possible. Yes, it is possible if we use fake `EmailSender` implementation which will allow us
to get the email sent to verify it. We can imagine the fake implementation of `EmailSender` that apart from returning the last email it can also e.g. count the
number of emails sent. This fake implementation could be also kept as a separate class:
```kotlin
class EmailSenderFake : EmailSender {
    var numOfEmailsSent = 0
    var lastEmail: Email? = null
    override fun sendEmail(to: String, subject: String, body: String) {
        numOfEmailsSent += 1
        lastEmail = Email(
            metadata = EmailMetadata(to, subject),
            content = body
        )
    }
}
```
Having it as a separate class we can now reuse it between different tests. The test using the fake could look like below example:
```kotlin
//given
val emailSenderFake = EmailSenderFake()
val propertyPriceReportOrchestrator = PropertyPriceReportOrchestrator(
    propertyPriceCalculatorDummy,
    stubPropertyPriceReportTemplates("This is report"),
    emailSenderFake
)
val reportInputData = ReportInputData(area = 50, rooms = 2, city = WRO)
val template = SimpleTextReportTemplate()
val emailMetadata = EmailMetadata(to = "customer@company.com", subject = "Property price report")

//when
propertyPriceReportOrchestrator.generatePricesReportAndSend(template, reportInputData, emailMetadata)

//then
assertThat(emailSenderFake.numOfEmailsSent == 1)
assertThat(emailSenderFake.lastEmail != null)
assertThat(emailSenderFake.lastEmail == Email(
    metadata = EmailMetadata("customer@company.com", "Property price report"),
    content = "This is report")
)
```
You may notice that test doubles have something in common and differ only in specific parts. If we try to align them with the
two approaches described above then we can see that the fakes and the dummies are closer to the stubs and indirect inputs. So that in classic approach
they may be used more often. On the other hand the spies are closer to the mocks because they are focused on interaction and indirect outputs.
They are used in the approach developed by the London school community that informally is called mockists.

## Which approach should you use?

There isn’t a single way which is always better than the other.
However, there are some scenarios when one is easier to apply than the other.

### Inside-Out vs Outside-In

Inside-Out is a bottom-up approach meaning that you start from small components which can be tested in a classic way and that seems to be more natural.
Once your system grows you can start creating stubs of the collaborators if needed. But still keeping the verification of the state, whether it’s the direct
output from your SUT or changed internal state of your fake collaborator. In such a way the classic approach is used.
You end up with big modules where you can test big parts of it or even the whole system testing the input and verifying the final state.

Opposite to that there is the Outside-In approach which is a top-down way of building a system.
When you start from the top e.g. having a specification of some complex API or UI you want to test the top layer.
You know what interaction you will have to implement to deeper layers and just want to check whether your new components
call them correctly. Here you should go with the London school and create mocks and spies of the collaborators to check the interactions.
Thanks to the top-down approach you may omit writing unnecessary code, which may happen using bottom-up.

However, one of the cons of the London school is heavy rely on the current API design of the collaborators or implementation of SUT.
We can imagine that report generator method implementation need to be changed, because of API of collaborator changes. If e.g. the report generator instead of
receiving the price will require a function that will return a price and invoke it itself then the order of invocations will change although the final
state won’t. In such a scenario the test written with classic approach doesn’t have to be changed, because it’s decoupled from the implementation.
But the one written with mocks isn’t, so changes would be required.

In practice, you can mix these approaches, even in a single test.
Classic and mocking styles are not opposites and do not exclude each other.
In other words both can be used. It’s fine as long as they help you solve the problem.
