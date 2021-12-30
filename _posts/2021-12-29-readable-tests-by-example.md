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

<img alt="API package structure" src="/img/articles/2021-12-29-readable-tests-by-example/1.png"/>

### Architecture

The structure of the code reflects the architecture that was adopted during the implementation works.
The application is a modular monolith written based on the architectural style of Ports & Adapter, as well as the Domain Driven Design approach.



