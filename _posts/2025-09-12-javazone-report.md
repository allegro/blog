---
layout: post
title: JavaZone 2025 report
author: michal.kosmulski
tags: [conference, javazone, java, kotlin]
---
This is a summary of the JavaZone 2025 conference I attended in early September. It’s a conference focused on developers that I enjoyed and highly recommend.

## Style

JavaZone is a no-fluff conference. There are no keynotes or sponsored segments taking time away from interesting technical talks. Just two days of technical
stuff from 9 a.m. to 6 p.m. It is organized by JavaBin, a Norwegian Java User Group. Most talks are in English, but some are in Norwegian.

This year, the conference moved from its usual venue in Oslo, the Oslo Spektrum. The entertainment venue is undergoing radical redevelopment, and since it’s
right by the train station, its partially torn-down walls were the first thing that struck me upon arriving in Oslo.

<figure>
<img alt="Oslo Spektrum under redevelopment" src="/assets/img/articles/2025-09-12-javazone-report/oslo-spektrum-redevelopment.jpg" />
<figcaption>
Oslo Spektrum under redevelopment
</figcaption>
</figure>

The new venue is Nova Spektrum in Lillestrøm, just twelve minutes from Oslo by train. I think it is actually better than the old one, with more space
available and more comfortable rooms for presentations. The additional trip goes by fast, the only drawback being I had to leave the afterparty early for fear of
missing the last train.

<figure>
<img alt="The new venue in Lillestrøm" src="/assets/img/articles/2025-09-12-javazone-report/towards-nova-spektrum-lillestrom.jpg" />
<figcaption>
The new venue in Lillestrøm
</figcaption>
</figure>

## Side shows and food

If you want some fun, you can arrive half an hour before the first presentation starts and enjoy a side-show. This year, a chorus sang in Latin since the theme
was “Roman times.” The geek in me objected a bit since it was medieval rather than classical Latin, but I enjoyed it nonetheless. A barbarian drummer, a solo
singer, as well as Asterix and Obelix also appeared on stage. Many sponsors’ booths embraced the theme and featured decorations referring to centurions, Roman
theaters, and the like. The conference t-shirt proudly declared: “Veni, Vidi, JavaZoni.”

In line with that, food stands were named after Roman provinces, with Hispania serving tapas, Roma pizza, etc. Surprisingly, what should obviously have been
called Germania, was called “git Wurst” and, unsurprisingly, served currywurst and other sausages. Speaking of food, JavaZone is the only conference I know that
almost completely avoids queues: food is served all the time, not just in the short lunch and snack windows. This is brilliant in its simplicity, and works very
well. The food was tasty, quite varied, and as usual I had more than I should have.

<figure>
<img alt="Coffee names at a sponsor’s booth" src="/assets/img/articles/2025-09-12-javazone-report/roman-coffee-menu.jpg" />
<figcaption>
Coffee names at a sponsor’s booth
</figcaption>
</figure>

On the evening of the first day, there was a party with beer, time for talking to other participants, and in the evening a concert of several bands, the
highlight being Ylvis, of [What does the fox say?](https://youtu.be/jofNR_WkoCE) fame.

<figure>
<img alt="Ylvis concert" src="/assets/img/articles/2025-09-12-javazone-report/concert.jpg" />
<figcaption>
Ylvis concert
</figcaption>
</figure>

Sponsor stalls had the typical attractions you could expect, with small gadgets available for taking and larger ones requiring you to leave your data or to
solve a quiz. Some offered fun activities: there was an oversized Jenga game, chessboards, a basketball throwing contest, and even a bull-riding simulator. A
maker zone allowed you to play with programmable LED lights and 3D printing.

## Corridor talk

One thing unique to JavaZone is the presence of many public offices engaging in what usually only private businesses do. They send their employees to attend the
conference, some give interesting presentations, and many have high-quality sponsor booths with gadgets and recruitment. From corridor talk I learned they also
pay on par with or even better than commercial companies and actually form a significant part of the Norwegian IT job market. Public agencies that had sponsor booths
included the police, the post office, customs, and the labor and welfare administration (NAV). There are also private businesses whose main customers are
government agencies.

I spoke to a person working at a government agency that controls food exports to various countries and learned about the complexity of the domain and the
various regulations that need to be followed. Interestingly, in all but one case, all the advanced processing of data in IT systems ends with the printing of an
official paper document as other countries require this as the final permit proving food safety and regulatory compliance. The only exception is South Korea
which integrates with Norway via electronic means.

I also talked to people at the police booth. They were showing a surveillance drone as well as the navigation system it uses, developed in-house. Other projects
they were recruiting for included various databases and integration with other agencies’ systems. Recently, they launched an app that allows citizens to report
crime using their phones rather than by going to a police station and waiting for a paper report to be written down. Authentication is handled similarly to the
Polish e-PUAP system, with your bank being the authentication provider.

## Presentations

Below is a selection of the more interesting presentations I attended. You can already view the recordings from these, and
from [other presentations](https://2025.javazone.no/en/program) on the JavaZone website — click on the link in paragraph title to show the recording).

### [Writing Code for the Human Brain: Optimize code for Cognitive Bottlenecks](https://2025.javazone.no/en/program/5b7b0527-6975-4718-b137-45e11b0986b0), by Adam Tornhill

Why is some code easy to understand, and some is not? The author looks at various properties of code from a psychological perspective to explain this. He also
presents a tool he has developed, [CodeScene](https://codescene.com/), that can present some bottlenecks in code, such as places that many people modify. Such
places can indicate design flaws and be good places for refactorings. He uses popular open-source libraries as examples of projects with such bottlenecks.

### [Java Just Got Easier: How the Class File API Simplifies Updating your JVM](https://2025.javazone.no/en/program/a6ef4c94-167e-47d0-940a-596a9cf5c211), by Rafael Winterhalter

The author of the [ByteBuddy](https://github.com/raphw/byte-buddy/) library presents the structure of the Java class file format. He then goes on to explain how
you can programmatically create a new class using various APIs available in Java, and why you might want to do such a thing in the first place.

### [Dark Patterns to Rule Them All](https://2025.javazone.no/en/program/0ad11c81-3ca8-4d9f-95ac-d71a6d2efef0), by Sergès Goma

A ride through various ways in which websites try to force their users into doing something they would normally not do. From selecting the option more
convenient for the website as the default, through making it hard to opt out of services, to making you addicted and draining your wallet through automatic
unwanted sales, the spectrum of options is huge. A presentation both fun and scary. The speaker not only tried to raise awareness of those dark patterns and to
help listeners avoid them on websites they visit, but also appealed to developers to think of their users and not take part in implementing such behaviors.

### [Unpredictable, Unavoidable, Unstoppable: Communicating uncertainty with integrity](https://2025.javazone.no/en/program/e6beaa94-69d3-474c-ba05-0d0fdac12eb9), by Kristin Wulff and Anne Høymyr

You know that IT projects are complex and unpredictable, and that usually you don’t really know yet what to build when you start building it. That’s why we have
Agile and incremental delivery. But your management wants to know the exact timeline and continuous reports on progress. Sounds familiar? There are many
approaches to this problem, one of the humorous names being “stealth Agile,” which means working Agile to deliver the project, but pretending to your superiors
you’re doing waterfall as they expect of you. The authors suggest a better approach: understanding why your superiors need all those estimates and stiff
deadlines, while also providing a framework to communicate the inherent unpredictability of the project without playing cat and mouse.

### [What is multimodal RAG, and can we build a village with it?](https://2025.javazone.no/en/program/5d59f96d-06ba-4dc7-adc9-5f19a8d16c8c), by Alexander Chatzizacharias

The author created a self-playing RPG game in which characters wander about and talk to each other. To give each a unique personality, he used the RAG (
Retrieval-Augmented Generation) technique. In this case it took a pretty simple form: a description of the character’s traits and personality was injected into
the prompt to provide the generated utterances with the right context and mood. Besides just talking (text mode), one character is a painter with whom you can
discuss images you draw or ask him to draw something for you (image mode), and another a musician (audio mode). The author also mentioned trying to give one
character a malicious personality, and failing because of the LLM’s guardrails. The talk was fun and approachable.

### [Non-deterministic? No problem! You can deal with it!](https://2025.javazone.no/en/program/7f8c7120-a47e-4675-99d3-7012e6df2b6c), by Eric Deandrea and Oleg Šelajev

A primer on testing applications that rely on LLMs. Being probabilistic, LLMs make testing harder than systems that always deliver the same response for the
same request, but there are ways around this.

### [Building a real estate valuation tool: From AI/ML ambitions to a simplistic approach](https://2025.javazone.no/en/program/3bec3c32-a632-4b0e-8ce2-eb505b70ac70), by Henrik Wilskow Jenssen

A fun lightning talk, and an extreme example of using the right tool for the job. The author’s team was tasked with creating a tool for their real estate website
that would predict the price of properties listed for sale. The initial approach, based on ML, was often quite inaccurate. The team realized that only one
feature truly mattered: location. They replaced the complex ML-based system with one that computed the predicted price as the average of the prices of several
properties recently sold in the same area, achieving much better accuracy. Customers appreciated that this new system was much more explainable as well.

### [Revealing the magic behind Java annotations](https://2025.javazone.no/en/program/535b26a8-251c-41bf-8db7-588588d9177d), by Álvaro Sánchez-Mariscal

Compile-time annotation processing is a powerful technique that can be used and misused to enhance programs written in Java. The presentation explains how it
works under the hood, what it makes possible and what its limitations are, how various libraries work around those limitations, and why the author isn’t a fan
of Lombok.

### [Tackling Complexity with Domain Storytelling](https://2025.javazone.no/en/program/643ef290-f7c0-4ac1-8267-667a47d6126f), by Altug Bilgin Altintas

Domain Storytelling is a tool that can be used alongside Event Storming to allow business and technology to sit down together and discover the domain they will
be working on using DDD. A special open-source tool called [Egon](https://egon.io/) helps draw these stories, and once stories are drawn, to discover domain
boundaries.

### [Strengthening Immutability in Kotlin: A Glimpse into Valhalla](https://2025.javazone.no/en/program/ef560276-31ed-479a-8275-c697478df782), by Anton Arhipov

Kotlin already provides convenient syntax for working with immutable data structures, for example in the form of data classes. Several interesting extensions to
the language are planned which should make working with immutability even more convenient: deeply immutable data classes, immutable collections, and copy vars.
Besides more convenient syntax, these extensions may also allow new performance optimizations once project Valhalla arrives.

### [Watch It! Monitoring Lessons from Two Decades in Computing](https://2025.javazone.no/en/program/117285da-2c13-46eb-90dd-069707a3755f), by Markus Bjartveit Krüger

I don’t think there was anything new for me in this talk, but it was a well-presented overview of how and why you should monitor your systems, and how to avoid
common pitfalls related to observability.

### [82 Bugs I Collected in a Year You Won’t Believe Made It to Production](https://2025.javazone.no/en/program/bc91faab-5276-40d0-b7eb-7929bd8413eb), by François Martin

The last talk of the conference was a lighthearted analysis of bugs the author encountered when visiting various websites. Besides showing some interesting
examples, he also conducted a statistical analysis of the frequency of various types of bugs, and how it changed over time. The talk was enjoyable, and while
not directly useful in day-to-day work, I think it can help you focus on the most popular bug types when creating and testing your own applications.

## Sightseeing

Oslo is a nice city to see, though quite expensive. Public transport forms a well-developed network and can bring you even right up to the Holmenkollen ski
jumping venue located up on the hills outside of the city. The city center is compact and very walkable. Historical buildings include the cathedral, the
parliament building (Stortinget), and the royal castle as well as the Akershus fortress. There are many interesting museums, among which I found the Fram museum
one of the best. It includes two complete ships, Fram and Gjøa, that were used by polar explorers Nansen and Amundsen, lots of interesting information about the
exploration of the Arctic and Antarctic, and a section about the exploration of polar regions via airships and airplanes in the early 20th century. There are
also big art collections, especially of Edvard Munch, best known for The Scream, and a unique park filled with expressive sculptures by Gustav Vigeland.

<figure>
<img alt="Akershus Fortress, seen from a ferry" src="/assets/img/articles/2025-09-12-javazone-report/akershus-fortress.jpg" />
<figcaption>
Akershus Fortress, seen from a ferry
</figcaption>
</figure>

<figure>
<img alt="Museum ship Fram" src="/assets/img/articles/2025-09-12-javazone-report/museum-ship-fram.jpg" />
<figcaption>
Museum ship Fram
</figcaption>
</figure>

<figure>
<img alt="The Royal Castle" src="/assets/img/articles/2025-09-12-javazone-report/royal-castle-oslo.jpg" />
<figcaption>
The Royal Castle
</figcaption>
</figure>

<figure>
<img alt="“The day after”, a painting by Edvard Munch" src="/assets/img/articles/2025-09-12-javazone-report/the-day-after-munch.jpg" />
<figcaption>
“The day after”, a painting by Edvard Munch
</figcaption>
</figure>

<figure>
<img alt="Vigeland sculpture park" src="/assets/img/articles/2025-09-12-javazone-report/vigeland-park.jpg" />
<figcaption>
Vigeland sculpture park
</figcaption>
</figure>

## Summary

Just as in previous years, I enjoyed JavaZone a lot. I appreciate its no-nonsense approach that wastes no time on unnecessary elements, and focuses on strictly
technical presentations. The diversity of topics means it’s easy to find something worthwhile in each session, and while the complexity level varied, all talks
I attended were well-prepared and made interesting points. I enjoyed talking to other participants and the crews of sponsors’ booths. The logistics are very
well organized (no queues during lunch!) and the conference as a whole is lots of fun. I highly recommend it if you’re a developer or just want to stay up to
date with technology.

<figure>
<img alt="A laptop ad outside the main train station" src="/assets/img/articles/2025-09-12-javazone-report/greek-thinker-laptop.jpg" />
<figcaption>
A laptop ad outside the main train station
</figcaption>
</figure>
