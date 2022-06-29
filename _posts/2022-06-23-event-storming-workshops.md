---
layout: post
title: How to facilitate EventStorming workshop
author: [krzysztof.przychodzki]
tags: [tech, communication]
---

## Goal of this article

The goal of this article is to present the technique and its possibilities. I am not discovering anything new, just
gathering available knowledge in one place. What I will try to show is a few tips on how to conduct and facilitate
EventStorming workshops.

# Guide to Big Picture EventStorming

## Introducing EventStorming

In 2013 Alberto Brandolini posted an [article](https://ziobrando.blogspot.com/2013/11/introducing-event-storming.html)
about a new workshop format for quickly exploring complex business domains. It was warmly welcomed by the DDD community
and quickly spread around. Since 2015, in
the [Technology Radar](https://www.thoughtworks.com/radar/techniques/event-storming) EventStorming has been indicated as
*worthy of attention* and three years later is *a recommended method* for business domain modelling in information
systems.

During years a lot has changed, technique has developed and matured but main idea remain the same:
> *Event Storming is a flexible workshop format that allows a massive collaborative exploration of complex domains (...)
> where software and business practitioners are building together a behavioural model of the whole business line.*

Above definition is from Alberto Brandolini’s
book *[Introducing EventStorming](https://leanpub.com/introducing_eventstorming)* to which I will be referring in this
article.

## Building blocks

Here I have focused on the main building blocks and only mention them, a comprehensive description can be found in the
book I mentioned earlier.

### Invite the right people - business, UX, IT

###### *but how do you describe the right people*?

* those who have questions
    * developers, architects, designers etc.
* and those who know the answers
    * you will need people that care about the problem
    * people who know the business. Try to gather people who know and understand it. Don’t confuse
      them with &mdash; users, people who are using our
      business/system &mdash; these two are totally opposite.

### Orange sticky note

On which we will write down our events in the following form:

* *Verb at past tense* to indicate that it already happened
* *Relevant for domain experts* - describing specific and pertinent events / changes in our business / system - these
  are changes that at the end of the day we want to save in the database.

  ![domain event](/img/articles/2022-06-23-eventstorming/image1.png)

> **Tip**: It is a good practice to define the concept of an event together (with participants) at the beginning of the
> workshop. Then we can verify our definition with events that are appearing on the wall.

## Before launching

### Provide unlimited modelling space

Why is it important? Because you want participants to explore and experiment during the workshop. You don’t want to
impose limits on them or to allow a situation where someone doesn’t add an event because there is no space left.

When your session is offline:

* wall where you attach plotter paper (it is easier to stick post-its on plotter paper),
* stickies in different colours, shapes and quantity (will discuss it later),
* markers

When it has to be online you can use one of virtual boards like:

* [miro](https://miro.com/)
* [mural](https://www.mural.co/)

### Approach

There are two approaches to facilitate and that depends on general participants’ understanding of the business process.

If your team does not know the domain - it is good to conduct a workshop in an exploratory way, because there is a lot
of unknown. You can start with throwing a central event out, or if the domain is large - several events. Then look at
what is happening before and after those events, regarding time flow.

However, if your participants are familiar with the system (domain) and the goal is to discover only a part of it, see
how something works or immerse into a specific *use-case*, you may want to impose certain limits/boundaries - e.g. by
initial and final events.

# Phases of Big Picture EventStorming workshop

## Introduction

It is good to start the workshop with a short presentation of all participants - but it has to be rather quick before
everybody gets bored. Generally you can omit this step and ask only new participants to introduce.

> *We are going to explore the business process as a whole by placing all the relevant events along a timeline. We will
> highlight ideas, risks and opportunities along the way.*

What is necessary - we need to set a goal. What will we model? Tell what is our goal, what we will model and try to
analyse.
> **Tip**: Remember - event storming is not a goal by itself - it is only a tool / framework.

### Because the Big Picture is all about events.

Provide participants with an idea of a domain event, why is it important, that it has to be a relevant change in our
system - imagine you do not have a computer and by the end of the day every event, in our system, needs to be written
down in the notebook, by hand. Is the event ‘offer was shown’ a relevant change you want / is worth noting?

> **Tip**: A good ice-breaker is also demonstrating how to peel the sticky note so it would not curl
> up… [for example here](https://www.youtube.com/watch?v=rPHLxOLuyLY)

## Phase 1 Chaotic exploration (brain dump)

### What is happening

All participants are using orange sticky notes, writing down events and putting them on the board. When events start
appearing on the board, a discussion will naturally start about what kind of events they are, when they are happening or
how or what is triggering it.

### Your role as a facilitator

Explain that we treat our whole board as a timeline and time is passing from left to right - it helps to see what is
happening before and after. Sometimes it is worth showing the importance of time in an example:

- a locker was opened,
- a package was taken out,
- the door was closed

in a different order it does not make sense.

Your role as a facilitator is to listen and observe - how fast new stickies are appearing, where discussion is taking
place (try to capture events people are arguing about). Encourage the team to try to identify as many events as possible

- if somebody is wrong, it’s okay - others will correct.

When someone is mentioning some mysterious term, capture its definition. As a facilitator you can, and you should ask
obvious questions as it takes the burden off others participants.

This is also a phase where divergent thinking takes place as a part of *chaotic exploration*. So on board we have a lot
of events, we do not judge them at this point &mdash; later we will see where they lead us &mdash; encourage to
generate new ideas and set aside critical thinking and judgement.

> **Tips**:
> As an icebreaker you can put the first event or events out - to show how easy it is, and help draw participants into
> workshops.
>
> Try to eliminate actors from the events - because we don’t want to impose mental boundaries as we may not notice that
> there is some other case.

### How to manage people

Sometimes it is a good idea to divide them into smaller groups and make them work together on the same issue
or quite opposite to focus on different areas of the system.

Depending on whether we are exploring or modelling the process, especially during online sessions, I think it is good to
have boundaries - like a start event and an end event - that everybody can create their vision. Then the most difficult
part is to merge it. Another approach is to leave a free hand to your participants and see how the process is going on.

### How long should it take?

When the speed of showing up of new events dramatically slows down - it is a good time to proceed to the next phase.
Usually chaotic exploration takes about 5 - 15 minutes, but I have noticed that after about 8 minutes people are getting
bored and busy with other things. So especially during online meetings, when you do not control the environment (like
computers, phones, slack, mails…) it is easy to lose attention. And if you add to it a *zoom fatigue* syndrome - you can
spoil the whole session, when key participants left.

## Phase 2 Timeline

After the divergent step, now is the time for the emergent phase where we want to explore and experiment - this is what
we will be doing during the next phases.

### What is happening

Now our goal is to make sure we are actually following the timeline - we would like the flow of events to be consistent
from the beginning to the end.

### Your role as a facilitator:

A lot of events are going to change their place, also participants will find them irrelevant or duplicated and that is
ok. Remove the duplicates, but be careful &mdash; ask if those duplicated events mean the same thing for everybody! Do
not hesitate to add, remove or change some sticky notes on the board.

At this step some issue points may appear - so it is good to mark it as a **hotspot** &mdash; use red sticky notes,
write the issue down, but it is not a good time to deliberate about it now, we try to postpone this discussion.

![hot-spot](/img/articles/2022-06-23-eventstorming/image2.png)

> **Tip**: During the online session when everybody is working solo it is hard to merge down all events and including
> attention problems - you may be left alone. So my solution is to introduce the next phase right now.
>
> Depending on the team - you can pick some random person who is going to start creating a timeline based
> on available events. To sustain attention, change this person with another one. In case of inconsistencies, we
> complete the timeline with the missing events.
>
> However, you can do all of it &mdash; if you have some shy persons or your participants’ supervisor is in
> the room, when you tell the story you can make intentional errors or ask silly questions. All of this eventually will
> help to explore the domain.
>
> Because as a facilitator you do not have to know everything, especially the domain or business your participants are
> exploring &mdash; you help them effectively and safely discover processes, find new solutions or define problems.

## Phase 3 Explicit walk-through and reverse narrative

### What is happening:

Next step is to do a walk through by creating some sort of story that can be told based on events placed on the board.
During this step a lot of talks (argues) are going to happen, maybe some events are missing - so do not hesitate to add,
remove or change some sticky notes on the board. We should focus on the happy path in the first place.

### 1. Explicit walk-through

### Your role as a facilitator:

Pick some random person who is going to start telling a story based on available events according to timeflow (from left
to right). Sometimes the team gets blocked in this situation you can add or move an event and place it in an obviously
wrong place. Your error will be quickly fixed and it helps the team to move on.

### How to help participants to discover more?

And the answer is simple &mdash; by asking questions. There are some useful questions that you can ask almost at each
event, e.g.:

- Why did this event happened?
- What are the consequences of this event?
- What has to / needs to happen next?

Going deeper (of course that depends on how deep you want to go)

- What, how, when, why is it changing
- When it can’t change
- How does this affect the system / business

> **Tip**: Also in this phase it can be convenient to introduce actors (phase 4 - people and systems) &mdash; if it
> helps to tell a story or better understand the process do not hesitate (remember I told you that ES is a tool?)

### 2. Reverse narrative

### Your role as a facilitator:

Sometimes it is good to propose a reverse narrative / reverse chronology. Pick an event from the end of the flow and
look for the event that made it possible - it must be consistent - no magic gaps between events. Again if we miss some
events - add them.

Some questions you can ask:

* Before
    * *What has happened before X*
    * *What else has to happened for X to happen*
* Between - we take two corresponding events
    * *Is there anything else happening between X and Y*
* Alternative - ask about alternative events
    * *What if X did not happen*
    * *What if 10% of X happened or 150% of X happened *

## Phase 4 People and systems

### What is happening

When we finish enforcing the timeline and we have a consistent story/flow of our business we can add people and external
systems. We need them for clarity and better understanding of events and forces governing our process / business.

For marking people we use a yellow sticky note with a symbolic drawing of a person or clock if we want to show that time
matters. External Systems may be represented by large pink stickies with its name on it.

![actor](/img/articles/2022-06-23-eventstorming/image3.png)

![system](/img/articles/2022-06-23-eventstorming/image4.png)

### Who is an actor?

Alberto Brandolini is explaining that
> *The goal is not to match the right yellow sticky note to every event in the flow. Adding significant people adds more
> clarity, but the goal is to trigger some insightful conversation: wherever the behaviour depends on a different type
> of user, wherever special actions need to be taken, and so on.*

The lack of precision is helping in discussion and exploration &mdash; it can be a specific person for example *in our
business model only Mrs. Smith can issue an invoice*, or after some time reservation is cancelled &mdash; so even *Time*
can be an actor. Another example *order cancellation* can have two actors: client and CEX worker.

System - application / department / other companies - is a piece of the whole process, but is beyond our control.

## Phase 5 Opportunities and risks

In this phase we can literally take three steps back and look at the whole business flow as it is.
**Hot spots** are the most conspicuous things - and it is easy to say where the biggest impediment is. This
is a great occasion for additional discussion and a subject for further exploration.

> **Tip**: Remember that each *hot spot* should be addressed and resolved before the next session takes place.

Another way to find where problems might lay is either voting for a specific problem or marking with for example green
and red stickies events that indicate where in our flow we are generating / losing money or value. For example by green
stripes we indicate events where we are earning money, by red stripes &mdash; we lose money or value.

## It is like Pizzas

When all hotspots are addressed, you have found the biggest impediment, or you know on what part you have to focus
during next session, the only thing left to do is to close the workshop. Thankyou’s to all stakeholders and
participants, schedule the next session and ask about feedback.

After the session, you will have a clear business narrative on the board. What is more important, participants will
share general understanding of the process. They have gone through the massive learning process, gained experience and
shared the common knowledge &mdash; everybody uses the domain language. Due to the fact that we used simple building
blocks the outcome is understandable to everyone PMs, UX designers, dev etc.

The steps described above and their sequence should be regarded as an option which can be used during the session.
Because there is no such thing as one recipe. For example if during the *timeline step* you feel that introduction of
people and systems is going to help &mdash; do not hesitate to do so. In other cases you will be interested only in
finding impediments or where your system is delivering values and do not feel obligated to use all steps.
As Alberto says:
> *I like to think about it like Pizzas: there’s a common base, but different toppings.*

### Nobody is excluded

Big Picture EventStorming is the first and crucial step, its outcome is visible and valuable. Depending on the team
needs it can be sufficient but if we want to go deeper and explore more next are Process Level and Design Level
EventStorming. We use the same stickies’ grammar enhanced with more colours to explain the complexity of our system. Due
to the fact that we use the same grammar, developers and businesses can talk the same language &mdash; nobody is
excluded, isn’t that great?

Those further steps (Process/Design Level) are getting us closer into the domain-driven-design and implementation. We (
developers/architects) can start thinking how to change what we have learned into working code, because
> *(...) it’s developer understanding that gets captured in code and released in production.*

## Call for action

If you are Allegro worker and you are interested in EventStorming &mdash; you want to develop, participate in workshops
or help as a facilitator I strongly encourage you to join the guild.
If you are not yet working at Allegro but are interested in how we use EventStorming maybe it is good opportunity to
join
us &mdash; [#dobrzetubyć](https://www.linkedin.com/company/allegro-pl/life/team).

## More about EventStroming

On the Internet you can find a lot of materials about EventStorming. Below some of them that I found most valuable

### Books

1. [Introducing EventStorming](https://leanpub.com/introducing_eventstorming) Alberto Brandolini’s book &mdash; *
   EventStorming Bible* &mdash; mandatory book!
2. [The EventStorming Handbook](https://leanpub.com/eventstorming_handbook) by Paul Ryner &mdash; a great summary of *
   Introducing EventStorming* with a lot of valuable tips, tricks and recipes. After that you will be able to explain
   EventStorming even to your own child.
3. [GameStorming A Playbook for Innovators, Rulebreakers, and Changemakers](https://gamestorming.com/) by Dave Gray,
   Sunni Brown, James Macanufo &mdash; if you want to use the full potential of your storming sessions.
4. [Facilitator’s Guide to Participatory Decision-making](https://allegro.pl/oferta/facilitator-s-guide-to-participatory-decision-maki-10017700512)
   by Sam Kaner, Lenny Lind &mdash; how to be a better facilitator, not only for EventStorming. You will find precious
   information about divergent, emergent and convergent thinking and why it is important.

### Link

1. [Awesome EventStorming](https://github.com/mariuszgil/awesome-eventstorming) by Mariusz Gil &mdash; I guess this is
   the
   biggest source of links about EventStorming topics.

## Thanks

I would like to thank all of my colleagues from *Allegro EventStorming Guild* for their help in creating this article.
