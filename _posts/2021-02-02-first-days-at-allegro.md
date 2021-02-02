---
layout: post
title: My first days at Allegro
author: [krzysztof.przychodzki]
tags: [tech]
---

So you’re new to [Allegro](https://blog.allegro.tech/about-us/), have just finished your tech onboarding and are stunned with information overflow? Or perhaps you
are planning to join Allegro and don’t know what it looks like in here? I am about to try and describe how I felt just a few months ago and what startled or
dismayed me. I hope this short article will answer all your concerns.

But first I would like to give you a little background of my professional work life.

## Background

Long before becoming a developer, I was a chemical engineer, and I was designing distilleries, cosmetic and oil refinery plants, etc. During my work, I often
used Microsoft Excel and VBA as my main apps for solving complex problems. I enjoyed it more than the job I was assigned. So I decided to take a Java bootcamp
and afterwards I got hired by an IT company in my area. At my first IT job, I was hired as a junior, but I was already treated as a regular programmer.
It was nice, I own them a lot, but on the other hand the only feedback I got was when something was not working. From the beginning, I was fully aware of how
basic my knowledge was after the bootcamp. While catching up I realized that in this company I would not develop anymore, and I would be working with legacy
technologies throughout the rest of my career.

## A piece of cake?

The recruitment process at Allegro &mdash; let me tell you straight, is not a piece of cake. I am pretty sure that a year after the recruitment meeting you are
still going to remember the questions you were torpedoed with.

First of all &mdash; after applying, you will receive an email with all the necessary information about the recruitment process. Each step is briefly
characterized, so you know what is going to happen next and what to expect. The first step is a task on DevSkiller. Then, you will take part in technical
interviews in the form of conversation about the technologies and architecture of modern IT systems, touching on aspects of design, performance, monitoring, etc.
It was very different from the previous recruitment processes in which I sometimes spoke to people who had no clue what I was talking about. At Allegro I really
appreciate that these meetings are with real professionals! What is more, during my recruitments I have never encountered such a human approach. They treat you
like a human, not like a robot. That’s cool. In the last step you will meet with a team leader and people from HR.

## First days

My first days at Allegro &mdash; what a rollercoaster, considering the current coronavirus situation. Onboarding normally takes 3 days and is conducted at the
company’s headquarters in Poznań. There is another two-day long technical onboarding for technical employees at the workplace. However, due to the COVID-19
situation, the entire onboarding process was carried out remotely. This tech onboarding is conducted with a workshop on how to create a new service and
everything that goes with it like deploying, running and maintaining. I understood why (this was not possible remotely), but it is a pity that it did not take
place. Fortunately, everybody wants to help you with any issue you have &mdash; and this is the great power of Allegro: people and their readiness to help.
It is natural for everyone that a new person needs support and time to get to know the organization. Moreover, if you are a junior like me, and have never
written a line of code for example in Kotlin, you can spend some time learning a new programming language and everybody is okay with that.

Someone might ask: What is difficult in the beginning? That depends, because everything is new. I work in a team responsible for Allegro Smart! loyalty
programme &mdash; ensuring proper marking of offers qualified for free delivery &mdash; so the most confusing thing for me was the business complexity of those
processes.

Nevertheless, there are over 1200 microservices communicating with each other &mdash; a status quo you have to deal with. Thousands of decisions were made and
a lot of them don’t sound reasonable when you first hear about them, but after a day passes, everything starts to clarify. I think this is what everyone deals
with when they come to a new place.

## Somebody is reading my code

One of my favorite things at Allegro is code review. Virtually nothing gets merged unless it is reviewed and approved. Code review is mandatory and necessary
&mdash; reading others’ code is not only about finding bugs, it is mainly to provide code that is clear, understandable, and maintainable. For me, it is mainly
for learning and better understanding our services and business domain.

Another great thing is pair programming. During these sessions it is easier to understand the business domain and to catch the wider context of our services.

## Unit, integration, and end-to-end testing

As I wrote, unreviewed code will not be deployed to production and without tests it is not going to pass the review. At Allegro, each change in code needs
to be tested. We conduct unit and integration tests, and we work with two test environments.

One is totally a developer’s playground where you make your &lsquo;little Allegro&rsquo;. It is called phoenix. Every team has its own phoenix env for
experiments. However, it has some issues. Since there are so many dependencies to other services, your already set up environment may not work properly until it
is manually updated. So a very common situation is that before you start testing your change, you need to spend some time to get the whole environment working.
That is frustrating, especially in the beginning.

The second one is a pre-prod sandbox &mdash; it is like normal Allegro, but unlike the dev environment, the sandbox is more consistent and works almost like
prod. So there are a lot of possibilities to test your change and it’s good to have this feeling of confidence.

Sometimes despite all these tests, code reviews, etc. a mistake happens &mdash; the app is already deployed to production, and our clients are complaining.
We have to act quickly to fix the error. I really appreciate that we look for bugs, not the guilty party. When somebody makes a mistake, we don’t blame each
other, but we look for the best solution to the problem and fix it.

## Hack the day

Sometimes teams do internal hackathons (called fedex-days) &mdash; we divide into two or three teams and we are working on subjects that we choose. We want
to try a new programming language &mdash; we just do it; make an application for sharing memes &mdash; perfectly fine; write an extension for Slack &mdash; why
not, go have some fun! Usually, we spend two working days getting off work. That’s very refreshing.

I also know that once in a while there are hackathons for the whole Allegro &mdash; but I didn’t have a chance to participate.

## Dobrze tu być?

At Allegro we all understand the great importance of ensuring the code we are working on is of the highest quality. We care about our services to the point
where we sometimes spend hours discussing if it is better to throw an exception or just 404?

However, Allegro is not only about programming, it is a place with a lot of experts in many other disciplines &mdash; and every one of us has a straightforward
goal to make Allegro the best place/platform not only for shoppers and sellers, but also for each other.

Hope you enjoyed this article. I know it sounds like a chorus of praise, but in my situation it arises from my work experiences &mdash; for me, it is really a
&ldquo;Good to be here!&rdquo; place. Or as we say [#dobrzetubyć](https://www.linkedin.com/company/allegro-pl/life/team).
