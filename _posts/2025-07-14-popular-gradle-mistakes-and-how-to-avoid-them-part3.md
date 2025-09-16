---
layout: post
title: Popular Gradle mistakes (and&nbsp;how&nbsp;to&nbsp;avoid&nbsp;them) - part 3
author: [ radoslaw.panuszewski, bartosz.galek, taras.goriachko ]
tags: [ gradle, guide, tutorial ]
---

In the [previous post - part 2]({% post_url 2025-05-05-popular-gradle-mistakes-and-how-to-avoid-them-part2 %}), we covered more common Gradle mistakes and how
to fix them. In the last part of this triplet, we will share our favorite Gradle plugins that can help you avoid some of the mistakes we discussed in the
previous posts!

### Integration Test Plugin

[https://github.com/coditory/gradle-integration-test-plugin](https://github.com/coditory/gradle-integration-test-plugin)

<a class="github-button" href="https://github.com/coditory/gradle-integration-test-plugin" data-show-count="true" data-color-scheme="
no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" aria-label="Star
coditory/gradle-integration-test-plugin on GitHub">Star</a>

Separating unit tests from integration tests can lead to more explicit build logic and faster feedback cycles. The
Gradle Integration Test Plugin simplifies this separation by creating a dedicated source set and task for integration
tests.

#### Example Usage:

```kotlin
plugins {
    id("com.coditory.integration-test") version "2.2.5"
}
```

This configuration adds an `integration` suite to the project, nicely separated from the default `test` suite:
![integration-test-suite](/assets/img/articles/2025-07-14-popular-gradle-mistakes-and-how-to-avoid-them-part3/integration-test-suite.png)

You can run your integration tests with:

```bash
./gradlew integrationTest
```

### Test Logger plugin

[https://github.com/radarsh/gradle-test-logger-plugin](https://github.com/radarsh/gradle-test-logger-plugin)

<a class="github-button" href="https://github.com/radarsh/gradle-test-logger-plugin" data-show-count="true" data-color-scheme="
no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" aria-label="Star
radarsh/gradle-test-logger-plugin on GitHub">Star</a>

Readable test outputs are essential for quickly identifying issues. The Gradle Test Logger Plugin enhances test reports
by providing a more detailed and visually appealing output.

#### Example Usage:

```kotlin
plugins {
    id("com.adarshr.test-logger") version "4.0.0"
}
```

When you run your tests, the output will be more informative and easier to read.

![Example of expanded test logger plugin output](/assets/img/articles/2025-07-14-popular-gradle-mistakes-and-how-to-avoid-them-part3/logger.gif)

### Axion Release Plugin

[https://github.com/allegro/axion-release-plugin](https://github.com/allegro/axion-release-plugin)

<a class="github-button" href="https://github.com/allegro/axion-release-plugin" data-show-count="true"
data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large"
aria-label="Star allegro/axion-release-plugin on GitHub">Star</a>

Automating versioning and release processes reduces manual errors and streamlines deployments. The Axion Release Plugin
uses Git tags to manage versions, ensuring consistency between your codebase and versioning.

```kotlin
plugins {
    id("pl.allegro.tech.build.axion-release") version "1.18.18"
}
```

```bash
./gradlew release
```

This command increments the version, creates a Git tag, and pushes it to the repository.

The plugin integrates really well with GitHub Actions:
- it can automatically [unshallow](https://axion-release-plugin.readthedocs.io/en/latest/configuration/ci_servers/#shallow-clones) your repo (by default [actions/checkout](https://github.com/actions/checkout) makes a shallow clone)
- it [produces](https://axion-release-plugin.readthedocs.io/en/latest/configuration/ci_servers/#github-outputs) GitHub outputs `published-version` and `released-version` that can be referenced in the subsequent steps (e.g., to deploy the app)

### Dependency Graph Generator

[https://github.com/vanniktech/gradle-dependency-graph-generator-plugin](https://github.com/vanniktech/gradle-dependency-graph-generator-plugin)

<a class="github-button" href="https://github.com/vanniktech/gradle-dependency-graph-generator-plugin" data-show-count="true"
data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large"
aria-label="Star vanniktech/gradle-dependency-graph-generator-plugin on GitHub">Star</a>

Sometimes you have a complex multi-module gradle project. This plugin helps you to understand the dependencies between
sub-projects.

#### Example Usage:

```kotlin
plugins {
    id("com.vanniktech.dependency.graph.generator") version "0.8.0"
}
```

Apply this plugin in the root project. It will add the task `generateProjectDependencyGraph`:

Running this task:

```bash
./gradlew :generateProjectDependencyGraph
```

will generate a graph that shows the subproject dependencies.

For example:

![project-dependency-graph.png](/assets/img/articles/2025-07-14-popular-gradle-mistakes-and-how-to-avoid-them-part3/project-dependency-graph.png)

### Typesafe Conventions

[https://github.com/radoslaw-panuszewski/typesafe-conventions-gradle-plugin](https://github.com/radoslaw-panuszewski/typesafe-conventions-gradle-plugin)

<a class="github-button" href="https://github.com/radoslaw-panuszewski/typesafe-conventions-gradle-plugin" data-show-count="true"
data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large"
aria-label="Star radoslaw-panuszewski/typesafe-conventions-gradle-plugin on GitHub">Star</a>

Version catalogs are awesome! Sadly, they don't play well with convention plugins.

Let's say you have the following `libs.versions.toml` file:

```toml
[libraries]
commons-lang3 = "org.apache.commons:commons-lang3:3.17.0"
```

While you can use the typesafe accessor `libs.commons.lang3` in your regular `build.gradle.kts` files, it's not possible in a convention plugin. All you have is access to the non-typesafe API:

```kotlin
// buildSrc/src/main/kotlin/some-convention.gradle.kts
dependencies {
    implementation(versionCatalogs.find("libs").get().findLibrary("commons-lang3").get())
}
```

To overcome this limitation, you can apply the `typesafe-conventions` plugin:

```kotlin
// buildSrc/settings.gradle.kts
plugins {
    id("dev.panuszewski.typesafe-conventions") version "0.7.3"
}
```

It will allow you to use the typesafe accessor from your convention plugin:

```kotlin
// buildSrc/src/main/kotlin/some-convention.gradle.kts
dependencies {
    implementation(libs.commons.lang3)
}
```

### Binary Compatibility Validator

[https://github.com/Kotlin/binary-compatibility-validator](https://github.com/Kotlin/binary-compatibility-validator)

<a class="github-button" href="https://github.com/Kotlin/binary-compatibility-validator" data-show-count="true" data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" aria-label="Star Kotlin/binary-compatibility-validator on GitHub">Star</a>

⚠️ The functionality of this plugin will be moved to Kotlin Gradle Plugin starting from the [2.2.0 release](https://kotlinlang.org/docs/whatsnew22.html#binary-compatibility-validation-included-in-kotlin-gradle-plugin).

Ensuring API stability is crucial, especially when external clients consume your library. The Binary Compatibility
Validator plugin helps maintain this stability by checking for binary compatibility between versions.

#### Example Usage:

```kotlin
plugins {
    id("org.jetbrains.kotlinx.binary-compatibility-validator") version "0.17.0"
}
```

Generate the API dump with:

```bash
./gradlew apiDump
```

This creates an API dump in the `api` directory, which you should commit to version control.
Subsequent runs will compare the current API against this dump to detect incompatible changes.

In one of our repositories, we have a GitHub workflow that runs when the API dump file is changed. This workflow uses an LLM to check for breaking changes,
such as new method arguments without default values or removed public methods. If breaking changes are detected, the workflow adds a `breaking-change` label to
the PR. Our GitHub release configuration (via YAML) then automatically includes a section for breaking changes in the release notes. If the PR is updated and no
breaking changes are detected, the label is removed.

![GitHub workflow detecting breaking changes](/assets/img/articles/2025-07-14-popular-gradle-mistakes-and-how-to-avoid-them-part3/breaking-change-detected.png)

## Summary

This is the end of a three-part series. We hope you found it helpful and that you learned something new about Gradle (just like we did writing this post).
If you have any questions or suggestions, feel free to reach out to us on GitHub or Twitter.

<script async defer src="https://buttons.github.io/buttons.js"></script>
