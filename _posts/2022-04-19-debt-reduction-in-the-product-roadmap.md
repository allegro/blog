---
layout: post
title: "How to include refactoring into Product development roadmap? Reducing technical debt inspired by real options identification"
author: [olga.dudzik]
tags: [tech]
---

## Nowadays, technical debt can be considered a bread and butter of most IT-powered enterprises around the world.

Almost every company that survived the startup phase and managed to deliver its first products to customers will face at some point technical challenges related to past architectural decisions. Although code engineering gets better every year, we cannot argue with the obvious fact of life: the market will always force many of us to deliver tech products faster than we wish. Time To Market has always been a key success factor for many product companies and it puts a lot of pressure on Engineering to keep up to challenging deadlines.

Statistics explicitly show the scale of the problem. According to the survey conducted in 2020 by McKinsey[^1], tech debt can reach up to as much as 40% of the whole technology value. On average 10-20% of IT budget is ultimately consumed by tech debt management and most CIOs interviewed consider the problem significantly increasing over past years, especially in enterprise-size companies[^2].

[^1]: https://www.mckinsey.com/business-functions/mckinsey-digital/our-insights/tech-debt-reclaiming-tech-equity
[^2]: https://www.computerweekly.com/news/252504654/Technical-debt-is-holding-back-innovation
As disturbing as it sounds, acknowledging the magnitude of the problem is the first step to dealing with it.

So, here we get to the Product Management reality. Even if we are lucky and after a product discovery we manage to navigate a perfect niche where we can provide a long-awaited, successful product, we still can fail having technology adjusted to our plans and needs. And that would be a real PM tragedy, wouldn’t it? To cap it all, it might be hard to even talk about innovative solutions when maneuvering around limitations imposed by the legacy code. So any further development of our product may become increasingly tricky and take more time what eventually poses a threat to staying competitive.

Bearing that in mind, no reasonable Product Manager can afford ignoring the gravity of code complexity and shady legacy.

Today is the day to start a crusade against technical debt in your products. Nonetheless before we start we must all admit: building a yearly roadmap consisting mostly of incomprehensible technical deliveries that cannot be easily attributed business value will not make us most popular Product Managers out there, to put it mildly. In most companies proposing such a backlog will result in heated discussions about targets, KPIs and wasting teams’ capacity. Work that does not end up with a significant increment is hard to defend. At the end technical product development is mostly not a charity effort and it is supposed to deliver financial outcomes - the sooner, the better.

The situation gets even more complicated in publicly listed companies that report on a regular basis to stakeholders. Declaring work without making any explicit promise of near-future apparent return on investment may seem unexplainable. Technical debt reduction on its own is strictly connected with vast uncertainty as long as it is not presented holistically in the broader context. So how can we approach Roadmaps to make debt reduction more appealing for our audience?

## Take a look outside of the IT world.

I believe that especially in Product Management we appreciate inspirations from other industries. And this case should not be an exception. Financial industry and analysts working on companies' valuations have been struggling with a similar challenge for decades. Is it worth investing in a company that may not seem to be an appealing opportunity now in terms of near-future ROI? How to assess potential profits from innovative ideas on the table? How can we, in general, assess long-term impact of work at the grass roots? And which tech company is a good investment opportunity? Our development backlogs should answer similar questions - which of these debt-reduction tasks are worth pursuing and what can we achieve? Which of them are really good opportunities for us? And finally - how to prove to stakeholders the real value of such initiatives? To approach these questions we can use the idea of real options.

Let us discover together the roots of real options. The idea itself dates back to 1977. Stewart Myers coined this term describing real options as “opportunities to purchase real assets on possibly favorable terms” and declaring that each company should be aware of its real assets and real options. Since then, the idea has evolved significantly and has been used in multiple methodologies not only for financial valuations, but also for determining value drivers in a variety of industries. It has been particularly attractive to IT enterprises as it embraces dealing with high uncertainty.

Inspired by real options theory, I reckon that we should stop considering technical debt in terms of short-term Profit and Loss accounting.

Looking only at the nearest future, refactoring activities will mostly look as cost centers without any outlook on further potential profits. However, once we change the perspective and start considering current refactoring investments as enablers for future product options, we are able to grasp the full range of benefits to be gained. Real options perspective should open our roadmaps for long-term thinking and it can allow us to optimize our decision-making process.

However, currently existing academic and financial models are mostly complex and time-consuming to perform. Therefore the idea of real options will serve here mostly as an inspiration for a really simple exercise that will aim to transform the general approach towards technical debt.

Bearing in mind the PM’s reality of limited time and resources, the aim is to keep the analysis quick. Moreover, we would like the output to be as easy and understandable as possible, so it can be fitting for the broad audience. Following real options terminology, we can assume that each resolved technical debt issue is our “real option” - a potential value driver and opportunity to create or improve some products (“real assets”). This exercise will focus on identifying and mapping options to future assets.

In the Product Management case, investments (time of our developers) will be made to remove some technical obstacles and they will become product enablers. Opportunities on the other hand will be translated into tangible deliveries and potentially attractive positions in our future Roadmaps. And in the best case, these opportunities may even open some new doors to further developments into currently unknown and unreachable areas. Our ultimate goal is to maximize opportunities while minimizing effort required to enable them.

I strongly believe that it is really tricky to evaluate analyzed efforts and hopes from the financial perspective at an early stage of analysis. Calculating ROI moneywise can be extremely time-consuming and tends to be based heavily on “guesstimates” (“an [approximate](https://dictionary.cambridge.org/dictionary/english/approximate) [calculation](https://dictionary.cambridge.org/dictionary/english/calculate) of the [size](https://dictionary.cambridge.org/dictionary/english/size) or [amount](https://dictionary.cambridge.org/dictionary/english/amount) of something when you do not [know](https://dictionary.cambridge.org/dictionary/english/know) all the [facts](https://dictionary.cambridge.org/dictionary/english/fact)”) . Nonetheless, at the same time it should be fairly possible and informative to at least roughly estimate our potential works vs. hopes in T-shirt sizing method (or any other preferred manner, up to you) and I would strongly recommend to follow this path at the beginning. As it is fairly simple and flexible, we can use the same concept to evaluate profits or attractivity of products or opportunities.

## Where should we start tech debt - value mapping?

Let us go through the process step by step. I would recommend going through this discovery process together with your technical team and to transform it into collaborative work. It can be a rewarding exercise for the whole team and it should boost the sense of agency.

First of all we should list all services/topics touched by our technical debt. They can be grouped into areas that will be addressed together to achieve the best efficiency. Depending on the specifics of the system, the granularity or nature of issues can differ. The main aim here is to review the general current state of tech without doing long and costly deep-dives. Our aim is to detect problematic areas avoiding major investments in solution analysis. In this exercise the technical team is the key. The more experienced our engineers are and the better they know their code, the more reliable outcome we get.

The second step is the ideation. Let’s determine our real options. Each of the listed services or areas, while solved, should be considered as an enabler for further system development. So this is the time to brainstorm together: assuming that problem A is resolved, what kind of new capabilities will be available for us? What kind of services or products can we build then? Or maybe there are some meaningful improvements that will make our product more convenient and should attract more users? We can and should go even further: what can we build assuming that more than one of the detected issues is closed? That is a perfect moment for the Product Manager to step in and to present the broad vision for the Product as inspiration. Wishful thinking, benchmarking, research and UX studies - all of these tools will prove to be useful in this workshop.

At the end of step two we should be able to draw a tree diagram presenting clearly technical blockers as potential new opportunities enablers:

![Figure 1](/img/articles/2022-04-19-debt-reduction-in-the-product-roadmap/img1.png)

Tree diagram mapping technical debt areas to related product/business opportunities.

Step three is all about evaluation. As mentioned before, I recommend using T-shirt sizing as it brings simplicity into very complex situations. I find T-shirt sizing an attractive estimation technique as it is quite intuitive and introduces relativity between analyzed entities. Sizes that we know from T-shirt labels (XS-XXL) are used to assess work needed to deliver a given task. At this stage our problems are not deeply analyzed and they are not broken down into particular stories/development tasks. We are working with high-level problems and ideas as we do not have time to spend weeks on analysis of topics that may not end up on our roadmap. In this step we can split into two work groups: a technical one and a business one. Technical team should focus on assessing the complexity of each detected technical task - both from debt-areas but also from prospective product opportunities (they require some work too!). If given problem seems to be fairly simple, it can be evaluated as an S. If something requires a major rebuild and redesigning the basics - it could be an XL. Let us just bear in mind that assessment should cover end-to-end work so the complexity of E2E & regression testing should be a vital part of this estimation too. What is more, covering the uncertainty factor in this exercise can be useful so I would not hesitate to assign bigger values for more vague areas. Effort estimation will be presented on the diagram below as purple boxes.

Business team (product managers and business stakeholders) will work on evaluating all the listed capabilities. As always, they should be considered in the broader context, so any product validation tools are handy. Apart from the business impact of each solution, we should also bear in mind if it fits into expected company strategy and if we can see it bringing us any competitive advantage when delivered in the more or less distant future (we have some issues to be resolved first!). Opportunities will be marked on the diagram as green boxes.

![Figure 2](/img/articles/2022-04-19-debt-reduction-in-the-product-roadmap/img2.png)

## Roadmapping

Having this analysis in hand, we can pick our best candidates for the roadmap depending on the team’s capacity available. While it will never be easy to choose the best path, it should be possible to navigate works that have the best potential to bring us noticeable benefits. While pitching the idea of technical debt reduction for the management team, we usually rely on financial aspects of reducing maintenance costs of old code (e.g. we can get potential savings based on maintenance work reports from previous months). After this analysis we should be additionally equipped with the reliable documentation of new business opportunities enabled.

There are at least two approaches to include refactoring on the roadmap, depending on the company’s specifics.Presenting detected technical-debt tasks as a stage zero of your product development may prove to be handy for organizations that are particularly reluctant to acknowledge refactoring as opportunities. In such a case debt reduction could be ‘hidden’ in the Opportunity roadmap item represented by longer actual delivery time. It is worth noting that this approach gives less clarity when it comes to presenting dependencies:

![Figure 3](/img/articles/2022-04-19-debt-reduction-in-the-product-roadmap/img3.png)

For companies that are more open to the refactoring idea, putting technical tasks as “business enablers” on the roadmap can give more clarity. In this approach, it is also easier to include multiple enablers and opportunities on one graph. Cause and effect sequence would explain interdependencies between deliveries and make it easier to understand overlapping items:

![Figure 4](/img/articles/2022-04-19-debt-reduction-in-the-product-roadmap/img4.png)

I strongly believe that introducing analysis described in this article can be a good starting point for the discussion about reducing technical debt in IT-driven products. It can be further developed and supported by a variety of financial analysis methods available for real options valuations or other approaches applicable for IT. There is a necessity to change general mindset and industry’s way of thinking about code refactoring to make the process sustainable and successful. Becoming aware of new opportunities resulting from the technical debt reduction is a good first step towards this goal.


