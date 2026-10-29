---
layout: post
title: "Engineering culture of Allegro & Allegro Pay: Pragmatic Engineer Score"
author: jakub.dropia
tags: [ tech, engineering culture, pragmatic engineer ]
---

One tech blog/newsletter gained traction and popularity for a couple of years now: [Pragmatic Engineer](https://blog.pragmaticengineer.com/).

Quoting author:

_The #1 technology newsletter on Substack. Highly relevant for software engineers and engineering managers, useful for those working in tech.
Written by engineering manager and software engineer Gergely Orosz who was previously at Uber, Skype/Microsoft, and at startups._

In practice, you will find a huge amount of information and internal insights on how big tech works in many companies.
There are many deep dives into engineering culture, best practices, and what goes on behind the scenes.

There is one particular entry in the blog that I would like to share and talk about:

[The Pragmatic Engineer Test](https://blog.pragmaticengineer.com/pragmatic-engineer-test/)

What is it?

It is a checklist of 12 questions, and answering them can “measure” the company's engineering maturity.

Working in Allegro Pay for four years, I saw a lot of these practices over the years. Hell, I had the opportunity to build some of them, which
is a valuable thing here. Everyone is open-minded and you can influence your workplace.

But when I came upon this article - it was natural to try to evaluate my current workplace against it.

I did it, and I would like to share the results with you without further ado.

## Disclaimer

I work at Allegro Pay, a company of Allegro Group responsible for Allegro Pay, Care, and Cash products.
What I write further is heavily grounded in the Allegro Pay context, as we have different tech stacks, environments, and technical platforms.
However, all practices are present both at Allegro and at Allegro Pay. The execution may differ, but engineering maturity is very similar in the end.

## TL;DR

In short - Allegro & Allegro Pay scored 11 points out of 12.

If you want to stop here - the takeaway is:

_this is a great place for software engineers_

We have JAVA, .NET, cloud, our own data centers, a mobile-first approach and modern web, a good microservices ecosystem,
a great internal developer platform (or even two!), data engineering and ML, and a product that makes money.

Would you like to hear nice, sweet, and bitter details?

Continue reading 🙂

[12 Questions](https://blog.pragmaticengineer.com/pragmatic-engineer-test/) and my answers to them.

## Equity or profit sharing

Half Yes. Not all engineers.

Allegro Group is a [public trading company](https://www.gpw.pl/company-factsheet?isin=LU2237380790) in Poland. Our engineers can gain stocks as a part of their total compensation package. How does this work?

Well, each senior level and above engineer gains a stocks package yearly as a part of the end-year review. The package is vested over 3 years with (25%, 25% and 50%) proportions.
Vested parts of each package are transferred to your broker account each year and can overlap. The final amount depends on company and individual results.
In Poland, these stocks are 19% taxed (if you decide to sell them).

In addition, all employees receive a yearly bonus, which, of course, also depends on the company and individual results.

Both are a significant addition to our overall compensation package.

Caveats?

Stocks are still not part of the offer for newcomers, which I think could contribute to attracting more great engineers.

## Roadmap/backlog that engineers contribute to

Yes.

Each team usually has its backlog. The product manager assigned to that team, the engineering manager, and the team itself are responsible for building
and maintaining this backlog around functionalities and domains that they own. The backlog is a mix of business features, some maintenance, and technical stories.
How it is built and tracked, if teams work in Scrum, Kanban, or some custom approach - is primarily up to the team. In the end, we have some processes that try
to gather “bigger” deliverables and compose a roadmap and plans for the whole organization at the same root.

It works great and allows teams huge flexibility and freedom in their work. As a trade-off, extra work is needed to map these backlogs into
the organizational level processes - which, usually, are in Google Sheets or a custom tool.

## Engineers directly working with other ICs (Individual Contributors)

Yes.

We collaborate with each other, regardless of role and career level. Even if other ICs are in different teams, the expectation is to communicate with them directly.
You can just write to anyone, and can expect to get an answer. There are some protections to prevent this from turning into complete chaos, like quarterly
planning of dependencies between teams, help channels, and so on, but if everyone works on the same page, we are just working together without unnecessary barriers.

## Code reviews and testing

Yes.

We have a test platform for automatic E2E tests. Manual testers are available for complex functionalities spanning multiple services.
To protect quality, we have code review policies for each repository. In CI/CD, the advanced build system protects us and validates many things
(unit/integration tests, outdated / beta packages, code formats, etc.) before they go to the main branch.

All of that is part of everyday workflow. Sometimes, it slows you down, but it is done smartly and, most of the time, helps. As always, everything is under your control, and in the end, it is your responsibility to use these tools properly.

## CI and engineers pushing to prod

Yes.

At Allegro Pay, every commit on the main branch triggers a pipeline that goes through the entire CI/CD process, is automatically deployed to the DEV and TEST environment,
and stops with manual approval before releasing to PROD. Approval needs the acceptance of another engineer than the one who changes the triggered pipeline.
Each team is responsible for its changes and deployments. We build it, we run it, and we own it.

Of course, that can also vary. Sometimes, additional security measurements need to be applied depending on the context and product.
But in the end - we have continuous delivery with dozens of deployments daily.

## Internal open source

Yes.

Each developer is welcome to issue a PR in components that do not belong to him or his team. We have common internal libraries which are developed and maintained across teams.
On the other hand, each repository has only one owner. It works well; people are open-minded and will always consider your contribution.

In practice, this doesn't happen that often. Most of the work is focused on components that your team owns, and sometimes differences between “services”
(different technologies, architecture, etc.), and lack of proper documentation are barriers to quick contribution - because you need to understand the service
and domain first before you will be able to change something that you don’t own.

Additionally, we have a [catalog](https://github.com/allegro) of external open-sourced repositories. You can find many great tools and libraries, some of which you may can even know, like
[bigcache](https://github.com/allegro/bigcache), [hermes](https://github.com/allegro/hermes) or [ralph](https://github.com/allegro/ralph). For Allegro Pay itself we also do have [some](https://github.com/topics/allegropay).

What is truly unique and I think fits into this position, is internal tourism. Anyone can request to join any team, and as a regular member work up to a couple of months (usually a quarter), contributing to other teams’ work.

## Healthy on-call as a priority.

Yes.

We do have on-call duty. This is a part of “we own it”.

How this is implemented may vary depending on the area or teams, but in the end, there are some streams of on-duty calls where people
perform 24-hour on-duty shifts cyclically. These duties are extra paid (for being “ready”). If something happens during duty - your intervention outside working hours is
paid according to the Polish overtime hours policy (150% or 200% hour rate depends on when this occurs), or you can exchange them for vacation at another time.

We have generic alerts, but each stream also has specific rules. There is a common practice where teams improve and change them to remove noise, false positives,
or simplify on-duty shifts. In the end - SLA must be met - and how teams will approach this - is up to them.

## Technical managers.

Yes.

Most of our engineering managers have a background in software engineering. They were seniors once and were promoted to manager, taking a step aside from pure IC.
Even if hiring from outside, they must complete all the technical workshops. It is expected that they will still be experts in the field.

They are deeply rooted in technology. They perform system designs, code reviews, consultancy, and sometimes coding. Proportion varies depending on the team and
the manager themselves. Besides people management, they are expected to have ownership of technical decisions and project management of the part which the team is responsible for.

## Career ladder (when above 10 engineers) & Parallel IC and manager tracks (when above 30 engineers).

Yes & half yes

We have a career level for Software Engineer Job Family, which starts from a junior position, goes through mid to senior level, and then splits into two tracks - Individual Contributor and Manager.
This split is fairly fresh, as there was only a Manager track before. Because of that, this one is pretty mature, with career progression starting from
Engineering Manager, going through Senior Engineering Manager, Director, VP or CTO.

If we are talking about the IC path - here we have right now the Principal Software Engineer, whose scope of the work is at least an area or even the whole organization,
and the Senior Principal Software Engineer is one person for the whole organization.

As you can see, ladders are missing in the IC track; from what I know, this is still in progress. The organization is trying to figure out what IC ladder fits its needs.

There are few opportunities for Individual Contributors above the Senior level. This can be improved, and it will likely be.

## Feedback culture.

Yes.

I think it is everywhere.

We have continuous feedback - 360, peer-to-peer, promotion, employee engagement surveys and during each half-year performance review. At each significant meeting, a space for Q&A.
Feedback is deeply rooted in our daily work. You can see polls, surveys, requests for feedback and opinions, post-mortems, and so on everywhere.
It is hard to imagine what else we could do to cover this topic, one of our culture's strongest traits.

## Investing in professional growth.

Yes.

This is realized in multiple ways. Each team/individual has a “training budget” - this is money you can spend on external training, courses, and conferences.
It differs from team to team, and used to be much better in past.
Additionally, we have an internal learning platform with many great workshops - especially in the soft skills area. They are great! You can upskill yourself well.

Also, in some areas and teams, there is a time dedicated to your self-development. You can spend it on contributions to open-source, reading a book,
learning from the course, or, for example, writing a PoC of new technology with your team. In Allegro Pay - it is 10%. How you spend it - is up to you,
or the team, it just should stick to our profession.

There are many internal and external communities (guilds), each with its own meeting calendar and interesting presentations and workshops taking a different kind of forms.
There are also many internal events, hackathons, and initiatives. Opportunities to learn are almost infinite.

Landing here was my biggest personal and professional progression so far.

## The bitter (or not?)

Sounds sweet, right? Where is the bitter here? Well, I am not sure.

This is a rapid-growth product and company. We are focused on delivering value to clients and maximizing profit from our products.
Everything we do must contribute to overall success, and there is little space to "breathe". You must often balance delivering functionalities,
paying back technical debt, and growing scale. Taking shortcuts. Making trade-offs. Asking difficult questions. Our roadmaps often change
because of the economics, law, or maybe data we gathered and told us that our actions do not convert in the way we assumed.
In Allegro Pay itself - the financial domain also does not help — a huge amount of our work is dedicated to legal matters. New laws pop up, and we must follow them.

I can imagine that it can’t be for everyone.

But for me, this introduces an entirely new layer of engineering, where you need to be smart, cautious, value impact, and make the right choices.

We strive to be the best in the market, which is why we succeed.

Another thing can be the corporation itself. But this is very likely something that you will not notice until you become a manager.

Allegro is a big company that has shifted to a more centralized and structured approach over the years. Everything needs to be aligned with the process.
To picture this, here are a few examples:

- Instead of ordering any accessories required within the budget - the budget was removed, and you can order only specific, pre-selected accessories

- Want to hire someone? There is budgeting once per year, and you need to come prepared to justify another full-time equivalent.

- Do you want to give someone a raise? Well, you don’t have to worry about this. Process, one per year, will do that for you.
You need to provide a performance review of your directs. Based on that you will get the budget, recommendations, and ability to slightly change proportions.

- Want to pursue external training? You have a budget. It would be best if you fit it in. You need to raise a request and process it through several layers of acceptance.

As you can imagine, all of that can take time and be annoying. It is very frequent that your “request” is stuck somewhere, and you need to “push” it.
But on the other end of the process, there are helpful people whom you can always talk to.

Sometimes, this leads to funny absurdities - you find an old monitor in the office that is not assigned to anyone (or a person who is not already in the company),
and you would like to order a docking station for it. “Procedures” will not allow you to do that. The dock must have existed before; if lost,
only the owner can “order” a new one with a good justification. But you are not the owner. It is no man's land - thus - no dock for it ;)

But I think most big corporations work like that. The past few years were also difficult for the industry. I understand why this is happening.
If you are an individual contributor, most of these things will not affect you. And those which do - you need to get used to it, and if you focus on the rest - hell - this is a great place to work.

## Is there more?

A score of 11 tells that you will find much good stuff in software engineering here.

But this is not all. There are plenty of other great features of engineering culture at Allegro & Allegro Pay. You have great products, a big scale and
a data-driven approach which leads to many challenges; amazing, intelligent people; modern technology and approach to software engineering;
rich off-topic communities (board games, sports, FIFA league, etc.), and many more.

Overall, #DobrzeTuByć (#GoodToBeHere)
