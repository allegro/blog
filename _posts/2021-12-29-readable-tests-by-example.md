---
layout: post
title: "Make your tests readable by example"
author: [kamil.jedrzejuk]
tags: [tech, backend, testing, java, groovy, tdd, bdd, ddd]
---

Have you ever worked on a project where after downloading the code from the repository you start to wonder what business requirements are hidden under the layer of unreadable tests?

Or maybe you are currently wondering how to test a new feature that you have been entrusted to implement?

Nothing is more frustrating than a code that we cannot control, and over time it becomes so troublesome that no one bothers about it too much.

People do not pay enough attention to such a project and subsequent tests, if any, duplicate the shortcomings of all the previous ones in the legacy.

In this article, I will show you how to disenchant this miserable state of affairs with a few simple tips and I will invite you to approach the tests in a completely different way and create their new edition.

## Hello domain!
The domain that will serve us as a background will not be too complicated, but at the same time not simple enough to actually be able to capture the benefit for which it is worth investing more time and effort in writing tests that are clear and easy to develop further.

For the purpose of presenting to you a domain that is neither too complicated nor too simple, I will use a model of a vinyl records online shop. (I tried to create a domain which is universal and intuitive at the same time.)

Let’s assume that we have the following very preliminary and explicitly written general business assumptions.

```text
An online store sells vinyl records. Each order is delivered by a courier company cooperating with the store.

The cost of delivery is charged when the customer pays for the order.

The cost of delivery is always collected from the supplier's system (the courier's system).

In the event of its unavailability (e.g. when the external courier system cannot provide the cost amount),
we can assume that the cost of delivery is always a fixed amount of EUR 20.

We distinguish between two types of clients: STANDARD and VIP.

If the order is processed for a customer with a VIP status or the value of the order exceeds a certain amount
according to the running promotional campaign (current price list configuration), the order will be delivered free of charge.

Additionally, for the VIP customer, a free music track should be sent to their mailbox after the payment of the order.

After paying for the order, no modifications can be made.
```
Such assumptions can be translated into one of the BDD-style scenarios:
<img alt="API package structure" src="/img/articles/2021-12-29-readable-tests-by-example/1.png" title="Scenario 1.1">
Scenario 1.1

### Architecture

The structure of the code reflects the architecture that was adopted during the implementation works.
The application is a modular monolith written based on the architectural style of Ports & Adapter, as well as the Domain Driven Design approach.

<img alt="API package structure" src="/img/articles/2021-12-29-readable-tests-by-example/2.png"/>
We can distinguish the following packages:
* catalogue: reflects the catalogue of products with their unit prices

* client: provides information on client scoring (VIP, STANDARD)

* common: it contains common concepts, objects that appear in other contexts, e.g. the Money class

* delivery: calculates the delivery price based on the defined policy

* order: this is where the logic related to the user's order is located, such as the amount of payment, or the ability to find them among other orders

* sales: provides information on types promotions (e.g. price list configuration), especially the minimum value order needed for free delivery

As the order-related domain is the most complex, it actually coordinates the entire purchasing process, and thus it should provide a comprehensive example for our further consideration.

## How can we test such code?

Each design must feature certain guidelines, which is also the case in choosing the testing methodology.
In IT literature, we can probably find many interesting references to how we should test an application code, nevertheless, in this article I am going to show you how, on a daily basis, me and other teams at Allegro approach this issue in our work.

Below I have listed the main assumptions that will guide us throughout the rest of the article:

* Tests should be a living documentation describing the real requirements in the form of clear scenarios and should be easy to understand for every person who joins the project;

* Application will be tested through a black-box approach that examines the functionality of the application without looking into its internal structures or behavior. Thanks to this we focus on the functionality of what we are testing and not on the details of the implementation itself;

* Adding a new test to the existing scenario should not be difficult, and should be based on the existing ready-to-use concepts which can also be easily modified.

## Naive approach - or how not to write tests

As I mentioned earlier, tests should be a living documentation of business requirements. It is typical of each documentation that you have to read and understand it first. It's easy to guess that this shouldn't be too much of a problem for a potentially new person on the team.

Let's take a closer look at Scenario 1.1, at the very beginning of our article, implemented in the form of an acceptance test. This is of course a sample code that could be created in projects where no special attention is paid to the quality of the provided test code. I would not recommend this type of testing.


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
              .withBody(
                """{
                      "reputation": "VIP",
                      "clientId": "${CLIENT_ID_1}"
                   }"""
              )
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
