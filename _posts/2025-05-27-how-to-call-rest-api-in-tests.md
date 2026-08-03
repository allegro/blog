---
layout: post
title: "How to call a REST API in integration tests"
author: piotr.klimiec
tags: [kotlin, testing, integration tests, rest]
---

Have you ever struggled to identify which REST API is being tested in your integration tests?
In this article, you’ll learn a clean and readable way to call REST APIs within your integration tests.
The goal is to make the WHEN section of the test clearly show which API is called and in what context, while hiding all technical details.

## Introduction
In the era of [microservices architecture](https://martinfowler.com/articles/microservices.html#CharacteristicsOfAMicroserviceArchitecture),
developers are increasingly writing integration tests at the expense of unit tests.
End-to-end tests where the application is treated as a black box, and verification is
performed through the public API—most often a REST API—are particularly popular.

Several factors have contributed to this shift.
The increase in computational power of modern computers and tools such as [Testcontainers](https://testcontainers.com/)
have made integration tests not only faster but also easier to write.
The nature of microservices also plays a significant role: many services implement relatively simple business logic,
often reduced to CRUD operations with minimal additional rules. At the same time, performing these operations requires
integration with various external systems—other services, databases and event queue systems.
Testing such integration solely at the unit test level would require extensive use of stubs and mocks.
This tightly couples tests to the application’s internal structure, making refactoring harder and tests less readable.

Well-designed integration tests can provide a sufficient safety net to protect us from regression,
without significantly burdening the application build process. A key aspect when creating good integration tests is
separating the description of the behavior being tested from the implementation details. The higher a test is in the
[test pyramid](https://martinfowler.com/bliki/TestPyramid.html) hierarchy, the more emphasis should be placed on
encapsulating technical details.

In the following sections of this article, I will demonstrate several approaches to implementing REST API calls in integration tests.
For each approach, I will outline its pros and cons and gradually refactor it until we reach the final solution.

## Sample application
As a case study, we will use a walking skeleton of an example service consisting of two contexts: **product creation** and
**product edition**.

<img alt="Sample application" src="/assets/img/articles/2025-05-27-how-to-call-rest-api-in-tests/sample_application.png"/>

Each context exposes a simple REST API — the former for product creation, and the latter for product editing.
The endpoint for creating a product looks as follows:

```kotlin
@PostMapping(
    "/api/brand/products",
    produces = [MediaType.APPLICATION_JSON_VALUE],
    consumes = [MediaType.APPLICATION_JSON_VALUE]
)
@ResponseStatus(HttpStatus.CREATED)
fun createProduct(@RequestBody productCreationDto: ProductCreationDto): ProductCreationResponse {
    logger.info("Create a new product for: $productCreationDto")
    return createProduct.create(productCreationDto.toDomain())
}
```
How can we represent the invocation of this REST API in our tests?

## Naive Approach

Direct exposure of REST API call details.

```kotlin
// when
val response = webTestClient.post()
    .uri("/api/brand/products")
    .accept(MediaType.APPLICATION_JSON)
    .contentType(MediaType.APPLICATION_JSON)
    .bodyValue(productCreationDto)
    .exchange()
```

In tests that directly execute the REST API call, there is often excessive technical code,
which, from the perspective of the test, constitutes unnecessary chaos.
Do we really need to expose in tests the fact that we’re using WebTestClient to make the request or that the request’s content type is JSON?


Problems arising from this approach:
- Lack of Encapsulation: Every test that needs to invoke, for example, the product creation API, repeats the same code fragment.
- Exposure of Technical Details: Elements such as the URL, HTTP method, or the Content-Type header leak into the tests,
making them susceptible to changes caused by modifications in the production code.
- Difficulty Identifying the Called API: In this approach, it is hard to quickly tell which API is being called. Although you could search the project
for a specific URL, in practice the URL is often split across different places — for example, partly in the controller class and partly in the method.
This makes it harder to understand which API is actually called.




## Refactoring
The first issue that needs to be addressed is code duplication.
We can apply the Extract Method technique to group the repeated code and move it into a dedicated method.
What is the appropriate name for this method, and where should it be placed?


I suggest that the method name should directly come from the name of the method in the @Controller class.
For example, if the URL ```/brand/products``` maps to the method ```ProductCreationEndpoint.createProduct(...)```,
the method encapsulating the invoked REST API in the tests should also be named ```createProduct(...)```.
Following this naming convention allows for quick identification of the invoked API in the production code.

Where should this method be placed? There are two options:
- In the base class for integration tests.
- In a separate class that aggregates all public API calls, with a reference to this class stored in the integration test base class.


After refactoring and moving the method to the base class for integration tests, the first variant of the code would appear as follows:

```kotlin
// when
val response = createProduct(productCreationRequest)
```

Although code duplication has been eliminated, it is still not clear that the test involves a call to a public REST API.
Methods defined directly in the base class do not clearly convey the context in which they are used.
Moreover, using the base class as a container for shared functionality often leads to excessive growth and reduced maintainability.
Inheritance should be reserved for cases where there is a clear is-a relationship between classes or for sharing low-level technical concerns.
Therefore, placing such methods in the base class is not an optimal solution.

A much better approach is to create a dedicated class that aggregates all calls to the public API.
A reference to this object should be placed in the base class for integration tests and appropriately named, e.g., ```api``` or ```publicApi```.

Example usage:

```kotlin
// when
val response = api.createProduct(productCreationRequest)
```

Such a reference can also be hidden behind a method, e.g. ```api()```.

Advantages of this approach:
- The reference name (api) clearly indicates the context of its use.
- Tests become more readable: api.createProduct(...) clearly communicates the intention that we are performing an operation on the public API.
- Extracting the logic of HTTP calls into a dedicated class decouples tests from the technical details of the current implementation.


## Final Solution

```kotlin
// when
val response = api()
    .productCreation()
    .createProduct(productCreationRequest)
```

For larger projects, I recommend using the convention ```api().context().method()```, where the ```context()```
method returns an object that aggregates all the methods available within a given context.

If there’s a need to model a specific request, such as a product creation failure, I recommend to avoid creating dedicated methods for such cases.
The number of methods in the aggregating class should match exactly the number of endpoints in the production code.
Specific scenarios should be modeled using appropriately constructed request objects, not separate methods.

## Summary
Although calling a REST API in integration tests is not rocket science,
I’ve seen many tests where it was hard to tell at first glance which API was being tested.
This lack of clarity usually stems from exposing technical details directly in the test code and failing to properly encapsulate the logic of HTTP calls.
By following the recommended structure, where method names mirror controller endpoints, are organized by bounded context, and exposed through an ```api()```
method, we create REST API calls that are both expressive and easy to understand.
This design shields tests from low-level technical details, making them resilient to implementation changes.

## Code examples
The GitHub [repository](https://github.com/Klimiec/How-to-call-a-REST-API-in-integration-tests)  includes test implementations discussed in the article.

