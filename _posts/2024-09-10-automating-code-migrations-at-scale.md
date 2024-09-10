---
layout: post
title: Automating Code Migrations at Scale
author: [ bartosz.galek, radoslaw.panuszewski, aleksandr.serbin ]
tags: [ migrations, rewrite, breaking changes, dependabot ]
---

At Allegro, we continuously improve our development processes to maintain high
code quality and efficiency standards. One of the significant challenges we
encounter is managing code migrations at scale, especially with breaking changes
in our internal libraries or workflows. Manual code migration is a severe burden, with over
2000 services (and their repositories). We need to introduce some kind
of code migration management.

## The challenge

<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<link rel="stylesheet" type="text/css" href="/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/asciinema-player.css" />

Migrating code across numerous repositories is incredibly painful when new
versions of a company-wide library introduce breaking changes.
Traditionally, developers must follow migration guides in release notes,
identify the required changes, and manually update their code.

This process is not only time-consuming but also prone to human error, which can
lead to inconsistencies and potential issues in production. It also raises many
questions on Slack support channels. To address this, we are proud to
share the solution we developed at Allegro - a unique and automated solution
based on [GitHub's Dependabot](https://github.com/dependabot) and
[OpenRewrite](https://docs.openrewrite.org), creating a seamless process for
upgrading codebases with minimal manual intervention. This solution reduces the
tedious manual labor, allowing you to focus on more strategic tasks.

We wanted to use as many existing tools as possible,
so we decided to go with Dependabot together with our custom
GitHub application called `@allegro-rewrite` that leverages OpenRewrite.

With developer experience in mind, we set ourselves a few goals:

- reduce the manual effort required to update code across thousands of repositories
- not overwhelm developers with new tools and processes
- make sure every migration is auditable and easily reversible
- create a deadline process for merging important migrations
- provide an easy way to rerun the migration if needed
- do our best to migrate as much as possible automatically, but not strive for perfection;
  it's still better to have 90% of the codebase migrated than to start from scratch

Other tools such as: [Atomist](https://atomist.github.io/sdm/index.html) or [SourceGraph’s Batch Changes](https://about.sourcegraph.com/batch-changes) are also
worth mentioning.
They're cool, and some will also participate in this story.

Let's dive into the details of our solution.

## How it works

### Allegro spring-boot-starter upgrade process

Here is a diagram that shows the process of upgrading our internal
Spring Boot starter library, across multiple repositories.

<pre class="mermaid" style="display: flex; justify-content: center">
sequenceDiagram
    Dependabot->>GitHub: Pull Request with a version bump
    GitHub->>allegro-rewrite: Pull Request event
    allegro-rewrite->>GitHub: Add Pull Request comment
    Note right of allegro-rewrite: Runs OpenRewrite recipes
    allegro-rewrite->>GitHub: Add commit with changes
    allegro-rewrite->>GitHub: Approve the Pull Request

</pre>

**Step 1: Version Bump Detection**

Dependabot continuously monitors our GitHub organization for outdated dependencies. When
a new major version of our internal Spring Boot starter library is
released, Dependabot creates a pull request to update the version in Dependabot enabled
repositories.

![Dependabot pull request created](/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/pull-request-from-dependabot.png)

**Step 2: Take the wheel!**

Our custom GitHub application, `@allegro-rewrite` is subscribed to the
[dependents pull request creation events webhook](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads). Upon
detecting a supported Dependabot Pull Request, @allegro-rewrite triggers a
GitHub workflow designed to automate the migration process for the given case.

![Dependabot pull request taken over](/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/pull-request-takedown.png)

**Step 3: Automated Code Transformations**

Breaking changes are inevitable when we want to innovate more and provide new
features faster. Thus, more than a simple version bump is required. At the same time,
we don't want our developers to spend lots of time just addressing the
incompatibilities that we have introduced, so we delegate this routine to the
automation.

The workflow begins by commenting on the PR to notify the maintainers that an
automated migration is underway. It then clones the repository in GitHub runner
workspace and applies a series of OpenRewrite recipes tailored
to address the breaking change update.

![Necessary comments](/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/pull-request-migration-start-comment.png)

After applying the necessary changes, the workflow commits the modifications
(with a GitHub app-signed commit) and pushes them to the relevant Dependabot
branch. This ensures the PR is updated with the required code transformations
and ready for review and merge.

![Migration finished](/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/pull-request-migration-finished.png)

Voilà - build passed! We can add some encouraging comments!

![Build successful](/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/pull-request-build-green.png)

## Extending the Solution

### Pull request commands

We've introduced comment commands to our `@allegro-rewrite` app that are similar in use to
`@dependabot` comments that Dependabot handles, enabling further interactions and
customizations through PR and issue comments.

![Pull requests commands](/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/pull-request-commands.png)

### CLI tool

We also distributed our allegro-rewrite app as a regular binary via our internal [brew tap](https://docs.brew.sh/Taps).

<div id="cli-recording"></div>

In the end, the architecture of our automated migration solution is highly extensible.
We can create and apply custom recipes for various scenarios, not
limited to dependabot version updates or GitHub-related workflows.

### Time-framed migrations

Imagine a situation where a security vulnerability is discovered in a library
used across all services. We can set a deadline for the migration to ensure
that all services are updated within a specific timeframe.

We don't want to step in the responsibility of the maintainers, but we also
know that sometimes it's hard to prioritize the migration over other tasks.

That's why, when the time is up, we can trigger a force-merge procedure, so
migrations that build successfully will be merged when a specified deadline arrives.

## Flies in the Ointment

Nothing is perfect, so let's talk about problems we have already identified.

### Trust Issues

During the initial testing phase, one of our employees expressed concerns about
these "automatic" migrations. Although his fears were not directly connected to
our case, previous experiences with migrations using simple replacements made
him skeptical. I attempted to globally remove explicit G1GC JVM settings, which
have been the [default since JDK 9](https://openjdk.org/jeps/248), but it proved difficult due to the numerous ways they
could be declared in Allegro's deployment YAMLs. Multiple stacking Pull Requests
cause anxiety - especially when not well explained/documented and when there's
always more lots of other work in the backlog. So, one can learn to mistrust automated
processes.

### Edge Cases

Despite extensive preparation and testing of robust OpenRewrite recipes, we
encountered unforeseen issues post-deployment. Examples include Groovy
annotations being ignored, Kotlin parsing inconsistencies, and YAML formatting
issues. These edge cases required additional attention and adjustments to our
recipes to ensure comprehensive coverage.

### Simple Stuff Being Hard

Removing a property from a YAML file seems easy, right? A powerful tool like
OpenRewrite should handle it effortlessly. Surprisingly, performing this simple change without breaking the files' formatting
required creative solutions and workarounds, which tackled
this challenge.

### Challenges

Such approach provokes an additional effort for library maintainers, as it is required
to get on board with OpenRewrite, analyze migration requirements and test the recipe.
OpenRewrite's learning curve is pretty smooth, but for a couple of times we found
ourselves in the situation when the whole recipe has to be reimplemented
due to the issues detected during testing.

Even though at the beginning for library maintainers, who are new to OpenRewrite,
it meant that their library release should be postponed for some time, we still consider
it being a great time-saver at scale. Library maintainers are fully aware of changes
that have to be done and getting an additional chance to explore usages of their library
and study which uses cases do Allegro developers have when working with this library.
This approach is also aligned with Allegro's responsibility and ownership model.

## Future Plans

While our current implementation already delivers substantial benefits, we are
committed to further improving and open-sourcing this solution. By sharing our
approach with the broader community, we hope to help other organizations facing
similar challenges in managing large-scale code migrations.

## Summary

Allegro's integration of Dependabot and OpenRewrite works pretty awesome!
Our solution simplifies handling breaking changes and skyrockets
Allegro software development scalability.

- OpenRewrite project: it's a solid piece of code that shows great promise
  but still needs more time to mature.
- GitHub Apps are fantastic!
- Watch out for YAML format - [NoYAML.com](https://noyaml.com/)

Stay tuned for more updates as we work towards open-sourcing this powerful tool!

<script src="/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/asciinema-player.min.js"></script>
<script>
    AsciinemaPlayer.create('/assets/img/articles/2024-09-10-automating-code-migrations-at-scale/allegro-rewrite-cli.cast', document.getElementById('cli-recording'), { autoPlay: true });
</script>
