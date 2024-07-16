---
layout: post
title: "BPMN: The Key to Understanding Business Processes"
author: kamila.rybkiewicz
tags: [tech, bpmn, process mining, event storming, business processes]
---

If you have experience with Event Storming and have ever found yourself wishing there was a way to document the insights gathered during a session,
or wanting to communicate the process to other team members, then I have a solution for you. This idea can be expressed in a famous saying:
>_One picture is worth more than a thousand words._

As a passionate [process mapper](https://en.wikipedia.org/wiki/Business_process_mapping), I am convinced that [Business Process Model and Notation (BPMN)](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation) is the key to understanding the analysis and optimization of business processes.
I resonate deeply with the idea that graphical visualization using BPMN allows for clear representation of processes,
making it easier for all participants to understand, regardless of their role within the organization. Familiarity with BPMN is not solely vital for business
analysts, but also serves as a valuable tool for developers, testers, and project managers. Crafting process maps at the initial stages of any project, featuring
both the current AS-IS and intended TO-BE process, paves the way for more efficient and transparent communication between technical teams and their business stakeholders.
I love that “Aha” moment when participants discover and share knowledge about the process, leading to synergy and better understanding among both business and technical teams.

![BPMN simple example](/assets/img/articles/2024-06-04-bpmn-the-key-to-understanding-business-processes/bpmn_example_1.png)

## BPMN: Basics and Functions

BPMN is a standard graphical notation language that enables the depiction of business processes in a way that is understandable to all stakeholders.
Using graphical elements such as tasks, events, decision gateways, and flows, BPMN allows for the precise definition of the sequence of actions,
resources, and the role of each participant in the process.
Here is a simple example. Keep in mind that in real life, maps are usually much more complex.

![BPMN example](/assets/img/articles/2024-06-04-bpmn-the-key-to-understanding-business-processes/bpmn_example_2.png)

## Benefits from a Broader Perspective
Mapping processes with BPMN brings numerous benefits to organizations. First, it enables a better understanding and analysis of business processes,
leading to improved communication and collaboration between different departments. In my opinion, it should always be the first step before
undertaking actions aimed at optimizing, standardizing, and automating business processes. Moreover, it helps identify those responsible for
processes, as well as define the participants and the dependencies between them. Overall, process management aims to increase awareness and
improve process efficiency within the company, which is a priority for every organization.

## Updating Maps: Processes in Constant Motion
However, it is essential to remember that business processes are dynamic and continuously changing. Creating a process map is only the
first step. Unfortunately, these maps require regular updates to reflect the actual state of processes and continue to serve as a tool
for understanding, analysis, and optimization.

## Synergy with Event Storming
Event Storming, as described in this [article]({% post_url 2022-07-19-event-storming-workshops %}),
is also close to my heart because the similarity between [BPM (Business Process Modelling)](https://en.wikipedia.org/wiki/Business_process_modeling)
using BPMN and Event Storming is undeniable. Both approaches emphasize
communication and knowledge sharing, leading to better understanding and effective optimization of processes. The difference lies in the
fact that Event Storming focuses on an interactive workshop, while BPMN offers a specific process notation. From my experience, these two
worlds can be combined. To retain the knowledge discovered in Event Storming workshops, I suggest documenting the process in BPMN notation,
which serves as an excellent material for further work on process optimization or spreading knowledge about it further. The importance of
open communication and preventing knowledge loss is elaborated [here]({% post_url 2023-10-30-battle-against-knowledge-loss %}).
Although BPM, using BPMN for process notation, and Event Storming, a workshop method, are distinct, they both aim to enhance process understanding.
Below is my comparison:

![BPMN vs Event Storming](/assets/img/articles/2024-06-04-bpmn-the-key-to-understanding-business-processes/bpmn_vs_es.png)

## Process Mining: Immersion in the Process
Process Mining is a technique for process analysis that naturally complements BPMN process mapping. It represents a higher level
of process management by utilizing real data, such as process
logs from various systems, to show how processes actually unfold in practice. Moreover, we can use a Conformance
Checker to compare our desired process model (or how we think it goes), presented through a BPMN map, with actual behaviors and deviations.
This enables organizations to identify areas for optimization and improvement, monitor compliance with established standards, and respond
to changes in the business environment.

## Summary
BPMN, along with Process Mining and Event Storming, are tools that allow for a better understanding of business processes. They are the key
and the beginning of something more, namely, a process management approach within companies. Through this, organizations can gain a deeper
understanding of their processes, identify areas for improvement, respond to changes in the business environment, and strive for efficiency
improvements at every level of operation.
