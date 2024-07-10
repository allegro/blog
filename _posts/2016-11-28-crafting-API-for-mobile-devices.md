---
layout: post
title: API crafted for mobile
author: [mariusz.wojtysiak]
tags: [api, rest api, mobile]
---

Are you developing a service and planning to make it publicly available? Do you want developers of mobile applications to get integrated
with your API fast and painless? Do you care how stable and predictable mobile applications using your service are?

Below you can read about a bunch of decisions concerning API architecture because of which new features in [Allegro](https://allegro.tech) mobile apps were not delivered as fast as we expected and which caused problems with stability.

## Many requests to build one view
In our backend we have a microservices architecture. Each service supports a narrow area of business logic. Let’s look at an example of
how the introduction of microservices has affected our mobile development:

![Offer details](/assets/img/articles/2016-11-28-crafting-API-for-mobile-devices/offer-handbag.png)

Above you can see Allegro application for Android presenting the offer “Woman handbag Wittchen shopper”, with a minimal delivery cost of “0.00 zł”
and seller reliability equal to “99.5%”. Offer details, delivery costs and seller rankings are supported by 3 microservices,
so a smartphone had to make 3 requests to show the above view:

- `GET /offers/{offerId}`
- `GET /delivery-prices/{delivery-list-id}`
- `GET /sellers/{sellerId}`

Mobile developer had to:

- define 3 different data models
- implement sending 3 different requests
- make 3 error handling routines
- handle view refreshing — 3 times
- requests are usually sent asynchronously — 3 async requests increase the level of complexity

The same procedure applied to all our applications: for Android, iOS and Windows Phone, so the amount of needed work was multiplied by 3.

In the microservice architecture the mobile app had to send many requests to display one view. It made our application less reliable.
That’s because phones often use poor internet connections and each additional request increases the probability of failure.

To avoid these problems, we introduced a Service [Façade](https://en.wikipedia.org/wiki/Facade_pattern) also known as
a [Backend For Frontend](http://samnewman.io/patterns/architectural/bff/) (BFF):

![Offer details](/assets/img/articles/2016-11-28-crafting-API-for-mobile-devices/BFF.png)

Now, the BFF service sends one response with all data needed by the mobile app. Of course BFF is tightly coupled with client requirements,
so it can be developed when the UX team delivers view mockups.

Owing to BFF, mobile developers integrate new features more quickly, views in mobile apps are refreshed faster (there are still 3 requests,
but these are all internal requests within the datacenter) and applications are more stable. Additionally we use fewer mobile data packets
and save phone battery.

## Lack of documentation about nullable fields
At the very beginning we didn’t care which fields in API responses could return nulls. So our swagger documentation did not have any hint about
which fields were optional. For example pure auctions on Allegro could not be bought using “buy now”, so they did not have any `buyNowPrice`.
Our swagger documentation looked like this:

![Swagger example without optional](/assets/img/articles/2016-11-28-crafting-API-for-mobile-devices/offer-no-optional.png)

Mobile developers had to predict for which fields `null` value handler need to be implemented. They made the predictions based on their
knowledge of Allegro operations. However, it was hard to find all border cases in such a big system, so the predictions were not accurate.
Users noticed it, when our application crashed from time to time.

So, we made it clear in the API documentation in which fields the `null` values should be expected. We also added a short description
for the cases that returned `null`.

![Swagger example with optional](/assets/img/articles/2016-11-28-crafting-API-for-mobile-devices/offer-optional.png)

The `optional` property appears when you omit the field name in API specification / required:
![Required in Swagger spec](/assets/img/articles/2016-11-28-crafting-API-for-mobile-devices/swagger-required.png)

The `optional` property in the documentation allows mobile developers to not have to predict where to expect nulls.
Our testers can precisely recognize corner cases and test them.

## Inconsistent error reporting
Each microservice at Allegro is developed by an independent team. After a few weeks following the introduction of the new architecture, we realized
that each service had its own way to report errors. Let's look at an example:

![Inconsistent errors handling](/assets/img/articles/2016-11-28-crafting-API-for-mobile-devices/inconsistent-errors-handling.png)

The same “Resource not found” error was signaled by each service with a different HTTP status and JSON structure.
As a result, mobile developers had to implement different error handling for every service.

Most applications communicate errors just by showing an appropriate message. In the above case, the message had to be figured out
by the mobile developer. Good practice is to deliver a user message from the service.

To make this good practice clear and alive, we introduced [REST API Guideline](http://allegro-restapi-guideline.readthedocs.io/en/latest/Error/),
where we descibed how errors should be reported.

In Allegro following JSON structure has to be returned in case of every error:

```JSON
{
    "errors": [
        {
            "userMessage": "Wybrana oferta została przeniesiona do archiwum",
            "message": "Offer not found",
            "code": "NotFoundException"
        }
    ]
}
```

where:

- `userMessage` is a message ready to be shown for a user in the user’s language
- `message` is a technical English message, for the mobile developer, often written to application log
- `code` can be used to choose a special error handling strategy, for example the CaptchaRequired code should be followed by displaying the “Captcha view” instead of the userMessage

Consistent errors reporting allowed mobile developers to implement one generic error handling procedure, which just shows a `userMesage`
delivered by the service. This is sufficient for 99% of errors. 1% of errors require special handling like redirecting the user to application
preferences or refreshing the OAuth2 token.

## Summary
In this article I presented 3 changes we have introduced into our REST API architecture, in order to speed up the delivery of new
features into mobile applications. These changes need some extra work on the backend side, but it’s usually cheaper to do it in backend
than in apps on 3 mobile platforms.

If you are curious about other good practices of designing REST API, study the full version of our
[REST API Guildeline](http://allegro-restapi-guideline.readthedocs.io/en/latest/).
