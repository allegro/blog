---
layout: post

title: "Visual thinking"
author: [michal.kowalcze]
tags: [agile, communication, visualization, planning]
---

We use written (source code) language to express our intentions in a machine-readable form. We use spoken language to
communicate with other people. We pride ourselves as ones choosing programming language optimized to the task at hand.
Do we use the most optimal way to express our ideas?

### Spoken planning

— Josh, could you summarize what we are going to implement?

That was a bit unexpected. He was just trying to match what he already knew from onboarding days with what was just
said. It was really difficult to follow team discussion at the same time. It was a standard planning session, held over
Zoom, with his distributed team. Someone was already sharing screen and the story summary, along with acceptance
criteria, was visible. They were developing an online store and the current topic was: basket price reduction for active
users. In short: users who spent more than 50€ for the last 7 days should have a discount applied during the checkout
process.

— Well, we are going to add a new service which is going to hold this discount-logic. We will provide an API for the
cart service to call us and we will check the transactions store for recent orders.<br/>
— Is that all?<br/>
— I didn’t catch more changes.<br/>
— What about customers willing to check if they are eligible for a discount?<br/>
— Oh, so it seems we need to change ‘my account’ page as well.<br/>
— And the checkout service? We have to both display discount and use it.<br/>
— You’re right! I was trying to picture the main change in my mind and wasn’t paying attention to the whole
discussion.<br/>
— Guys, checkout stays the same. Cart is providing everything the checkout requires.

### Retrospective

Let’s stop here for a moment. Have you ever been in a situation, when you were forced to do two things at the same time?
For example listening to what is being said and trying to actively participate in the discussion regarding a not exactly
well known topic? Was it a demanding experience? I had such an opportunity and I remember these sessions as quite
demanding. Usually after a hourly session I was exhausted and in need of a break. Not to mention that it required a
significant amount of writing to capture everything that was said - just to have an option of referring back to this
during the sprint. What if this session looked differently?

### Visual planning

“Josh, could you summarize what we are going to implement?”.

That was a bit unexpected, however it was a no-brainer.
![planning services](/img/articles/2022-02-03-visual-thinking/planning_services.png)
“As we can see in the picture we are going to add a new service, discounts. This service will be called by the current
cart service to display reduced price (if applicable). Also the “My Account” page is going to call us to retrieve the
current rebate for the logged user”.

### The difference

What is the main difference between the first scenario and the second one? To me it is about common model. In the first
case I am building an individual model of a change. I need significant amount of energy to translate speech to my model
and to explain my model to the others. What is more — everyone involved in the discussion is building a mental model on
their own with a similar amount of energy spent on synchronization.

![private models](/img/articles/2022-02-03-visual-thinking/private_models.png)

In case of the second scenario the model is common. There is no need to maintain private models. It is easy to
understand changed elements and to refer to discussed changes later. "A picture is worth a thousand words" after all.

![common model](/img/articles/2022-02-03-visual-thinking/common_model.png)

Output from a visual planning is something that can be used further during a sprint. Depending on the tool it is
possible to use it instead of an issue-tracking tool. Sticky notes can indicate actions, tasks, TODOs. They can be
arranged in a tree and display scope of a pull-request. They can be connected by a dotted line to indicate dependencies.
And in the worst case, when you do not have any idea how to visualize something, you can always use a block of text and
describe it using words.

![planning tasks](/img/articles/2022-02-03-visual-thinking/planning_tasks.png)

### The background

Why switching to a drawing board has such an effect? To answer this question we have to check some facts.

On a daily basis a spoken (or written) language is our standard way of communication. It took us some time to speak and
before that we had been able to:

* register movement (at 2 months age)
* try to grab things by hand (5 months)
* follow movement with our eyes, find hidden things (7 months)
* exploit cause-effect - drop a toy an watch it falling (8 months)
* start to use words in a proper context (11 months)

Such spatial skills are something all creatures need to develop to survive. Even plants, to some extent, exibit
spatial-aware behavior - they move to follow the sun.

It is worth noting that spatial-related terms
like ["where, here, near, etc."](https://en.wikipedia.org/wiki/Natural_semantic_metalanguage)
can be translated to any language in the world.

On the other hand, what language do we use to express ideas-related actions? As Barbara Tversky listed in her
["Mind in motion"](https://www.youtube.com/watch?v=gmc4wEL2aPQ) lecture we can:

* raise ideas
* pull them together
* tear apart
* turn inside out
* push forward
* toss out

![ideas and actions](/img/articles/2022-02-03-visual-thinking/ideas_and_actions.png)

We talk about ideas in the same way as about any space-related topic!

How could it happen? Scientists have been trying to understand functions of different parts of the brain for some time
already. In the seventies they have identified so-called **place cells** - neurons that are activated at specific
location. It took some time to identify another layer of neurons on top of these: **grid cells** working as our inner
GPS, activated when switching locations. The latter discovery was
awarded [Nobel Prize in 2014](https://www.nobelprize.org/prizes/medicine/2014/press-release/).

While performing tests on human beings it turned out that place cells are activated not only in specific locations. They
are also activated by events, people, ideas. The grid cells are activated by thinking about consequences of events, by
social interactions and by connecting ideas together. We are using the same brain structures for spatial orientation,
for ideas and for social interactions.

TBD map and visualization as map We are using [maps](https://en.wikipedia.org/wiki/Map) to communicate space concept.

### TBD map elements

### TBD Arrow as the special element

### TBD unstructured drawing
