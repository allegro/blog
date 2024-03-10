---
layout: post
title: "REST service client: design, testing, monitoring"
author: piotr.klimiec
tags: [kotlin, testing, integration tests, rest, wiremock]
---

The purpose of this article is to present how to design, test, and monitor a REST service client.
The article includes a repository with clients written using various technologies such as [WebClient](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-webclient),
[RestClient](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-restclient),
[Ktor Client](https://ktor.io/docs/getting-started-ktor-client.html),
[Retrofit](https://square.github.io/retrofit/).
It demonstrates how to send and retrieve data from an external service, add a cache layer, and adapter (anti-corruption layer).

## Motivation
Why do we need objects in the project that encapsulate the HTTP clients we use?
To begin, we want to separate the domain from technical details.
The way we retrieve/send data and handle errors, which can be quite complex in the case of HTTP clients, should not clutter business logic.
Next, testability. Even if we do not use [hexagonal architecture](https://blog.allegro.tech/2020/05/hexagonal-architecture-by-example.html) in our applications,
it's beneficial to separate the infrastructure layer from the service layer, as it improves testability.
Verifying an HTTP service client is not simple and requires consideration of many cases — mainly at the integration level.
Having a separate “building block“ that encapsulates communication with the outside world makes testing much easier.
Finally, reusability. A service client that has been written once can be successfully used in other projects.

## Client Design
As a case study, I will use an example implementation that utilizes [WebClient](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-webclient) for retrieving data from the Order Management Service.
Full working example can be found [here](https://github.com/Klimiec/webclients/tree/main/httpclient-webclientinterface).

```kotlin
class OrderManagementServiceClient(
    private val orderManagementServiceApi: OrderManagementServiceApi,
    private val clientName: String,
) {
    suspend fun getOrdersFor(clientId: ClientId): List<Order> {
        logger.info { "[$clientName] Get orders for a clientId= ${clientId.clientId}" }
        return handleHttpResponseAsList(
            request = { orderManagementServiceApi.getOrdersFor(clientId.clientId.toString()) },
            failureMessage = "[$clientName] Failed to get orders for clientId=${clientId.clientId}"
        ).also {
            logger.info { "[$clientName] Returned orders for a clientId= ${clientId.clientId} $it" }
        }
    }
}
```

### Client name
The class name for integration with the Order Management Service will be ```OrderManagementServiceClient``` — following the general
pattern of *ExternalService**Client***.

If the technology we use employs an interface to describe the called REST API (RestClient, WebClient, Retrofit),
we will name such an interface ```OrderManagementServiceApi``` — following the general pattern of *ExternalService**Api***.

These names may seem intuitive and obvious, but without an established naming convention, we might end up with a project where
different integrations have the following suffixes: HttpClient, Facade, WebClient, Adapter, Service.
It's essential to have a consistent convention and adhere to it throughout the entire project.

### Logging
```kotlin
class OrderManagementServiceClient(
    private val orderManagementServiceApi: OrderManagementServiceApi,
    private val clientName: String,
) {
    suspend fun getOrdersFor(clientId: ClientId): List<Order> {
        (1) logger.info { "[$clientName] Get orders for a clientId= ${clientId.clientId}" }
        return handleHttpResponseAsList(
            request = { orderManagementServiceApi.getOrdersFor(clientId.clientId.toString()) },
            (2.1) failureMessage = "[$clientName] Failed to get orders for clientId=${clientId.clientId}"
        ).also {
            (2.2) logger.info { "[$clientName] Returned orders for a clientId= ${clientId.clientId} $it" }
        }
    }
}
```

When retrieving data from an external service, we log the beginning of the interaction,
indicating our intention to fetch a resource (1), as well as its outcome (2). The outcome can be either be a success (2.2), meaning receiving
a response with a 2xx status code, or a failure (2.1).

Failure can be signaled by status codes (3xx, 4xx, 5xx), result from the inability to deserialize the received response into an object,
exceeding the response time, etc. Generally, [many things can go wrong](https://blog.allegro.tech/2015/07/testing-server-faults-with-Wiremock.html).
Depending on the cause of failure, we may want to log the interaction result at different levels (warn/error).
There are critical errors that are worth distinguishing (error), and those that will occasionally occur (warn) and don't require urgent intervention.

Logs should contain information about which resource we want to fetch, for what parameters, and what data we received as a result of the request.
Technical details can be limited to information about the called URL, the HTTP method used, and the response code.
All logs are preceded by the name of the service we are communicating with.


To prevent redundancy in logging code across multiple clients, we can centralize it and reuse it.
Error logging is managed within the ```handleHttpResponseAsList``` method.
The only thing the developer needs to do is provide a business-oriented description of the failure using the ```failureMessage``` parameter.
For logging technical aspects of our communication, such as the HTTP method used, the called URL, headers, and response code,
interceptors are responsible and plugged in at the client configuration level in the ```createExternalServiceApi``` method.

```kotlin
inline fun <reified T> createExternalServiceApi(
    webClientBuilder: WebClient.Builder,
    properties: ConnectionProperties,
): T =
    webClientBuilder
        .clientConnector(httpClient(properties))
        .baseUrl(properties.baseUrl)
        .defaultRequest { it.attribute(SERVICE_NAME, properties.clientName) }
        .filter(logRequestInfo(properties.clientName))
        .filter(logResponseInfo(properties.clientName))
        .build()
        .let { WebClientAdapter.create(it) }
        .let { HttpServiceProxyFactory.builderFor(it).build() }
        .createClient(T::class.java)


fun logRequestInfo(clientName: String) = ExchangeFilterFunction.ofRequestProcessor { request ->
    logger.info {
        "[$clientName] method=[${request.method().name()}] url=${request.url()} headers: ${request.headers()}"
    }
    Mono.just(request)
}

fun logResponseInfo(clientName: String) = ExchangeFilterFunction.ofResponseProcessor { response ->
    logger.info { "[$clientName] service responded with a status code= ${response.statusCode()}" }
    Mono.just(response)
}
```

Here's an example of a correctly logged interaction for successfully fetching a resource.

<img alt="Properly logged interaction" src="/img/articles/2024-03-10-rest-service-client-design-testing-monitoring/logs.png"/>

Logs are like backups.
It's only when they are needed, either because the business requests an analysis of a particular case or when resolving an incident,
that we find out if we have them and how valuable they are.

### Error handling
A significant part of the client code is dedicated to error handling.
It consists of two things: logging and throwing custom exceptions that encapsulate technical exceptions thrown by the underlying HTTP client.
The very name of such a custom exception tells us exactly what went wrong.
Additionally, based on these exceptions, visualizations can be created to show the state of our integration.

When writing client code, we aim to highlight maximally how we send/retrieve data and hide the “noise“ that comes from error handling.
The error handling is quite extensive but generic enough that the resulting code can be written once and reused when creating subsequent clients.
In the case of service client using WebClient, error handling is located in the methods:```handleHttpResponseAsList```, ```handleHttpResponseAsEntity```, ```handleHttpResponse```.

It's important to carefully consider all the cases we want to address and test them.
A detailed description of the considered errors can be found in the **testing** section.
In essence, the more cases we evaluate and handle, the simpler the analysis of potential errors will be.

### Testing
#### Stubs
To verify different scenarios of our HTTP client, it is necessary to appropriately stub the called endpoints in tests.
For this purpose, we will use the [WireMock](https://wiremock.org/) library.


It is quite important that technical details of created stubs do not leak into the tests.
The test should describe the behavior being tested and encapsulate technical details.
Changing the framework for stubbing endpoints should not affect the test itself.
To achieve this, for each service for which we are writing a service client, we create an object of type ```StubBuilder```.
The ```StubBuilder``` allows hiding the details of stubbing and verifying the called endpoints behind a readable API.

```kotlin
stubs.orderManagementService().willReturnOrdersFor(clientId, response = ordersPlacedByPolishCustomer())
```

Reading the above code, we immediately know **which** service is being interacted with (Order Management Service) and what will be returned from it (Orders).
The technical details of the stubbed endpoint, for example, how it is done, have been abstracted into the StubBuilder object.
Tests should emphasize "what" and encapsulate "how." This way, they can serve as documentation.
The details of the stubbed endpoint are hidden behind the method ```willReturnOrdersFor```.

```kotlin
fun willReturnOrdersFor(
    clientId: ClientId,
    response: List<Order>,
) {
    WireMock.stubFor(
        getOrdersFor(clientId).willReturn(
            WireMock.aResponse()
                .withFixedDelay(responseTime)
                .withStatus(HttpStatus.OK.value())
                .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .withBody(objectMapper.writeValueAsString(response))
        )
    )
}

private fun getOrdersFor(clientId: ClientId): MappingBuilder =
    WireMock.get("/${clientId.clientId}/order")
        .withHeader(HttpHeaders.ACCEPT, WireMock.equalTo(MediaType.APPLICATION_JSON_VALUE))
```

#### Test Data

The data returned by our stubs can be prepared in three ways:
* Read the entire response from a file/string.
* Prepare the response using objects used in the service for deserializing responses from called services.
* Create a set of separate objects modeling the returned response from the service for testing purposes and use them to prepare the returned data.

Which option to choose?
To answer this question, one should analyze the advantages and disadvantages of each.

##### A. Read response from a file/string.
Creating responses is very fast and simple.
It allows **verifying the contract** between the client and the supplier (at least at the time of writing the test).
Imagine that during refactoring, one of the fields in the response object accidentally changes.
In such a case, client tests will detect the defect before the code reaches production.

On the other hand.
Keeping data in files/strings is unfortunately difficult to maintain and reuse.
Programmers often copy entire files for new tests, introducing minimal changes.
There is a problem with naming these files and refactoring them when the called service introduces an incompatible change.


##### B. Use existing response objects
It allows writing one-liner, readable assertions and maximally reusing already created data, especially using [test data builders](https://www.natpryce.com/articles/000714.html).

```kotlin
    @Test
    fun `should return orders for a given clientId`(): Unit = runBlocking {
        // given
        val clientId = anyClientId()
        val clientOrders = OrderManagementServiceFixture.ordersPlacedByPolishCustomer(clientId = clientId.toString())
        stubs.orderManagementService().willReturnOrdersFor(clientId, response = clientOrders)

        // when
        val response = orderManagementServiceClient.getOrdersFor(clientId)

        // then
        response shouldBe clientOrders
    }

```
However, a defect in the form of a **contract violation** between the client and supplier won't be caught.
As a result, we might have perfectly tested communication in integration tests that will not work in production.

##### C. Create separate response objects
It has all the advantages of options A and B, including maintainability, reusability, and verification of the contract between the client and the supplier.
Unfortunately, maintaining a separate model for testing purposes comes with some overhead and requires discipline on the developers' side, which can be challenging to maintain.

Which option to choose? Personally, I prefer a hybrid of options A and B.
For the purpose of testing the “happy path“ in client tests, I return a response that is entirely stored as a string (alternatively, it can be read from a file).
Such a test allows not only to verify the contract but also the correctness of deserializing the received response into an object.

In other tests (cache, adapter), as well as at the end-to-end level,
I create responses returned by the stubbed endpoint using the same objects to which the received response will be deserialized.

It's worthwhile to extract sample test data into a dedicated class, such as a Fixture class, for each integration (for example ```OrderManagementServiceFixture```).
This allows for better reuse of existing code and enhances the readability of the tests themselves.

#### Test Scenarios
##### Happy Path
Fetching a resource — verification whether the client can retrieve data from the previously stubbed endpoint and deserialize it into a response object.

```kotlin
@Test
fun `should return orders for a given clientId`(): Unit = runBlocking {
        // given
        val clientId = anyClientId()
        stubs.orderManagementService().willReturnOrdersFor(clientId, response = ordersPlacedByPolishCustomer())

        // when
        val response = orderManagementServiceClient.getOrdersFor(clientId)

        // then
        response.size shouldBe 1
        response[0].orderId shouldBe "7952a9ab-503c-4483-beca-32d081cc2446"
        response[0].categoryId shouldBe "327456"
        response[0].countryCode shouldBe "PL"
        response[0].clientId shouldBe "1a575762-0903-4b7a-9da3-d132f487c5ae"
        response[0].price.amount shouldBe "1500"
        response[0].price.currency shouldBe "PLN"
}
```

The assertion section might seem a bit intimidating, but it's a result of the structure of the response object,
the way test data was prepared, and what we want to verify. An essential part of the happy path test is the verification of the contract between the client
and the supplier. The ```ordersPlacedByPolishCustomer``` method returns a sample response guaranteed by the supplier (Order Management Service).
On the client side of this service, its verification is performed in the test. We explicitly copy fragments of the contract
from the ```ordersPlacedByPolishCustomer``` method into the expected places in the response object in the assertion section.
This duplication is intentional and desired. It is precisely this duplication that allows detecting a potential defect in breaking the contract
that may occur due to errors in the response object structure on the client side.


Sending a resource — verification whether the client sends data to the specified URL in a format acceptable by the previously stubbed endpoint.

```kotlin
@Test
fun `should successfully publish InvoiceCreatedEvent`(): Unit = runBlocking {
    // given
    val invoiceCreatedEvent = HermesFixture.invoiceCreatedEvent()
    stubs.hermes().willAcceptInvoiceCreatedEvent()

    // when
    hermesClient.publish(invoiceCreatedEvent)

    // then
    stubs.hermes().verifyInvoiceCreatedEventPublished(event = invoiceCreatedEvent)
}
```

Stubbed endpoints for methods accepting request bodies (e.g., POST, PUT) should not verify the values of the received request body but only its <ins>structure</ins>.

```kotlin
fun willAcceptInvoiceCreatedEvent() {
    WireMock.stubFor(
        invoiceCreatedEventTopic()
            .withRequestBody(WireMock.matchingJsonPath("$.invoiceId"))
            .withRequestBody(WireMock.matchingJsonPath("$.orderId"))
            .withRequestBody(WireMock.matchingJsonPath("$.timestamp"))
            .willReturn(
                WireMock.aResponse()
                    .withFixedDelay(responseTime)
                    .withStatus(HttpStatus.OK.value())
            )
    )
}
```

We verify the content of the request body in the assertion section.
Here, we also want to hide the technical aspects of performing assertions behind a method.

```kotlin
stubs.hermes().verifyInvoiceCreatedEventPublished(event = invoiceCreatedEvent)


fun verifyInvoiceCreatedEventPublished(event: InvoiceCreatedEventDto) {
    WireMock.verify(1,
        WireMock.postRequestedFor(WireMock.urlPathEqualTo("/topics/${HermesApi.TOPIC_INVOICE_CREATED_EVENT}"))
            .withRequestBody(WireMock.matchingJsonPath("$.invoiceId", WireMock.equalTo(event.invoiceId)))
            .withRequestBody(WireMock.matchingJsonPath("$.orderId", WireMock.equalTo(event.orderId)))
            .withRequestBody(WireMock.matchingJsonPath("$.timestamp", WireMock.equalTo(event.timestamp)))
    )
}
```

Combining stubbing and request verification in one method is not recommended because it can lead to a less comfortable developer experience (DX).
Creating stubs in this way makes their usage less convenient since not every test requires detailed verification of what is being sent in the request body.
The vast majority of tests will stub the endpoint based on the principle:
accept a given request as long as its structure is preserved and will verify hypotheses other than the content of the request body (mainly end-to-end tests).

#####  Client-side errors

For 4xx type errors, we want to verify the following cases:
* The absence of the requested resource signaled by the response code 404 and a custom exception ```ExternalServiceResourceNotFoundException```
* Validation error signaled by the response code 422 and a custom exception ```ExternalServiceRequestValidationException```
* Any other 4xx type errors  should be cast to an ```ExternalServiceClientException```

```kotlin

    @ParameterizedTest(name = "{index}) http status code: {0}")
    @MethodSource("clientErrors")
    fun `when receive response with 4xx status code then throw exception`(
        exceptionClass: Class<Exception>,
        statusCode: Int,
        responseBody: String?,
    ): Unit = runBlocking {
        // given
        val clientId = anyClientId()
        stubs.orderManagementService().willReturnResponseFor(clientId, status = statusCode, response = responseBody)

        // when
        val exception = shouldThrowAny {
            orderManagementServiceClient.getOrdersFor(clientId)
        }

        // then
        exception.javaClass shouldBeSameInstanceAs exceptionClass
        exception.message shouldContain clientId.clientId.toString()
        exception.message shouldContain properties.clientName
    }
```

In distributed systems, a [404](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404) response code is quite common and may result from temporary inconsistency across the entire system.
Its occurrence is signaled by the ```ExternalServiceResourceNotFoundException``` exception and a warning-level log.
Here, we are more interested in the scale of occurrences than analyzing individual cases.

The situation looks a bit different in the case of responses with a code of [422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422).
If the request is rejected due to validation errors, either our service has a defect and produces incorrect data,
or the data comes from another service (which is why it's crucial to log what we receive from external services).
Alternatively, the error may be on the recipient side in the logic validating the received request. It's worth analyzing each such case, which is why
errors of this type are logged at the error level and signaled by the ```ExternalServiceRequestValidationException``` exception.

Other errors from the 4xx family occur much less frequently.
They are all marked by the ```ExternalServiceClientException``` exception and logged at the error level.

##### Server-side errors
Regardless of the reason for a 5xx error, all of them are logged at the warn level because we have no control over them.
They are signaled by the ```ExternalServiceServerException``` exception. Similar to 404 errors, we are more interested in aggregate information
about the number of such errors rather than analyzing each case individually, hence the warn log level.

In tests, we consider two cases because the response from the service may or may not have a body.
If the response has a body, we want to log it.

##### Read Timeout
If the configuration of our HTTP client specifies a timeout for the response time,
it's worthwhile to write an integration test that verifies the client's configuration. Simulating the delay of the stubbed endpoint can be achieved
using the ```withFixedDelay``` method from wiremock.

```kotlin
    @Test
    fun `when service returns above timeout threshold then throw exception`(): Unit = runBlocking {
        // given
        val clientId = anyClientId()

        stubs.orderManagementService()
            .withDelay(properties.readTimeout.toInt())
            .willReturnOrdersFor(
                clientId,
                response = ordersPlacedByPolishCustomer(clientId = clientId.toString())
            )

        // when
        val exception = shouldThrow<ExternalServiceReadTimeoutException> {
            orderManagementServiceClient.getOrdersFor(clientId)
        }
        // then
        exception.message shouldContain clientId.clientId.toString()
        exception.message shouldContain properties.clientName
    }
```

No, this is not testing properties in tests.
It is a verification to ensure that the configuration derived from properties has indeed been applied to the given client.
Ensuring a response within a specified time frame might be part of non-functional requirements and warrants testing.

##### Invalid Response Body
Considered cases:
* Response body does not contain required field.
* Response body is empty.
* Response has an incorrect format.

Errors of this type are signaled through ```ExternalServiceIncorrectResponseBodyException``` and logged at the error level.


### Metrics
When dealing with HTTP clients, it's essential to monitor several aspects: response times, throughput, and error rates.
To differentiate metrics generated by different clients easily, it's advisable to include a ```service.name``` tag with the respective client's name.

In HTTP clients offered by the Spring framework (WebClient, RestClient),
metrics are enabled out-of-the-box if we create them using predefined builders (WebClient.Builder, RestClient.Builder).
However, for other technologies, third-party solutions must be employed.

#### Response Time
Measuring the response time of HTTP clients allows us to identify bottlenecks.
At which percentile should we set such a metric?
Generally, the more requests a client generates, the higher the percentile we should aim for.
Sometimes, issues become visible only at high percentiles (P99, P99.9) for a very high volume of requests.

<img alt="Response Time" src="/img/articles/2024-03-10-rest-service-client-design-testing-monitoring/response_time.png"/>

#### Throughput
Number of requests that our application sends to external services per second (RPS).
An auxiliary metric for the response time metric, where response time is always considered in the context of the generated traffic.

<img alt="Throughput" src="/img/articles/2024-03-10-rest-service-client-design-testing-monitoring/rps.png"/>

#### Error Rate
Counting responses with codes 4xx/5xx.
Here, we are interested in visualizing how many such errors occurred within a specific timeframe.
The number of errors we analyze depends on the overall traffic, therefore, both metrics should be expressed in the same units, usually requests per second.
For high traffic and a small number of errors, we can expect that the presented values will be in the order of thousandths.

<img alt="Error Rate" src="/img/articles/2024-03-10-rest-service-client-design-testing-monitoring/errors.png"/>

## Summary
[Microservices Architecture](https://martinfowler.com/articles/microservices.html) relies heavily on network communication.
The most common method of communication is REST API calls between different services.
Writing integration code involves more than just invoking a URL and parsing a response.
Logs, error handling, and metrics are crucial for creating a stable and fault-tolerant microservices environment.
Developers should have tools that take care of these aspects, enabling fast and reliable development of such integrations.
However, tools alone are insufficient. We also need established rules and guidelines that allow us to write readable and maintainable code,
both in production and tests.


## Code examples
To explore comprehensive examples, including the usage of WebClient and other HTTP clients, check out [the GitHub repository](https://github.com/Klimiec/webclients).
