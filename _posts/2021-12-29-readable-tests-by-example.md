---
layout: post
title: "Make your tests readable by example"
author: [kamil.jedrzejuk]
tags: [tech, backend, testing, java, groovy, tdd, bdd, ddd]
---

Have you ever worked on a project where after downloading the code from the repository you start to wonder what business
requirements are hidden under the layer of unreadable tests? \
Or maybe you are currently wondering how to test a new feature that you have been entrusted to implement?

Nothing is more frustrating than code that we cannot control, and over time it becomes so troublesome that no one
bothers about it too much. People do not pay enough attention to such a project and subsequent tests, if any, duplicate
the shortcomings of all the previous ones in the legacy.

In this article I will show you how to disenchant this miserable state of affairs with a few simple tips and I will
invite you to approach the tests in a completely different way and create their new edition.

## Hello domain!

The domain that will serve us as a background will not be too complicated, but at the same time not simple enough to
actually be able to capture the benefit for which it is worth investing more time and effort in writing tests that are
clear and easy to develop further.

For the purpose of presenting to you a domain that is neither too complicated nor too trivial, I will use a model of a
vinyl records online shop (I tried to create a domain which is universal and intuitive at the same time).

Let’s assume that we have the following very preliminary and explicitly written general business assumptions.

```text
An online store sells vinyl records. Each order is delivered by a courier company cooperating with the store.

The cost of delivery is charged when the customer pays for the order.

The cost of delivery is always collected from the supplier's system (the courier's system).

In the event of its unavailability (e.g. when the external courier system cannot provide the cost amount),
we can assume that the cost of delivery is always a fixed amount of EUR 20.

We distinguish between two types of clients: STANDARD and VIP.

If the order is processed for a customer with a VIP status or the value of the order exceeds a certain amount
according to the running promotional campaign (current price list configuration), the order will be delivered free
of charge.

Additionally, for the VIP customer, a free music track should be sent to their mailbox after the payment of the order.

After paying for the order, no modifications can be made.
```

Such assumptions can be translated into one of the BDD-style scenarios:
<img alt="API package structure" src="/img/articles/2021-12-29-readable-tests-by-example/1.png" title="Scenario 1.1">
Scenario 1.1

### Architecture

The structure of the code reflects the architecture that was adopted during the implementation works. The application is
a modular monolith written based on the architectural style
of [Ports & Adapter](https://blog.allegro.tech/2020/05/hexagonal-architecture-by-example.html), as well as
the [Domain Driven Design](https://www.dddcommunity.org/learning-ddd/what_is_ddd/) approach.

<img alt="API package structure" src="/img/articles/2021-12-29-readable-tests-by-example/2.png"/>

We can distinguish the following packages:

* `catalogue`: reflects the catalogue of products with their unit prices

* `client`: provides information on client scoring (VIP, STANDARD)

* `common`: contains common concepts, objects that appear in other contexts, e.g. the Money class

* `delivery`: calculates the delivery price based on the defined policy

* `order`: keeps the logic related to the user's order, such as the amount of payment, or the ability
  to find them among other orders

* `sales`: provides information on types promotions (e.g. price list configuration), especially the minimum value order
  needed for free delivery

As the order-related domain is the most complex, it actually coordinates the entire purchasing process, and thus it
should provide a comprehensive example for our further consideration.

## How can we test such code?

Each design must feature certain guidelines, which is also the case in choosing the testing methodology. In IT
literature, we can probably find many interesting references to how we should test an application code, nevertheless, in
this article I am going to show you how, on a daily basis, me and other teams at Allegro approach this issue in our
work.

Below I have listed the main assumptions that will guide us throughout the rest of the article:

* Tests should be a living documentation describing the real requirements in the form of clear scenarios and should be
  easy to understand for every person who joins the project;

* Application will be tested through a black-box approach that examines the functionality of the application without
  looking into its internal structures or behavior. Thanks to this we focus on the functionality of what we are testing
  and not on the details of the implementation itself;

* Adding a new test to the existing scenario should not be difficult, and should be based on the existing ready-to-use
  concepts which can also be easily modified.

## Naive approach - or how not to write tests

As I mentioned earlier, tests should be a living documentation of business requirements. It is typical of each
documentation that you have to read and understand it first. It's easy to guess that this shouldn't be too much of a
problem for a potentially new person on the team.

Let's take a closer look at `Scenario 1.1`, at the very beginning of our article, implemented in the form of an
acceptance test. This is of course sample code that could be created in projects where no special attention is paid to
the quality of the provided test code. I would not recommend this type of testing.

```groovy
 def "shouldn't charge for delivery when the client has a VIP status"() {
    given:
        def body = """
          {
             "clientId":"${CLIENT_ID_1}",
             "items":[
                {
                   "itemUnitPrice":{
                      "productId":"${PRODUCT_ID_1}",
                      "price":{
                         "amount":"40.00",
                         "currency":"EUR"
                      }
                   },
                   "quantity":1
                }
             ]
          }
        """.toString()
        def requestEntity = buildHttpEntity(body, APPLICATION_JSON.toString(), APPLICATION_JSON.toString())
        def response = restTemplate.exchange(localUrl("/orders/$ORDER_ID_1"), PUT, requestEntity, Map)
    and:
        assert response.statusCode == HttpStatus.CREATED

    and:
        wireMockServer.stubFor(
            get("/reputation/${CLIENT_ID_1}")
                .withHeader(ACCEPT, equalTo(APPLICATION_JSON.toString()))
                .willReturn(aResponse()
                    .withBody("""{
                                   "reputation": "VIP",
                                   "clientId": "${CLIENT_ID_1}"
                                 }""")
                    .withHeader(CONTENT_TYPE, APPLICATION_JSON.toString())
                )
        )
    when:
        body = """
          {
             "clientId": "${CLIENT_ID_1}",
             "cost": { "amount": "40.00", "currency": "EUR" }
          }
          """.toString()
        requestEntity = buildHttpEntity(body, APPLICATION_JSON.toString(), APPLICATION_JSON.toString())
        response = restTemplate.exchange(localUrl("/orders/$ORDER_ID_1/payment"), PUT, requestEntity, Map)

    then:
        response.statusCode == HttpStatus.ACCEPTED

    and:
        1 * domainEventPublisher.publish(_ as Events.OrderPaid)

    and:
        pollingConditions.eventually {
            1 * freeMusicTrackSender.send(new ClientId(CLIENT_ID_1))
        }
}
// some code omitted
```

The above code is not easy to analyze as it requires the reader to focus on too many technical and implementation
details, such as:

* data exchange format JSON,
* HTTP data exchange protocol: PUT method, response code,
* REST architectural style,
* classes derived from frameworks such as RestTemplate, PollingConditions.

Undoubtedly, it is far from the appearance of the original `Scenario 1.1`. It contains many concepts that do not belong
to the domain language that obscure the presence of natural expressions that we use in conversations with business
stakeholders, for instance “event publisher” or “mock server”.

Another disadvantage of this code is that it is not easily adaptable to further development, e.g. in the event of a
change in business requirements when it is necessary to modify or add another test.

The conscious reader might notice that the example of our imperfect test is maybe too exaggerated and that each section
of the ‘given’/‘when’/’then’ blocks, etc. could be extracted by the use of a separate private method. Certainly, this
procedure may result in some improvement of the code quality, but nevertheless such an approach still has many
drawbacks:

* the test class still contains code related to the technical implementation;
* if another test class uses a similar subset of functionalities, then sooner or later, there will be a need to copy
  such a method;
* what if I would like to change, for example, the library for mocking calls to another type of library?

Let’s take a closer look at a unit test this time. It covers a narrower range of requirements because, e.g., it does not
check whether the client has been sent a free music track. Try to find similar defects in it as in the acceptance test.

```groovy
final Money EUR_40 = Money.of("40.00", "EUR")
final ClientId CLIENT_ID = new ClientId("1")
final Vinyl VINYL_1 = new Vinyl(new VinylId("1"), EUR_40)
final Quantity ONE = new Quantity(1)
final OrderId ORDER_ID = new OrderId("1")
final OrderDataSnapshot UNPAID_ORDER_EUR_40 = orderFactory.create(ORDER_ID, CLIENT_ID, Maps.of(VINYL_1, ONE), true)
    .toSnapshot()
final ClientReputation VIP = ClientReputation.vip(CLIENT_ID)
final PayOrderCommand PAY_FOR_ORDER_EUR_40 = new PayOrderCommand(ORDER_ID, EUR_40)

def "shouldn't charge for delivery when the client has a VIP status"() {
    given:
        orderRepository.findBy(ORDER_ID) >> Optional.of(UNPAID_ORDER_EUR_40)

    and:
        clientReputationProvider.get(CLIENT_ID) >> VIP

    when:
        def result = paymentHandler.handle(PAY_FOR_ORDER_EUR_40)

    then:
        result.isSuccess()

    and:
        1 * domainEventPublisher.publish({ OrderPaid event ->
            assert event.orderId() == ORDER_ID
            assert event.amount() == EUR_40
            assert event.delivery().cost() == Money.ZERO
            assert event.when() == CURRENT_DATE
        })
}
```

In this case, it may seem that test is much better, because it is simpler and easier to read, but with a more in-depth
analysis it turns out that it still does not meet the expected requirements from the “How can we test such
code?” section, because it:

* uses concepts such as repository, provider, event publisher, handler, which were not mentioned in the written business
  scenarios - these are technical implementation details;
* all the variables used are within the specification, which in the case of a multitude of tests may constitute
  additional complexity in their maintenance. Besides, it is not difficult to make a mistake here, e.g. by introducing a
  new variable that is already defined somewhere under a different name;
* is not easy to add further tests outside the specification that would need similar functionality - unfortunately, it
  will require multiple repetition of fragments of the code.

I have used two above examples of tests (acceptance and unit), to quickly highlight how many flaws the naive solution
has adopted, even though the business requirement was not too complicated. In summary, in each of the tests we have had
to take extra care of:

* manually creating objects using a constructor is not comfortable and additionally, with the large number of
  parameters, difficult to read; this also makes the tests messy and hard to maintain because changing the constructor
  makes them very fragile;
* creating body http requests using text blocks, which in the case of larger objects leads to the creation of structures
  occupying a large part of the specification;
* mocking or stubbing external dependencies using mechanisms from the framework as Stub or Mock, which can be
  comfortable but not necessarily improve the readability of the code and its further development;
* stubbing the response to external services using the library Wiremock class directly in your code test;
* checking the final state of an object by referring directly to its content in the test. With complex structures it can
  be very inconvenient and unreadable.

In the next section, I will focus on eliminating these shortcomings with a few simple solutions.

## Fixing the state of affairs

Let's look at the first test again, which was presented in the previous section “Naive Approach”. It is not too hard to
notice that the vocabulary here resembles a more natural language, used by domain experts who do not use purely
technical terms.

```groovy
class OrderPaymentAcceptanceSpec extends BaseIntegrationTest implements
    CreateOrderAbility,
    ClientReputationAbility,
    SpecialPriceProviderAbility,
    CourierSystemAbility,
    OrderPaymentAbility,
    FreeMusicTrackSenderAbility {

    def "shouldn't charge for delivery when the client has a VIP status"() {
        given:
            thereIs(anUnpaidOrder())

        and:
            clientIsVip()

        when:
            def payment = clientMakesThe(aPayment())

        then:
            assertThat(payment).succeeded()

        and:
            assertThatClientDidNotPaidForDelivery()

        and:
            assertThatFreeMusicTrackWasSentToTheClient()
    }
// other tests omitted
```

In the following part of this section, I will show you how in a few steps you can use simple concepts to arrive at this
model.

### Test Data Builder

Test Data Builder provides ready-made objects with sample data. It significantly improves the readability of the code by
replacing setter methods or invoking constructors with many parameters.

```groovy
@Builder(builderStrategy = SimpleStrategy, prefix = "with")
class CreateOrderJsonBuilder {
    String orderId = TestData.ORDER_ID
    String clientId = TestData.CLIENT_ID
    List<ItemJsonBuilder> items = [anItem().withProductId(TestData.CZESLAW_NIEMEN_ALBUM_ID).withUnitPrice(euro(40.00))]

    static CreateOrderJsonBuilder anUnpaidOrder() {
        return new CreateOrderJsonBuilder()
    }
    // some code omitted
    CreateOrderJsonBuilder withAmount(MoneyJsonBuilder anAmount) {
        items = [anItem().withProductId(TestData.CZESLAW_NIEMEN_ALBUM_ID).withUnitPrice(anAmount)]
        return this
    }

    Map toMap() {
        return [
            clientId: clientId,
            items   : items != null ? items.collect { it.toMap() } : null
        ]
    }
}
```

In the above example, the `toMap` method returns a map, which can then be turned into a body of the http request in Json
format.

The `Test Data Builder` can be used both for constructing input data at the controller level and at the level of unit
tests, e.g. by creating an object representing the initial state of the database. There is nothing to prevent us from
using this pattern, also for the construction of objects on which we make assertions.

```groovy
@Builder(builderStrategy = SimpleStrategy, prefix = "with")
class OrderPaidEventBuilder {
    String clientId = TestData.CLIENT_ID
    String orderId = TestData.ORDER_ID
    Instant when = TestData.DEFAULT_CURRENT_DATE
    Money amount = TestData.EUR_40
    Delivery delivery

    static OrderPaidEventBuilder anOrderPaidEventWithFreeDelivery() {
        anOrderPaidEvent().withFreeDelivery()
    }

    static OrderPaidEventBuilder anOrderPaidEvent() {
        return new OrderPaidEventBuilder()
    }

    OrderPaidEventBuilder withFreeDelivery() {
        delivery = Delivery.freeDelivery()
        return this
    }

    OrderPaid build() {
        return new OrderPaid(
            new ClientId(clientId),
            new OrderId(orderId),
            when,
            amount,
            delivery
        )
    }
}
```

What is worth mentioning, we use the same constants in many places, which may seem a controversial idea for many
readers. However, I decided to split them into a separate `TestData` class and based on the assumption that the class
builders are assigned default values. Thanks to this I can focus on data relevant to a given test case only. It does not
make sense to introduce unnecessary noise into the test, as it should be set up with a minimal required data set.

This pattern is also described by Nat Pryce on his [blog](http://www.natpryce.com/articles/000714.html), where you can
find a more detailed explanation.

### Ability Pattern

The `OrderPaymentAcceptanceSpec` class implements several traits with similar names ending with the word Ability. This
is another concept that I want to discuss. As we understand it, and so it is giving certain abilities to the test
scenario. As a result, with this approach, we can expand small blocks more and more.

Now, it is easy to imagine another test that needs the same ability or skill, by which we can get rid of duplicate codes
between different classes of tests.

Let's analyse an example implementation of a trait named: `CreateOrderAbility`

```groovy
trait CreateOrderAbility implements MakeRequestAbility {

    void thereIs(CreateOrderJsonBuilder anUnpaidOrder, String orderId = TestData.ORDER_ID) {
        def response = createWithGivenId(anOrder: anUnpaidOrder, orderId: orderId)
        assert response.statusCode == HttpStatus.CREATED
    }

    ResponseEntity<Map> create(CreateOrderJsonBuilder anOrder) {
        def jsonBody = toJson(anOrder.toMap())
        return makeRequest(
            url: "/orders",
            method: HttpMethod.POST,
            contentType: "application/json",
            body: jsonBody,
            accept: "application/json",
        )
    }
}
```

It extends the `MakeRequestAbility` trait responsible for building and sending an http request to a given url, which is
already served by the Spring controller, hiding all technical aspects from the reader. Moreover, the methods it exposes
in conjunction with the passed parameters invoking the static method of the test builder class, read almost like prose.
This simple procedure makes our code more expressive, making it look closer to the text from the
requirements `Scenario 1.1`.

```groovy
  def "shouldn't charge for delivery when the client has a VIP status"() {
    given:
        thereIs(anUnpaidOrder()) // -> there is an unpaid order
        // some code omitted
}
```

In the case of a unit test, such an ability may wrap the in-memory implementation of the repository.

```groovy
trait OrderAbility {

    static final OrderRepository orderRepository = new InMemoryOrderRepository()

    void thereIs(OrderDataSnapshotBuilder anOrder) {
        orderRepository.save(anOrder.build())
    }
    // some code omitted
}
```

And this time we read the beginning of the test identically:

```groovy
def "shouldn't charge for delivery when the client has a VIP status"() {
    given:
        thereIs(anUnpaidOrder()) // -> there is an unpaid order
        // some code omitted
}
```

In some cases, the `Ability pattern` can act as an assertion class, which I will mention later in the part regarding
tailor-made assertions. Often in the case of black box tests, there is a need to check additional side effects, e.g.
whether an email was sent after the purchase of the order, or whether a service was asked with the data we want. We can
then split this logic into an appropriately named Ability class method.

```groovy
trait OrderPaymentAbility implements MakeRequestAbility {

    @SpyBean
    private DomainEventPublisher domainEventPublisher

    private PollingConditions pollingConditions = new PollingConditions(timeout: 5)

    // some code omitted
    void assertThatClientDidNotPaidForDelivery(def anEvent = anOrderPaidEvent().anOrderPaidEventWithFreeDelivery()) {
        pollingConditions.eventually {
            Mockito.verify(domainEventPublisher, times(1))
                .publish(anEventBuilder.build())
        }
    }
    // some code omitted
}
```

The question is why we should make so much effort in creating our own solutions, and not use ready-made solutions directly
from the framework? Here are the arguments for:

* reusability - we can use once written ability in many places,
* extensibility - in the case of changing the library, which, for example, is used to mock other services, it is enough
  to make changes in one place,
* enriching the test with the language specific to our domain,
* we are not limited by the capabilities of a given framework, e.g. Spock doesn’t allow you to mock final Java classes,
  then we have to use an additional lib
  like [spock-mockable](https://tinyurl.com/readeable-test-by-example)
  .

### Tailor-made assertions

The last concept that I want to discuss is dedicated assertion classes. Assertion class is nothing more than a simple
class exposing methods which allow checking the input object appropriately.

In some scenarios, we would actually like to verify the data that, for example, was eventually saved in the database.
Some of our objects can be so complex that it would be inconvenient to check them directly in the test, referencing the
nested objects or iterating the collections.

```groovy
  def "should change the item quantity for unpaid order"() {
    given:
        thereIs(anUnpaidOrder()
            .withId(ORDER_ID)
            .withClientId(CLIENT_ID)
            .withItems(
                anItem()
                    .withProductId(CZESLAW_NIEMEN_ALBUM_ID)
                    .withUnitPrice(euro(35.00))
                    .withQuantity(10),
                anItem()
                    .withProductId(BOHEMIAN_RHAPSODY_ALBUM_ID)
                    .withUnitPrice(euro(55.00))
                    .withQuantity(1)
            )
        )

    when:
        changeItemQuantity(anItemQuantityChange()
            .withOrderId(ORDER_ID)
            .withProductId(CZESLAW_NIEMEN_ALBUM_ID)
            .withQuantityChange(20)
        )

    then:
        assertThatThereIsOrderWithId(ORDER_ID)
            .hasClientId(CLIENT_ID)
            .hasItemWithIdThat(CZESLAW_NIEMEN_ALBUM_ID)
            .hasUnitPrice(euro(35.00))
            .hasQuantity(20)
            .and()
            .hasItemWithIdThat(BOHEMIAN_RHAPSODY_ALBUM_ID)
            .hasUnitPrice(euro(55.00))
            .hasQuantity(1)
}
```

Apart from this, such an assertion can also be used in other places than just one test class.

## The end

I hope that by presenting the above example I have managed to show you how to use simple concepts to write or improve
tests to be more legible. Consequently, they become a living documentation of our code, which undoubtedly is a great
added value to the project that we work on.

However, if you are wondering whether it is always worth investing time in writing tests as suggested in this article,
my answer is “No”.

I hold an opinion that not every project, or even part of it, e.g. a given module, requires this approach. In the case
of simple applications with the complexity of the CRUD type, there is no need for sophisticated solutions. It is often
enough to test such an application end to end, using the simplest solutions offered by a given framework.

If you would like to have a look at the rest of the code from my example, you are welcome to have a look at
the [github repository](https://github.com/CamilYed/readable-tests-by-example).
