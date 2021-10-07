---
layout: post
title: Evolution of web performance culture
author: jerzy.jelinek
tags: [tech, webperf, frontend, performance, perfmatters, javascript]
---
The main goal of boosting website performance is to improve the user experience. In theory,
a satisfied customer is more likely to use a particular company's services, which is then reflected in business results.
However, from my own experience I can say that not every change can be easily converted into money.
I would like to tell you how to reconcile these two worlds, how to convince the business that the benefits of
better performance are a long-term investment, and how to streamline the development process during the design or code writing process.

Web performance is a challenging and complex subject. It involves working at the intersection of content management,
frontend, backend and the network layer. Rarely does a single change make a dramatic difference in performance,
only the cumulative effort of small improvements in each of these areas produces noticeable results.

As the team responsible for the performance of Allegro, we are responsible for implementing various optimizations,
but most of all we show other teams which modifications in their projects will positively affect the performance
of the whole site. Our duty is to create the friendliest, performance-supporting work environment for developers
and help non-technical people to understand the idea behind it.

We would like to illustrate by our example how this can be achieved.

## Stage One — Measuring The Web Performance

At Allegro, we want to know if and how a given functionality affects the user as well as our business metrics.
In order to prove our hypothesis about performance impact we had to prepare a whole mechanism that allows us
to track and analyze performance changes. I described it in greater detail in my first article titled
[Measuring The Web Performance](/2021/06/measuring-web-performance.html).

Only then we could start optimizing our pages. Our actions brought the expected effect — we made progress,
but the pace was not sufficient. We lacked the support of business people, who would see profit in all of this.

## Stage Two — Make it clear that performance is important

We have gone to great lengths to make the entire organization realize that the gains from web performance are long-term and important overall.

Everyone subconsciously knows that a faster site improves user experience. The earlier users are able to see a page and use it,
the more often they are likely to do so and return. However, we had a problem proving that it truly makes our company earn more,
in the end this is what every business is about.

The first milestone turned out to be a test conducted together with the SEO team. It was an A/B test,
where some users got an optimized offers list page that was loading faster, and the rest got the original page.
It turned out that all examined pages were added to Google cache (previously there were only a few of them),
the number of clicks, average ranking position and number of views increased from a few to several percent
and the expected business profit from such a change was at 13% of the current GMV originating from organic traffic.
Although being only a proof of concept, this experiment turned out to be an enabler for our next steps.
It helped us understand better what we were aiming for.

This experiment has opened the way for us to make more optimizations, it also provided us with a solid argument
that convinced other product teams. However, we still felt unsatisfied — if performance affects
GMV indirectly through SEO then are we able to prove a direct correlation as well? We had plenty of data,
but we lacked the analytical expertise to process it, therefore, we asked our business analysts to help us.
Based on historical performance* and business data, they were able to confirm the impact on business metrics!

> Each 100ms slowdown of First Input Delay results in an average drop in GMV of 3%.  
> Each 100ms slowdown of First Contentful Paint results in an average drop in GMV of 1.5%.  
> Each 100ms slowdown of Largest Contentful Paint results in an average drop in GMV of 0.5%.  

*The data comes from our real user measurements, not from synthetic tests.

## Stage Three — Support for both business and developers

After confirming our hypothesis, we had to implement a number of measures to ensure that web performance
is taken into consideration throughout the entire process of delivery for all functionalities.

### Teaching

One of the main tasks of my team is to prepare the awareness campaign of our colleagues.
Therefore, we periodically conduct two types of training:

* For engineers, where we focus on the technical part including how to use the available tools to write optimal code.
* For other employees (especially Product Managers), where we explain why performance is important and what benefits it brings.

We assume that knowledge should be shared, that is why we describe each interesting case, experiment or bug fix on our internal blog.
Thanks to that we mitigate the risk that bad patterns will be repeated in the future.

However, the best way to learn is to work with us directly, so we encourage everyone to visit us as part of the
[team tourism](/2019/09/team-tourism-at-allegro.html) initiative.

### Supporting technical teams

In our team we believe that we should automate every task possible. We want our tools to support
the work of our engineers, so that they don't have to remember to run performance tests,
check the size of the resulting files, etc. That is why we have prepared several checks that apply to components development
in our [Micro Frontends architecture](/2016/03/Managing-Frontend-in-the-microservices-architecture.html).

#### Automatic page scanner

That's where the whole automation story started. To detect problems with assets we had to check each page manually.
This was neither convenient nor scalable, so we created our first bot, which used PageSpeed Insights to check if:

* assets are cached long enough,
* their sizes on the page are appropriate,
* there are any assets which are not minified,
* images are in the right format and size,
* some images should be loaded lazily.

After detecting problems, we checked the owners of the asset or part of the page and notified them on Slack.

![Brylant Bot](/img/articles/2021-09-23-evolution-of-web-performance-culture/brylant-bot.png "Brylant Bot")

#### Automatic comments in pull requests

Two comments are generated while building the component. The first one presents a comparison of assets size
with the target branch and the estimated cost of the change.

![Asset size comparison](/img/articles/2021-09-23-evolution-of-web-performance-culture/gh-sizes.png "Asset size comparison")

If the size exceeds the declared threshold, our entire team is automatically added as reviewers to the pull request.

Additionally, to detect the culprit faster, a
[Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) report is generated.

In the second one, Lighthouse reports for target and feature branches are compared in order to catch performance metrics’ regressions at this early stage.
Each component has a list of predefined presets (input data) and a server that displays them.
This functionality is used for: development, visual regression, snapshot and performance testing.
Lighthouse report is generated for one or more predefined states every time the component is built.

![Lighthouse report](/img/articles/2021-09-23-evolution-of-web-performance-culture/lighthouse-report.png "Lighthouse report")

#### Automatic notifications

My team is notified on Slack every time a new dependency is added to any of the components.
We want to make sure that the libraries used are optimal and have no better (smaller, faster) replacements.

![Dependencies notification](/img/articles/2021-09-23-evolution-of-web-performance-culture/bot-deps.png "Dependencies notification")

We get similar notifications when assets size changes by at least 5% compared to the target branch.
We want to make sure that, for example, treeshaking hasn't broken down or some other change affecting the size has not occurred.

![Size notification](/img/articles/2021-09-23-evolution-of-web-performance-culture/bot-sizes.png "Size notification")

#### ESlint

We use it not only for formatting but also for finding violations in our code using custom rules.
We have created several rules to support engineers in their daily work. You can read about a sample implementation
in the post “[Using ESLint to improve your app’s performance](/2020/08/using-eslint.html)” on our blog.

#### Analyses

We get requests from other teams to analyze their components or sites. Sometimes they lack the time budget
for such analysis, but would like to know what to improve.

### Research and development

Keep in mind that working on web performance is a continuous work. Every now and then new solutions,
which may have a positive impact on the loading speed, appear on the market. Therefore, together with our team,
we run a series of tests to see if it makes sense to adopt a given solution.

### Appreciation culture

We believe that the carrot is better than the stick, so we praise other teams for the achievements
related to improving performance. Some time ago we used to write it down in the form of a newsletter,
now we talk about it during our sprint summaries.

## Summary

We are constantly working on data collection, monitoring, awareness raising, optimization and research,
which leads to a situation where more and more managers come to us for consultation.
They know that performance is important and needs to be taken care of. Allegro is constantly evolving,
new content and features are being created, without working on performance the site will slow down.
However, we already have a whole arsenal of capabilities to help us deal with this.
We are no longer fighting alone as the Webperf team, but as an entire organization.
