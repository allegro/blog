---
layout: post
title: "Beyond the Code - An Engineer’s Battle Against Knowledge Loss"
author: [ krzysztof.przychodzki ]
tags: [ eventstorming, knowledge-preservation, tech, communication ]
---

The idea for this article arose during a meeting where we learned that our supervisor would be leaving the company to pursue new opportunities. In response, a
colleague lamented that what we would miss most is the knowledge departing with the leader. Unfortunately, that’s how it goes. Not only do we lose a colleague,
but we also lose valuable knowledge and experience. However, this isn’t a story about my supervisor; it’s a story about all those individuals who are experts in
their fields, who understand the paths to success and paths that lead to catastrophic failures. When they leave, they take with them knowledge that you won’t
find in any book, note, or Jira ticket. And this leads to a fundamental question: *What can be done to avoid this “black hole” of knowledge? How can we ensure
it doesn’t vanish along with them?* That’s what this article is all about.

## Business Decisions Somebody Made… and didn’t tell you

Specifically for this article I created the term *Biological Data Storage* or *BDS* for short. This term encompasses nearly every employee in a company. I
understand that nobody wants to be seen as just a resource, and certainly not as part of the *Biological Data Storage*. However, in the context of a company’s
resources, an employee can be likened to a technical data repository, but with the valuable addition of context.

I wanted to examine this issue more broadly from an engineer’s perspective. We often hear about Conway’s Law:

> Any organization that designs a system (defined broadly) will produce a design whose structure is a copy of the organization’s communication structure. [^1]

And I perceive the loss of knowledge as a depletion of communication, which can ultimately result in its imperfections within the created system.

The engineering approach is marked by our commitment to gauging the impact of various events and assessing their real significance using specific metrics. When
dealing with the challenge of an employee departing, consider these metrics to evaluate organizational effectiveness:

1. Time to Problem Resolution:
    - measures how quickly issues or challenges are resolved and helps identify the efficiency of problem-solving processes.
2. Knowledge Transfer Rate:
    - measures how long it takes for a new employee to become self-sufficient and also indicates the effectiveness of knowledge transfer and onboarding.

I think these metrics provide valuable insights into organizational efficiency and its capacity to seamlessly integrate new team members.
In the context of Conway’s Law, the loss of knowledge becomes a critical factor influencing not only communication but also the very design of systems within
the company.

Consider this: when a team member with a wealth of knowledge and expertise departs, they take with them not just facts and figures but also their unique
insights, problem-solving approaches, and understanding of the organization’s intricacies. The lack of such knowledge can disrupt the flow of information within
teams and across departments. As a result, the communication structure can falter, hindering the organization’s ability to respond to challenges effectively.

Moreover, the design of systems can be profoundly impacted. Engineers and developers who were privy to invaluable knowledge may have made design choices based
on their expertise. These decisions may not have been documented or clearly understood by others, and when their authors leave, may become opaque. This can lead
to difficulties in maintaining and developing these systems, potentially causing inefficiencies and vulnerabilities.

Now, when we introduce the *Knowledge Transfer Rate* metric into this context, it becomes evident that measuring how long it takes for a new employee to become
self-sufficient is crucial. The longer this duration, the more pronounced the knowledge gap becomes, affecting both communication and system design.
Organizations must recognize that knowledge isn’t just about data; it’s about understanding and context, and its loss can significantly impede the smooth
functioning of teams and the evolution of systems.

## Organizations have no memory

You might ask, “What’s the impact of losing this knowledge on a company?” Is it that business processes start collapsing like houses of cards? Innovation loses
its wings? The company’s efficiency plummets like leaves in an autumn storm?
The answer to the above questions in 98% of cases is - of course, no - because we can manage such risks. Companies have ways of dealing with them, but do they,
really?

*Organizations have no memory* is a quote from Trevor Kletz’s book *Lessons from Disaster*, which highlights the concept of organizational memory and how
incidents and accidents can recur due to the lack of effective learning from past mistakes within an organization. Prof. Kletz highlights the organization’s
inability to learn from accidents, even those occurring within the company. I sometimes feel that a similar pattern emerges when knowledge departs from our
company. Perhaps because it can’t be easily measured in money, it’s often downplayed.

While Kletz’s book pertains to chemical engineering, I see several universal truths that apply to any situation and industry. For example, another quote, “What
you don’t have, can’t leak” is remarkably similar to the idea that code you don’t have is *maintainless* and won’t have bugs. There are likely analogous
principles in our field.

However, even at this stage, the process of knowledge acquisition can be accelerated. There are several ways to do it, such as creating procedures, diagrams,
charts, and documentation.

Documentation is like treasure maps in the business world. Creating documentation is one thing, but keeping it up-to-date within an organization (regardless of
its size) is a challenge. Encouraging the team to regularly update documentation is also a challenge. Even the best-prepared documentation often lacks many
details, like the rationale behind specific business decisions, why a particular database or framework was chosen, or why we use technology *Y* instead of the
more prevalent *X* throughout the company.

So, while documentation is like treasure maps for your company, recorded, organized, and structured information about processes, systems, and practices within
the company are akin to Architecture Decision Records (ADRs). ADRs are like the flight recorders of our business. They contain records of critical decisions
made during system design or significant technological choices.

Why is this important? When creating new things, we make numerous decisions that may appear irrational without the right context later on. ADRs are like opening
a box that explains why these decisions were made. It’s the key to understanding the company’s history and evolution. In the context of our *BDS*, ADRs are
like recordings of experts’ thoughts when making key decisions. When these experts leave, these recordings become a treasure trove of knowledge, helping us
avoid repeating the same mistakes.

A common scenario emerges: the team tasked with addressing the problem must invest valuable time in rediscovering solutions, experimenting with potential fixes,
or even resorting to trial and error. This not only prolongs the problem-solving process but can also result in suboptimal resolutions, increased frustration,
and a negative impact on overall productivity. Thanks to documentation and ADR we can significantly reduce this time.

## An alternative to lengthy documentation?

> No one reads.
> If someone does read, he doesn’t understand.
> If he understands, he immediately forgets.

Unfortunately, just as is the case in the above quote from Stanisław Lem [^2], the problem with documentation, procedures, and ADRs is that people need to
familiarize themselves with them. I suppose that even at SpaceX, it’s doubtful this would be considered the most thrilling reading material, or maybe I am just
mistaken. Anyway, even if someone manages to get through the documentation, they’ll only retain what they understand. We’re presented with the work of others,
with their imposed ways of thinking and decision-making. Often, questions arise to which no one knows the answers, and the people who do know are no longer with
the company.

Since we now know our mental limitations, instead of forcing people to sift through stacks of documentation, we can
use [EventStorming](https://blog.allegro.tech/2022/07/event-storming-workshops.html). This technique helps understand business processes, identify events and
activities, and integrate knowledge in an understandable way. We focus on behaviors, on what changes and why. Together, we develop a solution and understand the
processes because we see them from start to finish. Understanding a process through EventStorming is faster and easier than reading documentation. During an
EventStorming session, most questions find answers, and knowledge can be conveyed to many people simultaneously, whether they are technical or not. The most
significant artifact of such sessions is that you can discuss why the process looks the way it does, why a specific sequence was chosen, and not another —
essentially, a mega-mix of documentation, ADR, and conversation. I emphasize once more that this understanding of the process is developed collectively —
everyone feels as a part of the solution. In the case of our *BDS*, EventStorming is like capturing the thoughts of experts when making crucial decisions.

### Real life example

At [Allegro](https://allegro.tech/), we recently had a situation where the entire development team responsible for a critical service was moved to a different
project. The new team, which inherited the service, had the opportunity to collaborate with the departing team for a period. However, in this context, we also
conducted EventStorming sessions. To provide more detail, these sessions extended over two full days, each lasting 8 hours. The knowledge accumulated over the
past five years was not merely confined to two plotter paper-sized sheets, each stretching 6 meters in length, but was primarily assimilated within the
participants’ minds in a seamless manner. I believe this facilitated the new team in gaining greater confidence when taking over the domain.

Interestingly, you don’t need to spend a lot of time on EventStorming to uncover enough business knowledge. In the case mentioned earlier, the session lasted
two days, but it involved an entire team. For an individual, a two-hour workshop can be enough to see the big picture of our process. Although EventStorming
allows us to absorb a dose of knowledge relatively easily to know *what and why* is changing in our process, the devil is in the detail. To really understand
*how* this process is changing, it’s best to start by doing small tasks under the guidance of an experienced person.

## Seeking UML-like Alternatives?

Unfortunately, EventStorming is not the answer to all knowledge loss-related problems. While I don’t question how fantastic this tool is, the knowledge acquired
through it will remain only in the participants’ minds. If it’s not somehow preserved in the form of documentation or ADRs, it may turn out to be just as
fleeting as departing employees. What can be done about this? Our initial thoughts may lead us to create some form of description or documentation, which, as we
know, comes with the challenge of its preparation and the cognitive overload for someone trying to assimilate new knowledge.

It seems that when dealing with the issue of knowledge loss and its effective transfer, it’s worth mentioning tools like BPMN, which stands for Business Process
Model and Notation. BPMN provides a standardized graphical representation of business processes. By using BPMN diagrams, we can visually map
workflows and procedures. Such an approach not only simplifies the understanding of complex processes but also aids in comprehensive documentation. When
combined with other knowledge-sharing techniques, such as EventStorming, BPMN can be a powerful asset in preserving and transferring critical business
knowledge.

However, BPMN has an elaborate set of symbols and notation rules, which can make creating and interpreting diagrams complicated for some individuals. Creating
advanced BPMN diagrams and fully utilizing the notation’s potential requires specialized knowledge and experience. People unfamiliar with BPMN may struggle
to use it effectively. Despite these inconveniences, BPMN still remains a valuable tool for modeling and documenting business processes in many organizations. I
believe it complements the previously mentioned techniques perfectly.

Just remember to have the right tools in your arsenal and, more importantly, to choose the appropriate tool for the situation, considering both its strengths
and weaknesses.

## One more thing…

*Time to Problem Resolution* metric serves as a clear indicator of an organization’s efficiency in addressing challenges. A shorter time to resolution signifies
that issues are tackled swiftly, minimizing disruptions and ensuring that the organization operates smoothly.
*Knowledge Transfer Rate* metric is a means to quantify and address the loss of knowledge, shedding light on its impact on communication structures and system
design within an organization.

Both metrics are directly influenced by the use of appropriate tools such as documentation, ADRs, EventStorming or BPMN. I have tried to highlight their
advantages and disadvantages in the context of knowledge transfer.

However, there is another challenge - changing the company’s culture. Employees must know what tools they have and feel that sharing knowledge is key to
success. Leadership plays a crucial role here, as leaders need to actively promote and engage in knowledge sharing and open communication. If company leaders
actively endorse and engage in knowledge sharing, other employees are more likely to follow suit. However, changing organizational culture is a time-consuming
process. Patience and perseverance are essential until new behaviors and beliefs prevail over old ones.

## This can be done

As an engineer in an organisation, regardless of size, there are several proactive steps you can take to facilitate knowledge transfer. First and foremost,
actively engage in open communication with your colleagues. Encourage discussion and information sharing, especially within your area of expertise, to ensure
that valuable insights are shared. Second, mentorship can be a powerful tool. Offer to mentor junior team members or be open to seeking guidance from more
experienced colleagues. In addition, participate in knowledge-sharing initiatives within the company, such as brown bag sessions, workshops or cross-functional
projects. Finally, consider creating or contributing to internal documentation and repositories. These resources can serve as valuable references for your
colleagues and future team members, ensuring that knowledge is retained within the organisation. By actively participating in these practices, you can play a
key role in preserving and transferring critical knowledge within your organisation.

## Summary

In this article, I aimed to discuss how knowledge loss in a company appears through an engineer’s eyes and why it can pose a threat. The term *Biological Data
Storage* may sound unconventional, but it emphasises the critical role that every team member plays in preserving and transferring knowledge. It’s important to
remember that employees are not just resources; they are the living repositories of valuable information, experience and expertise. In the world of *BDS*, every
member contributes to the collective body of knowledge, shaping the organisation’s communication structure.
As we say goodbye to departing colleagues, let’s also say goodbye to the notion that knowledge should be confined to individual minds. Instead, let’s adopt a
culture of open communication, active knowledge sharing and the right tools, such as EventStorming and BPMN, to capture, preserve and share critical knowledge
across our organisation.

### Footnotes

[^1]: Quote from https://en.wikipedia.org/wiki/Conway%27s_law
[^2]: https://en.wikipedia.org/wiki/Stanis%C5%82aw_Lem
