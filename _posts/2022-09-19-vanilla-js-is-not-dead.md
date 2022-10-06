---
layout: post
title: VanillaJS is not dead! Microfrontends without web performance issues.
author: krzysztof.mikuta
tags: [tech, frontend, microservices, webperf, javascript]
---
Building a complex web platform can be a real challenge, especially when parts of it are delivered by independent teams.
Picking out the correct architecture is crucial, but maintaining it can be even more challenging.
Frontend microservices, aka microfrontends, is an architecture that gives a lot of flexibility, but can cause
performance issues in the future, if not managed well. This article presents an approach to the microfrontends
architecture to keep the frontend technology stack efficient based on the complexity of user interface.

## Introduction
It‘s 2022. In the frontend world, we have at least four major frameworks and libraries that have been around for a while
and provide great resources to build fast and responsive user interfaces. The idea of delivering frontend components in
VanillaJS seems to be pointless. Why should I even think about getting rid of the great features provided by well known,
precisely documented and strongly supported mature libraries? Well, as always, it pretty much depends on the
architecture. You have a single big frontend application running in React? Great! You have a couple applications with
a bunch of shared components inside Angular monorepo? Good for you! But what if you have a big platform with huge
traffic, where frontend features are being delivered as independent fragments by independent teams across
the whole company? Well, let‘s talk about the last option and go through some reasonable use cases for VanillaJS/TS as
Allegro platform is built upon the frontend microservices.

## Dealing with the frontend microservices architecture
The idea of splitting up the frontend of a big e-commerce platform into smaller pieces has been described in
the article [Managing Frontend in the Microservices Architecture](https://blog.allegro.tech/2016/03/Managing-Frontend-in-the-microservices-architecture.html).
It has been 6 years since the article appeared and even more since the architecture was implemented in Allegro.
We can say that it works pretty well for us. As software engineers, we don‘t need to worry about things like routing,
SSR or monitoring, because it‘s already served by Opbox. Also, we have overcome the problems the architecture causes
and implemented efficient solutions. One problem has been described in the article
[CSS Architecture and Performance in Micro Frontends](https://blog.allegro.tech/2021/07/css-architecture-and-performance-of-micro-frontends.html).
To clear things up a little bit, imagine building a page made of tens of components, delivered by independent teams.
Every component, even the simplest one was implemented using one of the popular libraries. Seems harmless, but it can
truly hurt web performance. Rendering plain html on a server is much faster than evaluation of library mechanisms to
produce a static markup. Moreover, client bundles need to be fetched in a browser, but they are pretty heavy as they
include not only the custom code, but the libraries‘ code as well… It‘s going to take even more time when the internet
connection is weak (try setting up throttling in the dev tools). Well, undeniably working with distributed components
requires a lot of discipline. Also, monitoring and measuring is pretty important to figure out if the components
the team takes care of perform well. If you want to learn more, take a look at the article
[Measuring Web Performance](https://blog.allegro.tech/2021/06/measuring-web-performance.html).
How much discipline do you need to keep the system fast and efficient? — enough to have a reasonable approach to
pick out the correct technology to solve the problem. You know you‘re asking for trouble, when you decide to use
a complex rendering library for rendering static labels that don‘t behave in a reactive way. What could you do instead?
Just map data to a plain html! This is the case for VanillaJS. In the next paragraph, I‘ll present and discuss
the approach we use on our team.

## Pick the right technology
For organizational purposes, we decided to define three types of complexity of UI components and assigned
three technology stacks that are suitable to solve different kinds of problems. Let’s dive into the details.

### Simple UI Component
This one doesn’t do anything spectacular. In most cases, it’s entirely rendered on a server and has no
client side scripting, or it may have some simple event handling. You can easily navigate through the platform using
just an html anchor, can’t you? Also, css is so powerful nowadays that javascript is not always necessary to implement
dynamic behaviors in browsers. The approach for such a component is simple: take the response of the backend service,
write some html and css representing this data and send it to the client.

### UI Component that is reactive
In this case, the component is rendered on the server side, but the client side scripts run in a browser
to provide reactivity. Partial changes of the state require updating the existing parts of the DOM. The challenge here
is to implement a fine-grained reactivity mechanism, organize the code in a functional manner and separate side effects.
The first thing can be easily handled using reactive streams like [xstream](https://github.com/staltz/xstream),
which is lighter than the well known rxjs, but still powerful. To keep code in a functional manner we borrowed
the [Model-View-Intent pattern from cycle.js](https://cycle.js.org/model-view-intent.html) and adjusted it to our case,
where the html is provided by the server and “hydrated” on the client side. The idea is simple: we mount event handlers
in Intent, map it to state in Model and react to changes in View. At the end of the system there are side effects
that run as a result of reactive subscriptions inside View. It’s still vanilla js/ts on the server side and
vanilla js/ts with a touch of reactivity on the client§ side.

###
This one can be rendered on the server side, but then always hydrates on the client side. It can also be entirely
rendered on the client side, forming a single-page application. It’s strongly reactive, changes its state constantly
and re-renders. Also, state changes affect many parts of the DOM. You surely know it is a great use case for libraries
like React, where state changes trigger a reconciliation algorithm, which figures out what has changed and operates on
an effective layer called Virtual DOM. I don’t think this approach requires any more explanation, as it’s the most
popular approach in the frontend world nowadays. We just write one code, run renderToString() on a server and hydrate()
on a client, that’s it.

## Conclusions
The presented approach may sound artificially complicated, but it does do its job. Using a sledgehammer to crack a nut
causes web performance issues that can go even further in a distributed environment. Spending a little bit more time on
planning features to pick an effective technology definitely pays off! Here are some conclusions based on our experience
we would like to share:
- Don’t reinvent the wheel! Look for small, stable, well-supported packages in the npm registry.
Use [bundlephobia.com](https://bundlephobia.com/) to analyze them and look for alternatives if needed.
- If code complexity grows, use a library/framework. Don’t write your own one! I know it’s tempting and trendy,
but you will end up maintaining this code instead of focusing on business features.
- Monitor bundle sizes to ensure your code transpiles efficiently. You will figure out which expressions add more code
to the bundle. You can set up extra tests for checking bundle sizes during your build pipeline to ensure you’re not
running out of limits.
- Separate side effects like DOM manipulations from a business logic. It will make the code more predictable
and easily testable. There are a bunch of the patterns and state management libraries that can help you.
- Respond fast by rendering on the server side, and hydrate wisely on the client side. If the component you create
is not reactive, make it a server component that does not need to hydrate on a client. It’s a great way to optimize
the TTI metric.
