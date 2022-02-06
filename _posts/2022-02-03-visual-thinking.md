---
layout: post title: "Visual thinking"
author: [michal.kowalcze]
tags: [agile, communication, visualization, planning]
---

We use written (source code) language to express our intentions in a machine-readable form. We use spoken language to
communicate with other people. We pride ourselves as ones choosing programming language optimized to the task at hand.
Do we use the most optimal way to express our ideas?

### Spoken planning

— Josh, can you summarize what we are going to implement?<br/>

That was a bit unexpected. He was just trying to match what he already knew from onboarding days with what was just
said. It was really difficult to follow team discussion at the same time. It was a standard planning session, held over
Zoom, with his distributed team. Someone was already sharing screen and the story summary, along with acceptance
criteria, was visible. They were developing an online store and the current topic was: basket price reduction for active
users. In short: users who spent more than X for the last Y days should have a rebate applied during the checkout
process.

— Well, we are going to add a new service which is going to hold this rebate-logic. We will provide an API for the cart
service to call us and we will check the order store for recent orders.<br/>
— Is that all?<br/>
— I didn’t catch more changes.<br/>
— What about customers willing to check if they are eligible for a rebate?<br/>
— Oh, so it seems we need to change ‘my account’ page as well.<br/>
— And the checkout service? Don’t we need to not only compute rebates but use them as well?<br/>
— You’re right! I was trying to picture the main change in my mind and wasn’t paying attention to the whole
discussion.<br/>
— Guys, checkout stays the same. Cart is providing everything the checkout requires.

### Retrospective

Let’s stop here for a moment. Have you ever been in a situation, where you were forced to do two things at the same
time? For example listening to what is being said and trying to actively participate in the discussion regarding a not
exactly well known topic? Was it a demanding experience? I had such an opportunity and I remember these sessions as
quite demanding. Usually after a one-plus hour session I was exhausted and in need of a break. Not to mention that it
required a significant amount of writing to capture all what was being said - just to have an option of referring back
to this during the sprint. What if this session was a bit different?

### Visual planning

[insert planning diagram]
“Josh, perhaps you can summarize what we are going to implement?”.

That was a bit unexpected, however it was a no-brainer.

“As we can see in the picture we are going to add a new service, personalized stock. We will replace the current
interaction from the cart service to the stock service with a call to the new service. Also the “My Account” page is
going to call us to retrieve the current rebate for the logged user”.

### The difference

What is the main difference between the first scenario and the second? For me it is about common model. In the case of
only discussing (and writing text) I am building an individual mental model of a change. I need significant amount of
energy to translate speech to my model and to explain my model to the others. What is more - everyone involved in the
discussion is building a mental model on its own with a similar amount of energy spent on translations and
synchronization.

![private models](/img/articles/2022-02-03-visual-thinking/private_models.png)

In case of the second scenario the model was common. Really - by taking a single look at the created drawing (and
actively participating in the creation process) everyone is on the same page and do not have to maintain a private
model. It is very cheap (in terms of time and energy) to depict connections between components, indicate new things or
elements to be removed and add anything (like a team-agreed symbol) to pass a piece of information. "A picture is worth
a thousand words" after all.

![common model](/img/articles/2022-02-03-visual-thinking/common_model.png)

And you don’t have to use such a picture for planning only. Depending on the tool and, of course, team conventions, you
can use sticky notes as a way to decompose change into tasks, TODOs, things to remember/check - any action in general.
Such notes can have relations between themselves, can be arranged into a tree-like structure and in general such common
diagram can easily replace a standard issue tracker.

### The background

Why switching to a drawing board has such an effect? To answer this we have to check some facts. On a daily basis a
spoken (or written) language is our standard way of communication. And before we started talking we were able to:

* register movement (at 2 months age)
* trying to grab things by hand (5 months)
* follow movement with our eyes, find hidden things (7 months)
* exploit cause-effect - drop a toy an watch how it falls (8 months)
* start to use words in a proper context (11 months)

What is more, spatial-related terms
like ["where, here, near, etc."](https://en.wikipedia.org/wiki/Natural_semantic_metalanguage)
can be translated to any language in the world. Any creature in fact has to be spatial-aware in order to survive. Even
plants, so some extent - they move to follow the sun.

And, on the other hand, what language do we use to express ideas-related actions? As Barbara Tversky listed in her
["Mind in motion"](https://www.youtube.com/watch?v=gmc4wEL2aPQ) lecture we can:

* raise ideas
* pull them together
* tear apart
* turn inside out
* push forward
* toss out

![ideas and actions](/img/articles/2022-02-03-visual-thinking/ideas_and_actions.png)

We are talking about ideas in the same way as about any space-related topic.

How could it happen? Scientists have been trying to understand functions of different parts of the brain for some time
already. In the seventies they have identified so-called “place cells” - neurons that are activated at the specific
place. It took some time to identify another layer of neurons on top of the place cells: grid cells working as our inner
GPS, activated when switching location. The latter discovery was
awarded [Nobel Prize in 2014](https://www.nobelprize.org/prizes/medicine/2014/press-release/).

While performing tests on human beings it turned out that place cells are activated not only at specific places. They
are also activated by events, people, ideas. And the grid cells are activated when thinking about consequences of
events, social interactions and relations among ideas. We are using the same brain structures for spatial
orientation/reasoning and for thinking in general.

### TBD map elements
### Arrow as the special element
### TBD unstructured drawing
