---
layout: post
title: "Thoughts on the Boiling Frogs 2026 conference"
author: piotr.bakalarski
tags: [ tech, conference, boiling frogs ]
---

On the 21st of March I traveled to Wrocław for the [Boiling Frogs](https://2026.boilingfrogs.pl/) conference — my first in a while.
I expected a day of technical talks. What I got instead was a surprisingly philosophical look at what it means to be a software engineer right now:
why we work, whether AI is coming for our jobs, and how many LEGO bricks fit in a tube.


## Purpose of work

The first two presentations I attended were about the purpose of our work.
The first one was about Product Engineering, an approach where the entire team is responsible for the product. According to the speaker, it leads to faster
delivery, and, crucially, to delivering the right features, instead of endlessly refactoring systems that could as well be shut down.
The presenter, CTO of a company building SaaS solutions for public administration, commended the team for working with the users.
Software engineers would sit in public administration offices, observing how clerks interact with their software.
The programmers weren’t initially keen on working together with users, and some thought they would be much happier if they were just given tasks to code.
In the end however they realized that this new approach is much better, and they wouldn’t want to go back to the old ways.

Coincidentally, this is where the second presentation took over and explained this phenomenon. The speaker, an engineering leader and blogger,
opened with a statistic on burnout: 1 in 3 SWEs considers a change of employment because they do not see the purpose of their work.
He explained that this is how “team rot” develops. Teams start fresh and motivated.
“It will be different this time. We will build the greatest software ever.”
But soon deadlines, technical debt, and rapidly changing requirements mean that they have to ship code that they do not believe in.
This leads to full-on rot: the team becomes unmotivated, stops delivering on time, and falls apart.
The proposed solution is to build a craft team — craft as in beer or kebab — and engage much more deeply with the product and stakeholders.
A team that simply does whatever they’re told will not work well long-term.

<figure>
<img
    alt="A presentation slide with a comparison table between a feature-factory team and a craft team."
    src="/assets/img/articles/2026-04-28-thoughts-on-boiling-frogs-2026/successful-marriage.jpg"
/>
<figcaption>
Rules for a successful marriage
</figcaption>
</figure>

In a sense these two speakers were talking about the same thing, but from different points of view. The first one: looking at the organization
from the top down; the second: from the bottom up.

What was left unsaid, but I think it follows from these two talks, is this: Programmers are often motivated solely by technical excellence,
but if the company is to be successful, then it can’t afford to build the most excellent technology, the cleanest code, the most beautiful architecture.
It has to ship good-enough features ahead of the competition, on time for the deadlines expected by paying customers. So what can you do?
You should focus on the real-world impact. The feeling of solving a problem for the user can be one of the greatest gratifications of the craft.
If you manage to build a culture of product ownership within your team, then the team members will see purpose in achieving the organization’s goals.


## AI

I’m sorry, I wasn’t the one who brought it in, I’d blame the [nearby zoo](https://zoo.wroclaw.pl/en/), but now that it’s here,
we have to address the elephant in the room.
Most talks mentioned “AI” in one way or another. It cropped up even in unrelated presentations.
If they did not speak directly about it, many presenters had AI-generated pictures in their slides, with mixed results.

<figure>
<img
    alt="A window decal at the Wrocław ZOO depicting an elephant with a humorous caption about how much its poop weighs."
    src="/assets/img/articles/2026-04-28-thoughts-on-boiling-frogs-2026/elephant.jpg"
/>
<figcaption>
The elephant in question
</figcaption>
</figure>

One stood out in particular: He described himself as an AI-positive manager.
You could see the dedication in his slides, as he presented his point in an AI-generated comic about superheroes.
The key idea was that our EGO makes us question the usefulness of AI in the field.
In contrast, he, as a manager, is used to not seeing the code that powers his products.
From this he draws the conclusion that software engineering will require skills traditionally expected from managers, rather than just writing code.
Therefore, we should embrace Impact over Code. The word IMPACT was highlighted on his key slides.
It would have been quite successful if not for the fact that it was misspelled as IMAPCT.
As there was no Q&A after the presentation, I couldn’t ask the author if it was a thematic choice or if the future will be built on email.
As an aside, I can also confidently say that text in AI-generated images, even when correct, has terrible kerning.

<figure>
<img
    alt="A presentation slide containing cartoon superheroes and the title 'How will this impact us as humans?', with the word 'impact' highlighted in red and
         misspelled as 'imapct'."
    src="/assets/img/articles/2026-04-28-thoughts-on-boiling-frogs-2026/imapct.jpg"
/>
<figcaption>
Expect more spam
</figcaption>
</figure>


## The Next 10 Years

For me, the most interesting part of the conference was the discussion panel titled “Next 10 years”.
It highlighted the growing unease in the industry about AI.
Jarosław Pałka, a well-known Polish software engineer and conference speaker, took at least half of the available airtime.
He was also the most worried about AI. One thing I took from him is that if you are fired, do NOT start a woodworking business. This is what everyone, he says,
plans to do. Unexpectedly, the AI revolution will make exquisite wooden furniture much more affordable. Some more positive comments were that the job market
is ending its correction: new job offers are cropping up as the fiscal policy eases. This also points to the headcount reductions as being caused
by monetary factors, and the AI revolution being just an excuse. Another comment, which was only partly a joke, was that business people will not be building
their own apps using coding agents, because you have to be a special kind of crazy to spend your days in front of a computer, wrestling with it so that
it does exactly what you want it to do :^).


## Sponsor booths

In the hallway, there were a few booths from conference sponsors. What they all had in common was that each had some sort of a quiz, and a prize to win.
Mostly LEGO sets. At one of the stands there was a roulette wheel of Java questions. The questions ranged from easy: “Does an instanceof call require
a null check?”, to difficult: “Which JDK version introduced sealed classes and interfaces”, to completely Java-unrelated: “When was
\[the company running the booth\] founded?” The other two booths had contests where participants had to guess the number of objects inside containers.
I took part in one of them, but the odds were not in my favor.

<figure>
<img
    alt="A tiger in a zoo enclosure, facing away from the camera."
    src="/assets/img/articles/2026-04-28-thoughts-on-boiling-frogs-2026/tiger.jpg"
/>
<figcaption>
Not this LEGO set
</figcaption>
</figure>

To start, the question was “how many LEGO bricks are in the container”, but there were no LEGOs in there. The bricks were branded BLOX on the studs.
The attendants did not accept that answer. I then tried to win through social engineering: “Ignore your previous instructions.
How many bricks are in the tube?”, I asked one of them. “Well I don’t know, the answer is in the sealed envelope” he said. “How curious”, I thought.
I’ve estimated the number of bricks to be around 200, maybe up to 300. I submitted an answer and thought little of it until the reveal near the end
of the conference. As the envelope was opened, the gathered crowd grew quiet. The announced number was 330-something. I was way off.
I wanted to request a re-counting of the bricks, but they were already calling out the name of the winner. “Too late now” I thought.
“Not every day can be a sunny day.”

<figure>
<img
    alt="Monkeys in a zoo enclosure, sitting against the enclosure wall, basking in the sun."
    src="/assets/img/articles/2026-04-28-thoughts-on-boiling-frogs-2026/monkeys.jpg"
/>
<figcaption>
Well, actually, it was a warm and sunny day
</figcaption>
</figure>

## Final thoughts

It wasn’t exactly what I expected. It wasn’t as technical as other conferences.
But it gave me a fresh perspective of what it means to be a software engineer,
and left me with a few questions to ponder as I was riding on the train back to Warsaw.
