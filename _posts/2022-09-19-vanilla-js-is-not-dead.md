---
layout: post
title: VanillaJS is not dead! Microfrontends without web performance issues.
author: krzysztof.mikuta
tags: [tech, frontend, microservices, webperf, javascript]
---
Building a complex web platform can be a real challenge, especially when parts of it are delivered by independent teams.
Picking out the correct architecture is crucial, but maintaining it can be even more challenging.
Frontend microservices, aka microfrontends, is an architecture that gives a lot of flexibility,
but can cause performance issues in the future, if not managed well. This article presents an approach to the
microfrontends architecture to keep the frontend technology stack efficient based on the complexity of user interface.

## Introduction
It’s 2022. In the frontend world, we have at least four major frameworks and libraries that have been around for a while
and provide great resources to build fast and responsive user interfaces. The idea of delivering frontend components in
VanillaJS seems to be pointless. Why should I even think about getting rid of the great features provided by well known,
precisely documented and strongly supported mature libraries? Well, as always, it pretty much depends on
the architecture. You have a single big frontend application running in React? Great! You have a couple applications
with a bunch of shared components inside Angular monorepo? Good for you! But what if you have a big platform with
huge traffic, where frontend features are being delivered as independent fragments by independent teams across
the whole company? Well, let’s talk about the last option and go through some reasonable use cases for VanillaJS/TS
as Allegro platform is built upon the frontend microservices.

## Dealing with the frontend microservices architecture
The idea of splitting up the frontend of a big e-commerce platform into smaller pieces has been described in the article
[Managing Frontend in the Microservices Architecture](https://blog.allegro.tech/2016/03/Managing-Frontend-in-the-microservices-architecture.html).
It has been 6 years since the article appeared and even more since the architecture was implemented in Allegro.
We can say that it works pretty well for us. As software engineers, we don’t need to worry about things like routing,
SSR or monitoring, because it is already served by Opbox. Also, we have overcome the problems the architecture causes
and implemented efficient solutions. One problem has been described in the article
[CSS Architecture and Performance in Micro Frontends](https://blog.allegro.tech/2021/07/css-architecture-and-performance-of-micro-frontends.html).
To clear things up a little bit, imagine building a page made of tens of components, delivered by independent teams.
Every component, even the simplest one was implemented using one of the popular libraries. Seems harmless, but it can
truly hurt web performance. Rendering plain html on a server is much faster than evaluation of library mechanisms
to produce a static markup [(source)](https://allegro.pl). Moreover, client bundles need to be fetched in a browser,
but they are pretty heavy as they include not only the custom code, but the libraries’ code as well…
It’s going to take even more time when the internet connection is weak (try setting up throttling in the dev tools).
Well, undeniably working with distributed components requires a lot of discipline. Also, monitoring and measuring is
pretty important to figure out if the components the team takes care of perform well. If you want to learn more,
take a look at the article [Measuring Web Performance](https://blog.allegro.tech/2021/06/measuring-web-performance.html).
How much discipline do you need to keep the system fast and efficient? - enough to have a reasonable approach to pick
out the correct technology to solve the problem. You know you’re asking for trouble, when you decide to use a complex
rendering library for rendering static labels that don’t behave in a reactive way. What could you do instead?
Just map data to a plain html! This is the case for VanillaJS. In the next paragraph, I’ll present and discuss
the approach we use on our team.
