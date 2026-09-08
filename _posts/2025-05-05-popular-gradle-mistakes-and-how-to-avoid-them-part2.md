---
layout: post
title: Popular Gradle mistakes (and&nbsp;how&nbsp;to&nbsp;avoid&nbsp;them) - part 2
author: [ radoslaw.panuszewski, bartosz.galek, taras.goriachko ]
tags: [ gradle, guide, tutorial ]
---

In the [previous post - part 1]({% post_url 2024-11-20-popular-gradle-mistakes-and-how-to-avoid-them %}), we covered common Gradle mistakes and how
to fix them.
After a review and feedback from the community, we decided to extend the list with more tips and best practices.

## Not using lazy configuration

**💡 Why is it a problem?**

Using eager configuration instead of the lazy one increases the time of the configuration phase of your build
because eager configurations will be executed even if they are not needed.

```kotlin
tasks.create("customTask") {
    // Long running configuration of custom task
}

tasks.withType<KotlinCompile> {
    // Long running configuration of test
}
```

If you execute the custom task

```kotlin
./gradlew customTask

// Long running configuration of custom task
// Long running configuration of test
```

it will execute the configuration block for tests, which can impact build performance.

**✅ Best practice**

Use lazy configuration whenever possible. For example:

1. Use register

    ```kotlin
    tasks.register("customTask") { }
    ```

   instead of create

    ```kotlin
    tasks.create("customTask") { }
    ```

2. Use configureEach

    ```kotlin
    tasks.withType<KotlinCompile>().configureEach { }
    ```

   instead of

    ```kotlin
    tasks.withType<KotlinCompile> { }
    ```

## Sharing build logic with `allprojects` and `subprojects`

**💡 Why is it a problem?**

Often you have a part of configuration that needs to be shared between projects within a build. The typical approach is
to wrap it into `subprojects` block in the root project’s `build.gradle.kts`:

```kotlin
subprojects {
    apply(plugin = "kotlin")

    kotlin {
        jvmToolchain(23)
    }
}
```

The problem is, this kind of configuration tends to grow in complexity over time and eventually becomes a real mess.
Even worse if you have different kinds of projects that require different shared configs, for example:

```kotlin
subprojects
    .filter { it.name.endsWith("-library") }
    .forEach {
        apply(plugin = "java-library")
        apply(plugin = "maven-publish")

        publishing.publications.create<MavenPublication>("library") {
            from(components["java"])
        }
    }

```

**✅ Best practice**

Extract the shared build logic to a convention plugin:

`buildSrc/src/main/kotlin/library-convention.gradle.kts`

```kotlin
plugins {
    `java-library`
    `maven-publish`
}

publishing.publications.create<MavenPublication>("library") {
    from(components["java"])
}
```

And apply it in the appropriate subprojects:

`some-library/build.gradle.kts`

```kotlin
plugins {
    `library-convention`
}
```

## Not using `dependencyResolutionManagement` block

The `dependencyResolutionManagement` block in Gradle is used to configure how dependencies are resolved globally,
primarily in multi-module projects. It helps centralize repository management and enforce policies for better dependency control.

**💡 Why is it a problem?**

In multi-module Gradle projects, managing dependencies and repositories at the project level (`build.gradle.kts`) can
lead to inconsistencies. Different subprojects may define different repositories or versions, causing conflicts and
unpredictable behavior.

By using the following approach, you can define repositories in the root `build.gradle.kts`:

```kotlin
allprojects {
    repositories {
        mavenCentral()
    }
}
```

This will work, but it’s not the best practice. It breaks project isolation (see [the section above](#sharing-build-logic-with-allprojects-and-subprojects)).

**✅ Best practice**

The `dependencyResolutionManagement` block in `settings.gradle.kts` provides a centralized solution by defining repositories at the settings level, ensuring
uniform dependency resolution and enforcing rules on where repositories can be defined to avoid conflicts:

```kotlin
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
}
```

This approach ensures consistency, prevents duplicate repository definitions, and improves dependency management across projects.

## Not aligning versions of published artifacts

**💡 Why is it a problem?**

Let's say you're building a library with 2 modules: `mylib-core` and `mylib-util`, where `mylib-core` depends on `mylib-util`.

And a consumer declares the following dependencies:

```kotlin
dependencies {
    implementation("com.example:mylib-core:1.0.0")
    implementation("com.example:mylib-util:2.0.0") // in a real world it would come as a transitive dependency
}
```

Since `mylib-util` has no dependency on `mylib-core`, the resolved versions will be `1.0.0` and `2.0.0`. They differ in a major version number, so there is a
high risk of incompatibility!

**✅ Best practice**

To fix that, you can align the versions with [platform](https://docs.gradle.org/current/userguide/platforms.html):

```kotlin
plugins {
    `java-platform`
}

dependencies {
    constraints {
        api(project(":mylib-core"))
        api(project(":mylib-util"))
    }
}
```

And make sure all the modules have dependency on the platform:

```kotlin
dependencies {
    api(platform(project(":mylib-platform")))
}
```

This way, our first example will resolve both modules to the version `2.0.0`.

Why? Because `mylib-util:2.0.0` will bring `mylib-platform:2.0.0` which will bring version constraint for `mylib-core` to be at least in version `2.0.0`.

## Using only `./gradlew dependencies` to debug dependency resolution

We often need to investigate why a particular version has been pulled into our build.

**💡 Why is it a problem?**

Many people use `./gradlew dependencies` to debug dependency resolution. It generates a massive output that prints the
same dependency multiple times. Searching for “kotlin-stdlib:” in one of my projects resulted in 502 hits.

**✅ Best practice**

Use `./gradlew dependencyInsight` instead.

For example, let’s say you have the following dependency declarations:

```
dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.4.3"))
    implementation("org.apache.commons:commons-lang3:3.15.0")
}
```

Run the following command:

```
./gradlew dependencyInsight --dependency commons-lang3
```

It will print a dependency tree similar to what `./gradlew dependencies` gives you, but additionally it will explain why the
particular version has been selected:

```
org.apache.commons:commons-lang3:3.17.0
  Variant compile:
    | Attribute Name                     | Provided | Requested    |
    |------------------------------------|----------|--------------|
    | org.gradle.status                  | release  |              |
    | org.gradle.category                | library  | library      |
    | org.gradle.libraryelements         | jar      | classes      |
    | org.gradle.usage                   | java-api | java-api     |
    | org.gradle.dependency.bundling     |          | external     |
    | org.gradle.jvm.environment         |          | standard-jvm |
    | org.gradle.jvm.version             |          | 23           |
    | org.jetbrains.kotlin.platform.type |          | jvm          |
   Selection reasons:
      - By constraint
      - By conflict resolution: between versions 3.17.0 and 3.15.0

org.apache.commons:commons-lang3:3.17.0
--- org.springframework.boot:spring-boot-dependencies:3.4.3
     --- compileClasspath

org.apache.commons:commons-lang3:3.15.0 -> 3.17.0
--- compileClasspath
```

The above selection reasons tell you that:

* a version constraint participated in the resolution (it came from the `spring-boot-dependencies` BOM)
* there was a conflict resolution between 3.17.0 (that was declared in the constraint) and 3.15.0 (that we explicitly
  requested). Gradle chose the newer version, according to its default algorithm.

{% include tip.html content="The full list of selection reasons and their explanations can be
found [here](https://docs.gradle.org/current/userguide/viewing_debugging_dependencies.html#understanding_the_selection_reasons)" %}

By default, `dependencyInsight` will look for the dependency in the `compileClasspath` configuration, but you may alter
this behavior by specifying `--configuration` option. You can use abbreviations, like `rC = runtimeClasspath`,
`tCC = testCompileClasspath`, etc.

```
./gradlew --dependency commons-lang3 --configuration rC
```

{% include tip.html content="The default `compileClasspath` configuration is not what will be actually used by your application in runtime!

Most of the time, the `runtimeClasspath` will be more interesting to you." %}

## Not using Build Cache

Gradle has a **Build Cache** that helps speed up builds by reusing task outputs instead of rerunning them each time.
This can make builds much faster, especially in larger projects.

**💡 Why is it a problem?**

By default, Gradle will re-run tasks even if nothing has changed.

**✅ Best practice**

To enable the Build Cache, add this to `gradle.properties`:

```
org.gradle.caching=true
```

This enables the local Build Cache.
Additionally, CI runners like GitHub, in conjunction with `gradle/actions/setup-gradle@v4` action, can cache your tasks
on the runner!

## Not using Configuration Cache

**💡 Why is it a problem?**

If you have Build Cache enabled and nothing has changed in your config, the tasks outputs will be taken from cache and
their actions won’t be executed. But the code from the configuration phase (before the task actions) will be executed every
time.

```kotlin
println("Hello from configuration phase!")

tasks {
    register("sayHello") {
        outputs.file(layout.buildDirectory.file("hello.txt"))
        outputs.cacheIf { true }
        doLast {
            println("Hello from execution phase!")
            outputs.files.singleFile.writeText("Hello")
        }
    }
}
```

```
$ ./gradlew clean sayHello

> Configure project :
Hello from configuration phase!

> Task :sayHello
Hello from execution phase!


$ ./gradlew clean sayHello

> Configure project :
Hello from configuration phase!

> Task :sayHello FROM-CACHE
```

As you can see, “Hello from configuration phase!” is printed every time, even if output of `sayHello` was taken from
cache.

**✅ Best practice**

Enable configuration cache in your `gradle.properties`:

```
org.gradle.configuration-cache=true
```

```
$ ./gradlew clean sayHello

> Configure project :
Hello from configuration phase!

> Task :sayHello
Hello from execution phase!


$ ./gradlew clean sayHello

Reusing configuration cache.

> Task :sayHello FROM-CACHE
```

## Using Groovy DSL instead of Kotlin DSL (KTS) in Gradle

When setting up a Gradle project, you have a choice between **Groovy** (`build.gradle`) and **Kotlin DSL (KTS)** (
`build.gradle.kts`). While Groovy has been the traditional choice, switching to Kotlin offers several advantages:

#### 1. Type Safety and Autocompletion

Kotlin DSL in Gradle brings **type safety and improved autocompletion**, reducing runtime errors common in Groovy
scripts due to mistyped method names or missing properties. As a statically typed language, Kotlin enhances inline
documentation and navigation, making Gradle configurations easier to understand. Additionally, Gradle leverages **code
generation and strongly typed accessors** for project extensions and tasks, allowing direct references instead of
string-based lookups. This eliminates manual casting, reduces errors, and improves maintainability. These accessors
further enhance autocompletion and IDE support, boosting developer productivity and streamlining the build process.

#### 2. Consistency with Modern Kotlin Codebases

If your project is already using Kotlin for app or backend development, using KTS for Gradle scripts keeps your tech
stack consistent. This makes it easier for developers to read and maintain the build configuration without constantly
switching between Groovy and Kotlin.

## Coupling `frontend` build with `backend` build together (or the other way around)

I’ve seen this scenario multiple times: Spring backend with React/Angular/Vue app.

One Gradle module and frontend app mixed with backend code (inside `src/main/webapp`, `src/main/resources/static` or `src/main/js`).

```
├── src
│   ├── main
│   │   ├── java
│   │   │   └── (spring app)
│   │   ├── resources
│   │   │   └── static
│   │   │       └── (react-app)
```

Cons:

- Project structure can be confusing, since it's a spring app with another app inside.
- Custom gradle tasks are needed to run node/npm command to build the frontend app and only include the output in the backend JAR.
- Frontend app will need to be rebuilt every time you change the backend code.

Alternatively, two gradle modules (that's ok) and a task that copies frontend `dist` to backend `src/main/resources/static` (bad)

```
├── backend
│   ├── build.gradle.kts
│   ├── src
│   │   └── main
│   │       ├── java
│   │       │   └── (spring app)
│   │       └── resources
│   │           └── static
│   │               └── (copied, final frontend files)
│   └── ...
├── frontend
│   ├── build.gradle.kts
│   ├── src
│   │   ├── main
│   │   │   ├── js
│   │   │       └── (react-app)
│   └── dist
│       └── (build output copied to backend src/main/resources/static via custom Gradle task)
```

Cons:

- Making those two modules coupled and impossible to build separately.
- Busting cache every time you change the frontend code, not parallelizable (task order matters)
- Custom gradle tasks that build the app and copy files between modules.

**✅ Best practice**

Split the main “application” (rootproject) into two modules (`frontend` and `backend`).
Depend on each other in the root project, so it will use two separate JARs.

When you run a Java application, all JARs on the classpath are treated as a single logical file system. This means that
multiple JARs containing resources (e.g., templates, properties files, static assets) can all be accessed as if they
were in one place. There is no need to copy anything between modules.

```kotlin
plugins {
    application
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(23)
    }
}

application {
    mainClass.set("com.github.bgalek.backend.BackendApplication")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(project("backend"))
    implementation(project("frontend"))
}
```

And then build them separately.

```kotlin
//backend/build.gradle.kts

plugins {
    java
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:3.3.5")

    testImplementation("org.springframework.boot:spring-boot-starter-test:3.3.5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.11.3")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

```kotlin
//frontend/build.gradle.kts
import com.github.gradle.node.npm.task.NpmTask

plugins {
    `java-library`
    id("com.github.node-gradle.node") version "7.1.0"
}

node {
    download = true
    version = "23.1.0"
}

tasks.build {
    dependsOn(tasks.named("npmBuild"))
}

tasks.test {
    dependsOn(tasks.named("npmTest"))
}

// example: do not build the app if no source code was changed
tasks.register<NpmTask>("npmBuild") {
    dependsOn(tasks.npmInstall)
    args.set(listOf("run", "build"))
    inputs.dir(project.fileTree("src").exclude("**/*.test.ts"))
    inputs.dir(project.fileTree("public"))
    inputs.files("*.html", "*.json", "*.ts", "*.js")
    outputs.dir(project.layout.buildDirectory.dir("dist"))
    dependsOn(tasks.named("npmTest"))
}

// example: do not run tests if no code was changed in this module
tasks.register<NpmTask>("npmTest") {
    args.set(listOf("run", "test"))
    inputs.dir(project.fileTree("src"))
    inputs.dir(project.fileTree("public"))
    inputs.files("*.html", "*.json", "*.ts", "*.js")
    outputs.upToDateWhen { true }
}

// what to put in frontend.jar (only dist)
tasks.jar {
    dependsOn(tasks.named("npmBuild"))
    from(project.layout.buildDirectory.dir("dist"))
}
```

This way you will end up with the following jar structure:

```
├── your-app.jar
│   ├── backend.jar
│   ├── frontend.jar
```

**Pros:**

- not running backend compilation/tests if they did not change
- not running frontend bundling/tests if they did not change
- build can be parallelized and cache works out of the box (decoupled modules)
- simple setup, the java way

Check out the full code example:<br />
[https://github.com/bgalek/spring-vite-gradle/tree/main](https://github.com/bgalek/spring-vite-gradle/tree/main)

## Summary

By avoiding these common pitfalls and adopting these practices, you'll create more efficient, maintainable,
and robust Gradle builds. Your future self (and team members) will thank you!

If you have other Gradle tips or your experiences to share, we'd love to hear them in the comments.
Expect ***part3*** with our favorite Gradle plugins and libraries soon!

Happy building!

<script async defer src="https://buttons.github.io/buttons.js"></script>
