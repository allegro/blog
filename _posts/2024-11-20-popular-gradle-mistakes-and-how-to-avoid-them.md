---
layout: post
title: Popular Gradle mistakes (and how to avoid them)
author: [ radoslaw.panuszewski, bartosz.galek ]
tags: [ gradle, guide, tutorial  ]
---

As part of [Allegro Hacktoberfest celebrations](https://hacktoberfest.allegro.tech/), `Andamio Task Force` (the team responsible for Andamio, a set of common libraries used by most JVM projects at Allegro) posted the
following message on our social platform…

<div style="background-color: #e1e3e6; padding: 0 24px; align-content: center">
  <img src="/assets/img/articles/2024-11-20-popular-gradle-mistakes-and-how-to-avoid-them/announcement.png" alt="Hacktoberfest - Modernize Gradle event">
</div>

When delivering on our promise, we encountered some unconventional configurations while refactoring Gradle setups for
various teams. We decided to share our findings for everyone’s benefit (sometimes also entertainment :wink:).
The goal was not to shame anyone but rather to show how you can improve your configurations,
which were often created long ago and could be simplified and cleaned up by now.

While Gradle’s flexibility can be powerful, it’s also a double-edged sword that can lead to many hidden issues, among
which slow builds are the least frustrating. Here’s a compilation of some of the most interesting issues we found,
along with tips on how to do things better!

## Dictionary

| Term           | Description                                                                                                              | Rule of thumb                             |
|----------------|--------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| Gradle build   | a bucket for Gradle projects                                                                                             | 1 `settings.gradle.kts` == 1 Gradle build |
| Gradle project | that’s what we often refer to as a "Gradle module"; your root project (as well as every subproject) is a Gradle project :) | 1 `build.gradle.kts` == 1 Gradle project  |

## Redundant plugin application

**⛔️ Anti-Pattern**

Applying plugins that are already indirectly applied. Examples include applying `java` after applying `kotlin` or adding
the `allopen` plugin when `kotlin-spring` already handles it.

```kotlin
plugins {
    kotlin("jvm")
    java // redundant!
}
```

```kotlin
plugins {
    kotlin("plugin.spring")
    kotlin("plugin.allopen") // redundant!
}
```

**💡 Why is it a problem?**

It adds unnecessary complexity - it’s dead code and duplicated declarations.

**✅ Best practice**

If you use `kotlin("jvm")` Gradle plugin, you:

* Don’t need to add additional kotlin dependencies to your project (99% of the time)
* Don’t need add `allopen` plugin if you already have `kotlin-spring-plugin` applied
* You don’t need to explicitly apply `java` plugin after you already applied `kotlin`.

## Declaring the JDK version multiple times

**⛔️ Anti-Pattern**

```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

kotlin {
    jvmToolchain(21)
}

tasks {
    compileKotlin {
        kotlinOptions.jvmTarget = JavaVersion.VERSION_21
    }
    compileTestKotlin {
        kotlinOptions.jvmTarget = JavaVersion.VERSION_21
    }
    compileIntegrationKotlin {
        kotlinOptions.jvmTarget = JavaVersion.VERSION_21
    }
}
```

**💡 Why is it a problem?**

It adds unnecessary complexity - it’s dead code and duplicated configuration. Also, Kotlin and Java toolchains can
override each other (the latter wins).

**✅ Best practice**

Java and Kotlin toolchains settings set the same thing under the hood (Toolchain for JVM project),
so it’s enough to declare only one of those (even if you use both Java and Kotlin).

```kotlin
kotlin {
    jvmToolchain(21)
}
```

> Remember to declare the toolchain for every subproject, not only for the root project! Otherwise, it will take the JDK
> version used to run Gradle.

## Configuring your Gradle projects not for the intended purpose

**⛔️ Anti-Pattern**

The `application` module is applied to multiple projects when, in fact, you want a single deployable artifact.

```kotlin
allprojects {
    apply(plugin = "application")
}
```

The same goes for the `maven-publish` and `java-library` plugins.

**💡 Why is it a problem?**

* `application` - this plugin facilitates creating an executable JVM application. It registers the `distZip` task that
  can build a zip archive containing all JARs with the dependencies. Usually, you will have only one such module, so
  there is no point in applying it to every project. It only makes it harder to understand what’s the intention of the
  given project.
* `java-library` - this plugin only registers the `api()` configuration. Do not use it in the same project that applies
  `application` since no other project will add it as a dependency.

**✅ Best practice**

Configure your Gradle modules so they reflect the intention.

| Intention                    | Plugin(s)                        |
|------------------------------|----------------------------------|
| deployable app               | `application` + `maven-publish`  |
| locally runnable app         | `application`                    |
| library to be used by others | `java-library` + `maven-publish` |
| library to be used locally   | `java-library`                   |

## Dummy root project

**⛔️ Anti-Pattern**

```
my-service-root/
├── build.gradle.kts
└── my-service/
    ├── build.gradle.kts
    └── src/
        └── ...
```

**💡 Why is it a problem?**

A root module with a “dummy” root project used just to declare the application plugin, or to rename your
artifact (-root).

It causes the configuration to be spread between the dummy root project and the “normal” project.

**✅ Best practice**

Your root project should be your `application` project:

```
my-service/
├── build.gradle.kts
└── src/
    └── ...
```

## Explicit defaults everywhere

**⛔️ Anti-Pattern**

Explicitly setting configurations that are already the default, such as enabling Java incremental compilation or setting
the encoding to UTF-8 (it’s default since JDK 18).

```kotlin
tasks.withType<GroovyCompile> {
    options.incremental = true
}
tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}
```

**💡 Why is it a problem?**

Explicitly setting default values is noisy and confusing to readers, who may assume there’s a reason for it when there’s
none.

**✅ Best practice**

Keep the build configuration clean by only setting properties when you’re intentionally deviating from defaults.

## Chaos with versions

**⛔️ Anti-Pattern**

Defining dependency versions in various places — project.ext, custom Gradle tasks or gradle.properties

gradle.properties

```kotlin
ktor_version=1.6.4
kotlin_version=1.5.0
```

build.gradle

```groovy
project.ext.versions = [
    kafka             : '2.8.2',
    guava             : '33.1.0-jre',
    jackson           : '2.17.0',
]
```

build.gradle

```groovy
def springBootDependencies = '3.3.5'
dependencies {
    implementation platform("org.springframework.boot:spring-boot-dependencies:$springBootDependencies")
}
```

**💡 Why is it a problem?**

When versioning is scattered, it’s easy for dependencies to drift out of sync, leading to version conflicts and making
maintenance a nightmare.

**✅ Best practice**

gradle/libs.versions.toml

```kotlin
[versions]
kotlin = "2.0.10"
spring-boot-dependencies = "3.3.5"

[libraries]
andamio-bom = { group = "org.springframework.boot", name = "spring-boot-dependencies", version.ref = "spring-boot-dependencies" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
```

build.gradle.kts

```kotlin
plugins {
    alias(libs.plugins.kotlin.jvm)
}

dependencies {
    implementation(platform(libs.andamio.bom))
}
```

Use
a [Version Catalog (libs.versions.toml)](https://docs.gradle.org/current/userguide/dependency_management_basics.html#version_catalog)
to centralize dependency versions and keep them consistent across modules. This makes version updates more
straightforward and improves readability. Crucially, this way of defining dependencies ensures that Dependabot will be
able to correctly understand and upgrade your configuration.

Use bundles to group dependencies.

> Do not create multiple TOML files - dependabot will be unable to detect them.

## Mysterious compiler flags

**⛔️ Anti-Pattern**

Adding compiler flags whose purpose no one quite remembers.

**💡 Why is it a problem?**

Unnecessary flags can slow down the build process, cause compatibility issues, and make the build configuration harder
to understand.

**✅ Best practice**

Periodically audit compiler flags and keep documentation for why each flag exists. If a flag’s purpose is unclear, it’s
worth testing if it can be removed.

## Using `spring-boot-configuration-processor`

**⛔️ Anti-Pattern**

Manually configuring spring-boot-configuration-processor even though IDEs like IntelliJ Ultimate handle it
automatically ([since version 2023.2](https://www.jetbrains.com/idea/whatsnew/2023-2/#page__content-frameworks-and-technologies)).

**💡 Why is it a problem?**

You need [kapt](https://kotlinlang.org/docs/kapt.html) compiler plugin for `spring-boot-configuration-processor`, but kapt is slow
and [deprecated](https://kotlinlang.org/docs/kapt.html):

![Kapt Warning](/assets/img/articles/2024-11-20-popular-gradle-mistakes-and-how-to-avoid-them/kapt-warning.png)

**✅ Best practice**

Omit the `spring-boot-configuration-processor`. Chances are you will be able to get rid of kapt too, and make your
build faster.

## Overlapping Formatters

**⛔️ Anti-Pattern**

Running multiple formatters (e.g., `ktlint` and `detekt-formatting`) at once, often with overlapping rules.

**💡 Why is it a problem?**

This setup can create redundant work, slow down builds, and lead to conflicting formatting results.

**✅ Best practice**

Use either `ktlint` or `detekt-formatting` (which is a wrapper for `ktlint`).

## Global dependencies with allprojects or subprojects

**⛔️ Anti-Pattern**

Applying dependencies globally using allprojects or subprojects, resulting in unnecessary dependencies across all
modules.

**💡 Why is it a problem?**

This can increase build times, memory usage, and complicates dependency management.

**✅ Best practice**

Only apply dependencies in specific modules where they are needed. Avoid overusing `allprojects` and `subprojects` unless
absolutely necessary.

## Configuring tasks by name instead of type

**⛔️ Anti-Pattern**

Using specific task names like `test` and `integrationTest` rather than type-based configuration (
`tasks.withType<Test>`).

```kotlin
tasks {
    test {
        useJUnitPlatform()
        testLogging {
            exceptionFormat = TestExceptionFormat.FULL
        }
    }

    integrationTest {
        useJUnitPlatform()
        testLogging {
            exceptionFormat = TestExceptionFormat.FULL
        }
    }
}
```

**💡 Why is it a problem?**

Hardcoding task names can make configurations brittle and difficult to maintain across changes.

**✅ Best practice**

Use `tasks.withType<Test>` to make configuration consistent and adaptable across different task names and setups.

```kotlin
tasks {
    withType<Test> {
        useJUnitPlatform()
        testLogging {
            exceptionFormat = TestExceptionFormat.FULL
        }
    }
}
```

## Exclusions used to downgrade version

**⛔️ Anti-Pattern**

```kotlin
dependencies {
    implementation("com.example.first-dependency:2.0.0") {
        exclude(group = "com.example", module = "transitive-dependency")
    }
    implementation("com.example.second-dependency:2.0.0") {
        exclude(group = "com.example", module = "transitive-dependency")
    }
    implementation("com.example:transitive-dependency:1.0.0")
}
```

**💡 Why is it a problem?**

There can be lots of dependencies bringing your transitive dependency to the classpath and you would need to exclude it
in each and every one of those places. But still, new dependencies can be added and you can forget about the additional
exclusions.

**✅ Best practice**

Use [rich versions](https://docs.gradle.org/current/userguide/dependency_versions.html#sec:rich-version-constraints):

```kotlin
dependencies {
    implementation("com.example.first-dependency:2.0.0")
    implementation("com.example.seoncd-dependency:2.0.0")
    implementation("com.example:transitive-dependency") { version { strictly("1.0.0") } }
}
```

## Using buildSrc for hosting convention plugins

**⛔️ Anti-Pattern**

```
.
└── buildSrc/
    └── src/
        └── main/
            └── kotlin/
                └── my-convention-plugin.gradle.kts
```

**💡 Why is it a problem?**

Changing anything within the `buildSrc` directory will force re-evaluating every `buildscript` in your build. It is a known
pattern in Gradle community to replace `buildSrc` (which has special treatment) with a regular included build named
`build-logic`.

Also, if you want to test your convention plugins, you will experience strange IDE behavior when placing your tests
under `buildSrc/src/test` source set. For `build-logic` everything works fine.

**✅ Best practice**

```kotlin
// settings.gradle.kts
includeBuild("build-logic")
```

```
.
└── build-logic/
    └── src/
        └── main/
            └── kotlin/
                └── my-convention-plugin.gradle.kts
```

## Bumping Gradle in wrapper task configuration

**⛔️ Anti-Pattern**

Configuring the version of Gradle wrapper in `build.gradle.kts`:

```kotlin
tasks {
    withType<Wrapper> {
        gradleVersion = "8.11"
    }
}
```

**💡 Why is it a problem?**

Gradle wrapper version is already stored in `gradle/wrapper.properties`. Having two places with the same information is
redundant.

**✅ Best practice**

Just remove the wrapper configuration from `build.gradle.kts` completely, and run the command below whenever you need to
upgrade the wrapper:

```
./gradlew wrapper --gradle-version 8.11
```

## Optional tips for you to consider

* [configuration avoidance](https://docs.gradle.org/current/userguide/task_configuration_avoidance.html)
* [configuration cache](https://docs.gradle.org/current/userguide/configuration_cache.html)
* parallel **task** execution (`org.gradle.parallel=true`)
* parallel **test** execution (`maxParallelForks`) in `Test` task configuration

## Summary

Refactoring a Gradle build can feel like detective work, uncovering mysteries of the past. You can create a more
maintainable, efficient, and understandable build system by spotting these anti-patterns and standardizing your
configurations. Encourage your team to embrace these best practices — your future self (and your build times) will thank
you!
