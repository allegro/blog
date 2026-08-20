---
layout: post
title: "Saying Goodbye to the Endless Excel Spreadsheets: How a Bottom-Up Drive Brought Us a New Test Management Tool"
author: paulina.materna
tags: [ tech, testing, jira, quality-assurance, test-management, tools ]
---
If your test cases are scattered across multiple Excel files, Google Docs,
and Confluence pages, and keeping them up to date is incredibly
time-consuming, this post is for you.
This is the story of how [Allegro](https://allegro.tech) moved from scattered,
manual test tracking to a scalable, Jira-based solution now available to
thousands of engineers.

## The state of affairs, or: How many excel files can you juggle?

Let’s paint a picture. You join a new team operating in a complex,
distributed architecture. You want to understand the
high-level business flows and cross-team end-to-end scenarios, so you ask:
“Where are the E2E test cases?”
Your colleague takes a deep breath.
“Well,” they say, “some are in Confluence. Some are in a Google Doc from 2021 that
Harper made before he left. There’s also a spreadsheet, but I think Charlie updated it locally
and never pushed it. And then there are the acceptance criteria in the Jira tickets, if you
squint hard enough.”

This is not a hypothetical. This is — or rather, was — a fairly accurate description of
test management at scale in a company with hundreds of development teams.
The official term for what we had is “distributed knowledge.”
The unofficial term involves more colorful language.

The symptoms were familiar to anyone who has worked in a large-scale software organization:

- **Scattered data**: test cases spread across Excel, Word, Google Docs, Confluence, Jira descriptions,
  and the occasional sticky note.
- **No single source of truth**: trying to understand the overall testing state felt like
  assembling IKEA furniture without instructions — theoretically possible, practically maddening.
- **Process inconsistency**: every team had their own methodology, their own tool, their own
  naming convention. Communication across teams resembled a game of telephone.
- **Knowledge gaps**: onboarding a new team member? Enjoy your archaeological expedition
  through 18 months of chat history.
- **Duplicate efforts**: three different teams, independently, at approximately the same time,
  writing nearly identical test cases for the checkout flow. A distributed systems problem
  in the most ironic possible sense.
- **Lack of formalized test scenarios**: in some cases, regression or manual
  testing relied entirely on the team’s domain expertise rather than
  predefined, repeatable test procedures. While experienced engineers knew
  exactly where to look, the lack of documented test cases made these
  validation processes non-transferable and hard to scale.

The main challenge was structural rather than technical. Unit and integration
tests for individual services lived safely in repositories, but end-to-end
testing of broader business flows required coordination across teams and a
shared place for documenting and maintaining those scenarios. At the time,
we did not yet have a standardized, centralized tool that fit naturally into
how our engineers already work. As a result, many teams relied on the tools
that were most readily available to them, and over time that led to a
landscape of spreadsheets and documents distributed across the organization.

## The quest begins: in search of the holy plugin

Once the problem was clearly articulated — which itself took some effort — the natural
question arose: what should we do about it? We knew we needed a test management tool.
We had some idea of what “good” looked like. And we had one very firm constraint:
it needed to integrate deeply with Jira, since that’s where our teams already live,
breathe, and track their work.

The existing solution in our software catalog was [TestRail](https://www.testrail.com/) —
a well-known, capable, and very much external tool. The problems with TestRail were threefold.
First, it lives outside Jira, which means context-switching and integration overhead.
Second, licensing it for an organization of our size would require the kind of budget conversation
that nobody enjoys having. Third, and perhaps most pragmatic one: limited licenses meant
only select people could use it, which made it much harder to share test cases
across the organization and manage them effectively at scale. That defeated
the purpose of a company-wide quality culture.

So we embarked on a proper market analysis. We identified the key functional requirements,
compiled a list of candidate tools, narrowed them down to three finalists, and ran them
through a structured testing phase in a dedicated Jira test environment. Each tool was evaluated
across a comprehensive set of criteria: test design, import/export capabilities,
test execution lifecycle, requirements traceability, automation framework integration,
CI/CD pipeline support, Jira integration quality, reporting, and dashboards.

We even made demo videos for each category. Twelve categories, multiple tools.
This was, to put it diplomatically, a significant investment of time and effort.

![Project phases for test management tool rollout](/assets/img/articles/2026-07-06-saying-goodbye-to-the-endless-excel-spreadsheets-how-a-bottom-up-drive-brought-us-a-new-test-management-tool/project-phases-rollout.png)



## The great plugin bake-off

Three tools entered the ring. After rigorous evaluation, one emerged victorious:
[QMetry Test Management for Jira (QMetry)](https://www.qmetry.com/qmetry-test-management-for-jira/),
developed by SmartBear Software.

Why QMetry? A few reasons that genuinely mattered in our context:

**It lives inside Jira.** This is not a small thing. When test cases, requirements,
defects, and user stories all exist in the same tool that your developers, product managers,
and business analysts already use, the collaboration overhead drops dramatically.
No context switching, no manual synchronization between systems, no “oh, that’s in the other tool.”

**Traceability without tears.** QMetry allows you to link test cases directly to
Jira user stories and defects, track execution history, and generate real-time dashboards.
Stakeholders can see test execution progress without having to ask anyone.
(This last point was received with particular enthusiasm by product managers,
for reasons that will be obvious to anyone who has ever been asked
“so how’s the testing going?” for the fourteenth time.)

**Automation-friendly.** We use [Cypress](https://www.cypress.io/),
[Playwright](https://playwright.dev/), and [RestAssured](https://rest-assured.io/),
among others. QMetry supports automatic test result uploads from these frameworks
and can be wired into CI/CD pipelines — so the test management tool becomes a
natural part of the delivery flow rather than a post-hoc reporting exercise.

**Scale.** Our organization has hundreds of teams, international markets,
and a growing need for cross-team test coordination. A plugin that runs inside
our existing Jira infrastructure inherits that infrastructure’s scalability properties.
We are not adding another system to maintain; we are extending the one we already have.

## Rolling it out at scale

Deploying any new tool to a large engineering organization is less of a technical challenge
and more of a change management challenge wearing a technical disguise.
You can have the best tool in the world and still fail spectacularly if you ignore
the human factors: adoption, training, incentives, and the deeply ingrained habit
of opening Excel by default.

Our approach was to start with teams that had the clearest and most immediate need —
those dealing with internationalization testing, accessibility, and large cross-team projects.
Early adopters help establish patterns, expose edge cases, and produce the kind of
concrete success stories that make later adoption feel less risky for skeptics.

We also invested in making the “right way” the easy way. Integration with our existing
automation frameworks means that teams already doing test automation can get their
results into QMetry without heroic effort. CI/CD integration means the feedback loop
is short and automated. The goal is a world where using QMetry is simply the path
of least resistance — not a missionary project requiring continuous persuasion.

## How will we know if it worked?

The rollout is already live in production, and the plugin is available to
100% of Jira users across our projects. The next step is to track how teams
adopt it in practice and whether it improves the quality and visibility of
their testing processes over time.

For this type of project, a practical measurement framework could include:

- **Adoption**: number of projects with the plugin actively in use, number of active users,
  growth rate of created test procedures and test case repositories.
- **Quality signal**: number of defects linked to specific test cases and issue types,
  volume of generated reports, frequency of test suite updates.
- **User satisfaction**: periodic ratings on a 1–5 scale, qualitative feedback on the most
  valuable features, and the always-illuminating question: “Would you keep using this next year?”
- **Operational usage**: number of executed test runs, share of test executions
  triggered through CI/CD, and frequency of automated result uploads from
  integrated frameworks.
- **Process maturity**: percentage of test cases linked to requirements or
  defects, share of projects with documented regression suites, and reuse of
  shared test scenarios across teams.
- **Enablement reach**: training attendance, tutorial completion, webinar
  participation, and the number of teams that move from evaluation to regular
  day-to-day use.

Together, these indicators help assess whether the rollout is gaining
adoption, improving traceability and execution discipline, and delivering
practical value across teams over time.

## What we have learned (so far)

A few things that may be useful to others attempting something similar:

**Define your requirements before you look at tools.** It sounds obvious.
It is apparently not obvious. Starting with a clear list of “must have” and “nice to have”
capabilities — and getting stakeholders to agree on that list before demoing anything —
saved us a significant amount of time and debate later in the process.

**The Jira-native constraint mattered enormously.** For organizations deeply committed to
Jira as their project management backbone, the friction of an external tool is real and
should not be underestimated. A plugin that lives inside your existing environment inherits
trust, familiarity, and access controls you would otherwise have to recreate.

**Testing debt is real and it compounds.** Every new market, every new product area,
every new team that onboards without a structured test management process adds to
a growing deficit. The later you address it, the more expensive it becomes —
not just financially, but in terms of institutional knowledge, consistency, and
the sheer volume of tests that will eventually need to be migrated or recreated.

**Change management is the hard part.** The plugin selection was the fun part.
The tool evaluation was intellectually satisfying. Getting hundreds of teams to
change their established workflows is where the real work begins.
Patience, clear communication, and visible wins from early adopters are your
most important tools — not the plugin itself.

## Retrospective: Driving change from the bottom up

Looking back at the entire journey, a project like this succeeds or fails
based on how well you engage the community. In our case, it was a truly
bottom-up initiative led by the testing community.
It started with one person who pulled together a small tester task force,
and that core group drove the work end to end. To avoid optimizing for only
one domain, we validated decisions continuously with the broader QA community:
collecting volunteers, running feedback loops, and gathering test needs from
different areas before locking major rollout choices.
We also ran regular synchronization with different business domains and key
stakeholders to keep priorities aligned and incorporate cross-functional needs.

![Example generic rollout roadmap](/assets/img/articles/2026-07-06-saying-goodbye-to-the-endless-excel-spreadsheets-how-a-bottom-up-drive-brought-us-a-new-test-management-tool/roadmap-example-generic.png)
*This infographic was prepared with the assistance of AI; its content has been reviewed by the author.*

1. Start with the testing community. Collect opinions early, discuss pain points,
  and translate feedback into explicit requirements.
2. Build your coalition. Find “partners in crime” and business stakeholders who
  will actively support the rollout and explain its value in business terms.
3. Structure decision-making. Use comprehensive Request for Proposal (RFP) documents, compare options
  transparently, and synchronize work across teams.
4. Build a diverse quality team. Include people with different seniority levels
  and perspectives, and involve the security department for technical support.
5. Keep progress visible. Use mind maps, roadmaps, and regular status updates so
  teams can see where the project is and what comes next.
6. Invest in adoption at the end. Record tutorials, run training sessions,
  webinars, and presentations. In short, you need to “sell” the product
  internally to make adoption sustainable.

To make this practical, use an RFP template with a feature scoring matrix,
a repeatable test phase flow, and one critical rule for coordination —
always keep a single reference link (single source of truth) for criteria,
scores, and final decisions.

In practice, tie each test scenario directly to a specific feature area,
as shown in the template. A practical mapping can look like this:

- **Design and test case management** -> create/edit/version test case,
  folder structure readability, and custom fields behavior.
- **Import and export** -> cross-project export/import, re-import updates,
  and field mapping consistency.
- **Execution and environments** -> test execution creation, environment setup,
  history tracking, and exploratory runs.
- **Traceability** -> linking requirements, test cases, and defects,
  then validating traceability reports.
- **Automation and CI/CD integration** -> ingest automated results,
  attach artifacts, and verify pipeline/notification flow.
- **Reporting and PM visibility** -> dashboards, filters, and progress tracking
  for stakeholder updates.

![Anonymous RFP template for plugin evaluation with test phase flow and single reference rule](/assets/img/articles/2026-07-06-saying-goodbye-to-the-endless-excel-spreadsheets-how-a-bottom-up-drive-brought-us-a-new-test-management-tool/rfp-plugin-evaluation-template.png)
*This infographic was prepared with the assistance of AI; its content has been reviewed by the author.*

## Before we wrap up: seven myths worth challenging

Test management tools can dramatically improve visibility and coordination,
but they are not magic wands. During the rollout, we kept hearing the same myths:

- **“Only testers can use it.”** Value grows when developers, analysts,
  and product stakeholders use shared test artifacts.
- **“The tool guarantees better testing.”** The tool supports process quality;
  it does not replace engineering discipline.
- **“It will automatically reduce defects.”** Defect trends improve only when
  teams consistently act on insights from execution data.
- **“Now we can track everything.”** Tracking still requires clear ownership,
  scope, and governance.
- **“Communication is no longer needed.”** Shared tooling reduces friction,
  but cross-team conversations remain essential.
- **“Reports will interpret themselves.”** Dashboards provide signal, but people
  still need to analyze, prioritize, and decide.
- **“The day we install the plugin, Excel chaos will disappear overnight.”**
  Real change takes time: local champions, tailored onboarding,
  and visible wins in each team.

---

We are still early in this journey. The rollout continues, the adoption metrics
are being watched, and somewhere, inevitably, someone is still opening Excel out of habit.
But the direction is set, the tool is deployed, and the era of
“testing by gut feeling” is — slowly, measurably — coming to an end.

If you have questions, lessons of your own to share, or just want to commiserate
about test management in large organizations, feel free to reach out.

<style>
  .article-image-zoom-target {
    cursor: zoom-in;
    transition: transform 0.18s ease;
  }

  .article-image-zoom-target:hover {
    transform: scale(1.01);
  }

  .article-image-lightbox {
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(13, 17, 23, 0.88);
    z-index: 9999;
  }

  .article-image-lightbox.is-open {
    display: flex;
  }

  .article-image-lightbox img {
    max-width: 95vw;
    max-height: 95vh;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 14px 48px rgba(0, 0, 0, 0.45);
  }

  .article-image-lightbox-close {
    position: absolute;
    top: 14px;
    right: 18px;
    border: 0;
    background: transparent;
    color: #fff;
    font-size: 34px;
    line-height: 1;
    cursor: pointer;
    padding: 4px;
  }
</style>

<script>
  (function () {
    const articleImagePath = "/assets/img/articles/2026-07-06-saying-goodbye-to-the-endless-excel-spreadsheets-how-a-bottom-up-drive-brought-us-a-new-test-management-tool/";
    const images = Array.from(document.querySelectorAll("article img"))
      .filter((img) => (img.getAttribute("src") || "").includes(articleImagePath));

    if (!images.length) {
      return;
    }

    const lightbox = document.createElement("div");
    lightbox.className = "article-image-lightbox";
    lightbox.setAttribute("aria-hidden", "true");

    const fullImage = document.createElement("img");
    fullImage.alt = "";

    const closeButton = document.createElement("button");
    closeButton.className = "article-image-lightbox-close";
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("aria-label", "Close image preview");
    closeButton.textContent = "×";

    lightbox.appendChild(fullImage);
    lightbox.appendChild(closeButton);
    document.body.appendChild(lightbox);

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    const openLightbox = (img) => {
      fullImage.src = img.currentSrc || img.src;
      fullImage.alt = img.alt || "Image preview";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    images.forEach((img) => {
      img.classList.add("article-image-zoom-target");
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");

      img.addEventListener("click", () => openLightbox(img));
      img.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(img);
        }
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  })();
</script>
