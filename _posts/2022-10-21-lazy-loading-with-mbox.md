---
layout: post
title: "MBox: How we solve performance issue with few line of MBox code."
author: [lukasz.solniczek]
tags: [tech, "Server-driven UI", mobile, mbox, performance]
excerpt: >
    Sometimes great results in code performance come after a small code change.
    We would like to tell you a story about how we changed the Allegro mobile homepage
    and reduced usage of Allegro service infrastructure with only a few lines of code.

---

Sometimes great results in code performance come after a small code change.
We'd like to tell you a story about how we changed the Allegro mobile homepage
and reduced usage of Allegro service infrastructure with only a few lines of code.

### The problem

The story is about the homepage in the Allegro app on [Android](https://play.google.com/store/apps/details?id=pl.allegro)
and [iOS](https://apps.apple.com/pl/app/allegro/id305659772), the first screen a user sees when opening the app.
Originally it was a long screen with a lot of content rendered with data from tens of, sometimes costly, data sources.
A lot was happening there.

It was not a big problem earlier but became one when the number of users of our applications started growing.
During one year, the number of requests sent to our infrastructure from the Allegro homepage increased drastically,
consequently becoming a performance issue.

### The solution

We have decided to split the homepage content into two parts. The first will be loaded when the user opens the app and will be available immediately.
And the second part will be loaded when the user scrolls to the end of the first part.
This technique is called lazy loading.
Lazy loading isn't something new, it is used web-wide in many places, but in our case, we had to think about it differently because …

... we build the Allego homepage in applications using **MBox**, which means that the content and screen logic is defined
entirely on the server side. We can change it without modifying the native code in the applications.


> What is **MBox**? It is our library for **Server Driven UI (SDUI)**, which we use in Allegro to create and release mobile screens
faster on both platforms (iOS and Android). It is a collection of building blocks that let us develop views and actions
that link MBox screens with other parts of the application or introduce some interaction on a screen.
If you want to learn more about MBox, you can read its introduction on our blog: [MBox: server-driven UI for mobile apps](https://blog.allegro.tech/2022/08/mbox-server-driven-ui-for-mobile-apps.html).

Implementation of lazy loading at the Allegro homepage also had to be done on the server side.
After discussing the problem and potential solution, it turned out that all the **MBox** building blocks and actions we
needed were already there on the mobile side and DSL.

We used the **Spinner** component, which shows the native spinner view in the applications, and **replaceComponent** action,
which can fetch the next portion of the mobile screen and display it in place of some other component.
The homepage endpoint had already supported pagination.

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

At the end of the first part of the Allegro homepage, we added **Spinner** component with **replaceComponent** action triggered on **Spinner** shows.

Action **replaceComponent** loads the second part of the homepage and alters **Spinner** with it.

![Lazy Loading Homepage](/img/articles/2022-10-21-lazy-loading-with-mbox/lazy-loading-homepage.png)

Thanks to modular architecture, independent elements, and a clear interface between them, all we needed to do was combine already existing mechanisms.

This change was implemented entirely on a server-side and was available on both platforms (iOS and Android) without a new application release.

These few lines of **MBox** code helped us fix our original performance problem.

Here are some results.

### The result

First, we learned about our user's interactions with the homepage.
After introducing lazy loading, only **5% of iOS** and **9% of Android** users load the second part of the Allegro homepage.
Most users do not scroll down, and loading the whole screen has wasted our resources.

The Allegro app measures **First Meaningful Paint (FMP)** for screen content. This metric tells us how fast the primary content is visible to the user.
After introducing lazy loading, **FMP** improved, and the first content is visible to users **61% faster** than before on both platforms (iOS and Android).

**FMP** improved because we reduced the response size of the Allegro homepage load by **about 90%**, and the backend rendering time by **about 56%**.

We could do that because, when we load the homepage for a user, we use **about 90% fewer** data sources (services we used to prepare data for the user) than before.

### Summary

We designed **MBox** to allow developers to create and modify mobile screens faster and easier, but we are pleased that
it is also helpful in dealing with other problems. Thanks to MBox, and its modular architecture, we were able to modify
code on the server and introduce this improvement on both platforms (iOS and Android) fast, and deliver it to most of the users of the Allegro apps without a long mobile release process.
