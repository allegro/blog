---
layout: post
title: "How we solved a mobile application performance issue with a few lines of code?"
author: lukasz.solniczek
tags: [tech, "Server-driven UI", mobile, mbox, performance]
excerpt: >
    Sometimes great results in code performance come with a small amount of work.
    We'd like to tell you a story about how we changed the Allegro mobile homepage
    and reduced usage of Allegro service infrastructure with only a few lines of code.

---

Sometimes great results in code performance come with a small amount of work.
We’d like to tell you a story about how we changed the [Allegro](/about-us/) mobile homepage
and reduced usage of Allegro service infrastructure with only a few lines of code.

### The problem

The story is about the homepage in the Allegro app on [Android](https://play.google.com/store/apps/details?id=pl.allegro)
and [iOS](https://apps.apple.com/pl/app/allegro/id305659772), the first screen a user sees when opening the app.
Originally it was a long screen with a lot of content rendered with data from tens of, sometimes costly, data sources (services we use to prepare data for our frontend).

A lot was happening there.

It was not a big problem earlier but became one when the number of users of our applications started growing, after the outbreak of the COVID-19 pandemic.
Within one year, the number of requests sent to our infrastructure from the Allegro homepage increased almost 3 times, consequently becoming a performance issue.

![Lazy Loading Homepage](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-rps.png)

### The idea

We decided to split the homepage content into two parts. The first would load when the user opens the app and would be available immediately.
And the second part would load when the user scrolls to the end of the first part.
This technique is called lazy loading.
It is not something new, it is used web-wide in many places, but in our case, we had to think about it differently because …

... we built the Allegro homepage in applications using **MBox**, the server-driven UI solution created at Allegro, which means that the content and screen logic is defined entirely on the server side.
Implementation of lazy loading for the Allegro homepage also had to be done on the server side.

> What is **MBox**? It is our **Server-Driven UI (SDUI)** solution, which we use at Allegro to create and release mobile screens faster on both platforms (iOS and Android). It is a collection of building blocks that let us develop views and actions that link MBox screens with other parts of the application or introduce some interaction on a screen.
If you want to learn more about MBox, you can read its introduction on our blog: [MBox: server-driven UI for mobile apps]({% post_url 2022-08-03-mbox-server-driven-ui-for-mobile-apps %}).

After discussing the problem and potential solution, it turned out that all the **MBox** building blocks and actions we
needed to implement lazy-loading with MBox were already there.

### The solution

Thanks to modular architecture, independent elements, and a clear interface between them, all we needed to do was combine already existing mechanisms.

We used the **Spinner** component, which shows the native spinner view in the applications, and **replaceComponent** action, which can fetch the next portion of the mobile screen and display it in place of some other component.
The homepage endpoint had already supported pagination.

At the end of the first part of the Allegro homepage, we added **Spinner** component with **replaceComponent** action triggered when the **Spinner** shows.

Action **replaceComponent** loads the second part of the homepage and alters **Spinner** with it.

![Lazy Loading Homepage](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-homepage.png)

This change was implemented entirely server-side and was available on both platforms (iOS and Android) **without a new application release**.

These few lines of **MBox** code helped us divide the Allegro homepage into two parts, and fix our original performance problem.

```kotlin
spinner {
    id = "spinnerID"
    actions {
        show {
            replaceComponent(componentId = "spinnerID", route = "url-to-second-part")
        }
    }
}
```

And here are some results.

### The result

We have added metrics to our lazy loading solution to gather information about how our users interact with new Allegro homepage.
We learned that only about **5% of iOS**,

![Lazy Loading mobile requests](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-mobile-requests-ios.png)

and about **10% of Android** users

![Lazy Loading mobile requests](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-mobile-requests-android.png)

load the second part of the Allegro homepage.
Most users do not scroll down, and preparing the entire homepage at once was an unnecessary use of our resources.

The Allegro app measures **First Meaningful Paint (FMP)** for screen content. This metric shows us how quickly the primary content is visible to the user.

![Lazy loading fmp](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-fmp.png)

After introducing lazy loading, **FMP** improved, and the first content is visible to users **61% faster** than before on both platforms (iOS and Android).

**FMP** improved because we reduced the response size of the Allegro homepage load by **about 90%**,

![Lazy loading response size](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-response-size.png)

and the backend rendering time by **about 56%**.

![Lazy loading render time](/assets/img/articles/2023-01-25-lazy-loading-with-mbox/lazy-loading-render-time.png)

We could do that because, when we load the homepage for a user, we use **about 90% fewer** data sources than before.

### Summary

We designed **MBox** to allow developers to create and modify mobile screens faster and easier, but we are pleased that it also helps improve app performance. Thanks to MBox, and its modular architecture, we were able to modify
code on the server and introduce this improvement on both platforms (iOS and Android) fast, and deliver it to users of the Allegro apps without a long mobile release process.
