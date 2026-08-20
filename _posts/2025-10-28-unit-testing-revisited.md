---
layout: post
title: Unit testing revisited
author: cezary.sanecki
tags: [ tech, unit testing, pragmatic engineer, software craftsmanship ]
---
Have you ever found yourself in a situation where a small change in the code breaks tests in a completely different, seemingly unrelated part of the system? Or
maybe you‘ve inherited a test suite that is slow, hard to read, and nobody wants to touch it? At [Allegro](https://allegro.tech), we believe that good tests are
the foundation of high-quality software. In this article, we’d like to share some practices that help us write tests that are not a burden, but a real asset.

In IT, there are many fancy acronyms that describe best practices, and unit testing is no different. Here, we have the acronym FIRST. We’ll briefly explain what
it means.

## What makes a good unit test?

**F is for Fast**. Tests should be fast. This can be understood in two ways. The first, more obvious one, is that tests should be quick to run, providing fast
feedback on whether a test has passed or not. But just as important is that tests should be fast to read. This helps us quickly understand what they are about
and what they actually verify.

**I is for Isolated**. Tests should be isolated from the outside world, as per the definition of unit tests. This means there should be no I/O operations.
But a second, and even more crucial, point is that tests should be isolated from each other, meaning the result of one test should not affect the outcome
of another.

**R is for Repeatable**. Tests should be repeatable, meaning no matter how many times we run a given test, or on which machine, it should always return the same
result. It should simply be deterministic.

**S is for Self-validating**. Tests should be self-validating, meaning there should be no need for a programmer to manually check if a test has passed or not.
It should be automatic.

**T is for Timely**. The last letter, T, stands for Timely, meaning tests should be written at the right time. The authors of this acronym —
[Brett Schuchert, Tim Ottinger](https://agileinaflash.blogspot.com/2009/02/first.html) — meant that tests should be written before the actual implementation,
in line with the Test-Driven Development (TDD) philosophy.

To sum it all up, we can draw three main conclusions. Tests should be readable and give us quick feedback about what’s really going on in the system. What’s
more, in the age of popular artificial intelligence (AI), the more readable our tests are, the easier the AI’s job will be, and the more it will help us.

Tests should verify something — they should verify our understanding of the business feature we are implementing. This means we are responsible for
understanding the business requirements well, then implementing them and verifying them with tests.

And, tests should give us a sense of security — they should tell us if we haven‘t broken some critical business feature just because we started modifying
the code. They should protect us from introducing regression bugs.

## The building blocks of unit tests

Now that we have a rough idea of what good unit tests are, let’s move on to the building blocks we have available to write them. In the world of
object-oriented programming, we have the concept of classes with methods, and this world is most often reflected in tests. We have test classes, test cases,
and of course, the units we want to test. Units sometimes require collaborators to be created. Each test case has a body, which is usually divided into three
sections following the Gherkin convention (Given, When, Then) or the AAA convention (Arrange, Act, Assert).

If the assumption is that we all write unit tests, then we likely use most of these building blocks. However, one might also wonder if they can be used
in a slightly different way, so that our tests are even better at the above-mentioned readability, ability to verify something, and giving us a
sense of security.

We will now try to look at these building blocks from a different perspective, which may make it easier for us to write these tests, but more importantly, will
allow us to manage them more easily in the long run.

## Grouping test cases

Let‘s start with grouping test cases. The default behavior, if we have, for example, an `OrderService`, is to create a test class `OrderServiceTest` or
`OrderServiceSpec`, where we put all the test cases for that class. This is initially a very good approach that works in many situations — we place all test
cases for that one class there.

However, it‘s worth realizing that sometimes the problem of a huge number of test cases for a given class can arise. What if it grows to — let’s say — 50?
In production code, if a class becomes too large, we usually create smaller ones and delegate to them appropriate responsibilities, managed by the remaining
core of the class.

**Why not apply the same in tests?**

Instead of creating one large test class, we can create several smaller ones and group the test cases there. One approach is to group test cases by
functionality.

First, we gain clarity because all test cases are grouped together. Another benefit is that even without opening these classes, we can see what functionalities
we have in our system. Of course, we can still see all details and the edge cases if we look inside.

One more thing: we can also group test cases by the data setup mechanism (fixture). The point here is that if we have a complicated setup mechanism that we have
to put together just to test it in many different scenarios, then perhaps, instead of duplicating it in many different classes, we can group these edge cases in
one class.

## The art of naming tests

One of the hardest things in IT is naming. We agree with that, but it‘s really worth spending more time on it, because — as we know — we read code
more often than we write it. It‘s similar now with Artificial Intelligence (AI): it reads code to be able to produce more of it. That‘s why
it‘s worth spending more time to choose the right name for our test case.

If we have a test named `shouldUpdateOfferData`, we don‘t know at first glance what‘s going on there. If it‘s a CRUD application (Create, Read, Update, Delete),
then maybe we‘re just updating the relevant fields, and that‘s perfectly fine. However, if we have a richer domain, it may not be so rosy, because now we have
to spend more time looking into the body of this method to find out what is actually being tested there.

```groovy
def "should update offer data"() {
    // Eh... Need to check body to know what is going on...
}
```

Many things could be tested there, and even if we modify the system, this test might fail for many different reasons.

However, if we approach it a little differently and start to see what side effects we actually have in our application, it might be easier to find a name
for the test.

Assume, for example, we have an entity representing an offer and its behavior is when its data changes for some reason, the offer’s status changes to “draft”.
If we write a test that checks such behavior, there is only one reason for this test to fail — only one responsibility is being tested, one corner case.
Then it‘s also easier for us to find a name for such a test.

For example, it could take the form: `“set offer as draft when data is changed”`.

```groovy
def "should set offer as draft when its data is changed"() {
    // Great! Self-explanatory test case name!
    // Do not have to bother what is inside.
}
```

So if we start to manage these names better, then, using an IDE like IntelliJ, we can fold all method bodies, leaving only their headers. This way we can read
it all like prose and find out what edge cases have been tested. We don‘t have to go into details — we see everything at a glance.

> Cmd + Shift + Minus (Mac) or Ctrl + Shift + Minus (Windows/Linux) in IntelliJ IDEA to collapse all methods in the current file.

## Structuring the test body

Moving on to the method body, we often have sections set up according to a convention, for example, Gherkin (given/when/then). If we look at the data setup
section, i.e., the Given section, we often place data there that we need from the point of view of a given test. If we have a large data structure that we
need to fill (because all fields are required), then from the test‘s point of view, we don‘t really know what is actually necessary.

For example, is the fact that the vehicle is red or is a BMW important? We have to guess, we have to trace everything and verify.

```groovy
given:
def vehicle = new Vehicle(
    UUID.randomUUID(),
    "BMW",
    "X5",
    CURRENT_DATE.minusYears(8).year,
    "XXX",
    "red",
    300_000,
    2010,
    Set.of(ENGINE, GEARBOX),
    // ... and 20 other fields
)
```

However, our industry has developed many cool patterns that are worth using, e.g., the Object Mother Pattern. It allows us to hide the complexity of this whole
initialization behind an additional, let‘s say, layer of abstraction.

```groovy
given:
def vehicle = aVehicle()
    .old(CURRENT_DATE)
    .withDamagedParts([
        ENGINE,
        GEARBOX
    ])
    .build() // from VehicleObjectMother
```

Thanks to this building block, we can explicitly show the reader what data is important from the test‘s point of view. For example, in this case, it is
important that the vehicle is old and has two damaged parts. And you can see that right away! By the way, using this pattern, we can give appropriate business
names to our data. So we don‘t worry about the fact that it‘s the year 2010, we just want to clearly state that this vehicle is old. We don‘t have to decode
later that vehicles below this year are old — it‘s just hidden somewhere.

Moving on to the Then section, we have a similar situation. There is also a pattern, the Assert Object Pattern, which gives similar advantages as the previous
pattern.

```groovy
then:
result.handledVehicle() == vehicle.id()
result.acceptedParts().isEmpty()
result.cost() == 0.0d
result.status() == REJECTED
```

Instead of having a wall of all the assertions that are necessary for us to check if a given functionality works correctly, we can hide it all behind another
layer of abstraction in the form of this pattern.

```groovy
then:
VehicleAssertObject.assertThat(result)
    .idIs(vehicle.id())
    .noCharge()
    .noUsedParts()
```

We hide the assertion logic in these methods. Thanks to this, we can give these methods appropriate names. Now, instead of having a verification in the code
whether a given collection is empty, we can give it a business meaning and, for example, name it `noUsedParts`.

It seems to us that it‘s worth trying something like this. One more thing worth emphasizing is that if an assertion or a data structure changes — for example,
if the structure representing cost changes from a decimal to two long values — we have only one place to update. Of course, this is a double-edged sword,
but if done well, it will save us a lot of work.

## Testing behavior, not implementation

This may be a bit controversial, but we can also write tests based on observing behavior. It‘s best to explain this with an example.

Let‘s say we have a parcel locker that we can lock for one customer. If we do that, then of course the corresponding fields in our class representing this
parcel locker will be assigned the appropriate values. This is perfectly fine, but now imagine that we have many such tests and, for example, a data structure
changes or an assertion needs to be added. Then we have to go through all tests and verify and correct it.

```groovy
when:
parcelLocker.lockFor(aClient, NOW)

then:
parcelLocker.assignedTo() == aClient
parcelLocker.lockUntil() == NOW + 1 day
!parcelLocker.wasProlonged
```

Another approach in this case is to assume that the data structure may change, but the behaviors will remain the same — and we can “latch onto” these behaviors.

For example, let‘s consider what happens when we lock a given locker in a parcel locker for a given customer. If after five minutes we can‘t lock it for another
customer, we‘ll just get an exception. If for some reason the data structure changes, this test will withstand such changes. This is not a “silver bullet”, but
it seems to us that it is worth testing, because the tests will show us what we can do in our system and how given business functions work. Of course, some test
that will verify if the fields have been set correctly will also be useful.

```groovy
given:
parcelLocker.lockFor(aClient, NOW)

when:
parcelLocker.lockFor(aClient2, NOW + 5 min)

then:
thrown(IllegalStateException)
```

## Mocks vs. Fakes: A matter of choice

And finally: the holy war, mocks versus fakes.

Let‘s look at these two cases. In the first one, we have to mock a lot of things, and we need to know how a given framework or testing library works in terms of
writing mocks. For example, if a method takes a parameter and gives us a return value, we need to find out how to teach such a mock to also return something. In
Spock, this is done as in the example below. We also have to be aware that by mocking, we interact with external contracts. If these contracts
change, we also have to adapt these mocks to this change.

```groovy
given:
importantStatsSystem.downloadStatsFor(anAccount.id()) >> new ExternalStats(anAccount.id(), 100, 20)
and:
additionalStatsSystem.downloadStatsFor(anAccount.id()) >> new ExternalStats(anAccount.id(), 100, 20)
and:
statsRepository.findByAccountId(anAccount.id()) >> Optional.empty()
and:
statsRepository.save(_ as Stats) >> { Stats stats ->
    return stats
}
```

On the other hand, using fakes has the advantage that we create the simplest implementation. If it is, for example, a repository, we can use a `HashMap` and
just do simple operations on it. Thanks to this, we have the fake implementation of this contract in only one place and we can use it in our tests, so we don‘t
have the noise associated with the technicalities of our mock‘s behavior. We only use this simple implementation in the form of a fake, thanks to which our
tests are more resistant to future changes in contracts. They are also more readable because this block of code simply gets smaller.

```groovy
given:
importantStatsSystem.store(new ExternalStats(anAccount.id(), 100, 20))
and:
additionalStatsSystem.store(new ExternalStats(anAccount.id(), 100, 20))
```

We’re 100% sure there are cases where mocks will be better, and it seems to us that a fake requires a little more commitment from us, because we have to
write this implementation. But we believe that in the long run it will simply pay off.

## Summary

That‘s all when it comes to revisiting the possibilities we have in unit testing. Sometimes it‘s worth considering whether what we‘re writing is
as good as it gets or whether there are perhaps other ways to do the same thing in a simpler way. Here are the key takeaways from this article:

*   **Name tests after the behavior they verify**, not the method they test.
*   **Group tests by functionality or fixture** to avoid huge, unmanageable test classes.
*   **Use patterns like Object Mother and Assert Object** to hide irrelevant details and make tests more readable.
*   **Test behavior, not implementation details**. This makes your tests more resilient to refactoring.
*   **Consider using fakes instead of mocks** to improve readability.

We hope you find at least one piece of this advice useful, and we believe using it in your project can make your programming life better.
