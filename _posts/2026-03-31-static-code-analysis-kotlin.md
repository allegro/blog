---
layout: post
title: "Static code analysis in Kotlin — tools overview"
author: mikolaj.wroblewski
tags: [ tech, kotlin, detekt, static analysis, code quality ]
---

Recently in our team we decided that it could be beneficial for us
to have a solution in place that would allow to automatically organise or
at least verify the order of methods and fields in our Kotlin code.

For this goal we conducted an overview of Kotlin static code analysis tools.
We inspected three tools for this very task — [detekt](https://detekt.dev/),
[diktat](https://github.com/saveourtool/diktat) and [ktlint](https://github.com/pinterest/ktlint).
It’s worth mentioning that we already use ktlint for other linting
and self-fixing issues in our codebase and we strongly recommend using it!

But did we succeed? Did we start using new tools? Is it even a good idea? Let’s find out!

## Introduction to static code analysis

### What is static code analysis, really?

Static code analysis is a process of examining source code without executing it to identify
potential bugs, style violations, security issues, and other code quality problems.
These automated tools parse and analyse your code against
predefined rules and patterns, helping teams stick to consistent code standards,
improve maintainability, and catch issues early in the development cycle.
Unlike runtime testing, static analysis can detect issues across large codebases quickly and without needing to run the application.
But how does it really work?

### How does static code analysis work under the hood?

The foundation is converting Kotlin source code into an [Abstract Syntax Tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree).
Both ktlint and diktat use the Kotlin compiler’s PSI (Program Structure Interface) — the same tree representation that IntelliJ IDEA uses internally.
Detekt also uses the Kotlin compiler’s PSI/AST but wraps it in its own abstractions.

The PSI tree represents every element of the code —
classes, functions, parameters, expressions, whitespace, comments — as typed tree nodes. For example:

```text
KtFile
 └─ KtClass "MyService"
     ├─ KtFunction "doWork"
     │   ├─ KtParameter "input"
     │   └─ KtBlockExpression
     │       └─ KtReturnExpression
     └─ KtProperty "logger"
```

Each tool defines rules as visitor classes that walk the AST.
They use the [Visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern)
— a design pattern where you separate an operation (the rule check) from the object
structure it operates on (the AST).
Each rule is a callback that gets invoked when the traversal reaches a node of a certain type.
For example, a “function too long” rule would visit every `KtNamedFunction` node and count the lines in its body.

When a visitor detects a violation, 
it emits a finding/report containing the file path and line/column number extracted from the AST node's offset,
the rule ID and a human-readable message, 
and optionally an auto-correct fix by mutating the AST node in-place.

For auto-fixable rules, the tool modifies the AST nodes directly — inserting whitespace nodes,
reordering child nodes, replacing text —
then serializes the modified tree back to source code.
This is how ktlint formatting works: it literally rewrites the PSI tree and dumps it back to the file.

Let’s jump into what the inspected tools can offer us.

## Overview of available tools

It must be said that **none** of the tools present here support checking method ordering out of the box.
As stated in [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html#class-layout) under class layout:

> Do not sort the method declarations alphabetically or by visibility,
> and do not separate regular methods from extension methods.
> Instead, put related stuff together, so that someone reading the class from top to bottom can follow the logic of what’s happening.
> Choose an order (either higher-level stuff first, or vice versa) and stick to it.

So the tools just stick to the coding conventions. 
**We chose to break this rule intentionally 
as we think that in a large codebase with many contributors, “put related stuff together”
is subjective and leads to different interpretations. A mechanical visibility-order rule is
unambiguous and enforceable by tooling.**

At the same time, we decided that allowing the tool to automatically
reorder methods would be counterproductive — but having analysis could be useful in some cases.

We decided to evaluate the tools based on the following metrics:
- shareability of configuration — it needs to be easily defined and shared in a repository
- the tool needs to at least verify the ordering of methods based on their visibility
- shouldn’t affect project building time at all (just a safety measure as all of these tools are really fast)
- should give us more capabilities than ktlint — we didn’t want to introduce new tooling if ktlint could do the job
- ease of rules configuration

Let’s then jump into what these tools can offer, their pros and cons and when to use them and where applicable — how to extend them for our use cases.

### Detekt

Detekt is the most popular Kotlin-specific static analysis tool,
focused on detecting code smells: patterns in code that hint at deeper problems. Think overly long methods,
deeply nested logic, or classes that try to do too much
and complexity rather than just formatting.
It offers 200+ built-in rules, optional type resolution via the Kotlin compiler, and a YAML-based configuration.
It integrates via Gradle, Maven, CLI, and IntelliJ, and supports custom rule sets for project-specific needs.

It sure is versatile and it integrates easily with the most popular programming tools. The built-in rules are organised into the following categories:

- **Complexity** — flags overly complex code: large classes, long functions, high cyclomatic complexity, deeply nested blocks
- **Style** — naming convention violations, redundant or missing visibility modifiers, unnecessary semicolons
- **Potential bugs** — unused private members, unsafe casts, potential null-pointer dereferences
- **Performance** — redundant collection creation, inefficient string concatenation, unnecessary temporary objects
- **Exceptions** — swallowed exceptions, throwing generic `Exception` types
- **Empty blocks** — empty blocks after `catch`,`finally`,`else`, empty function or class bodies
- **Comments** — commented-out code, redundant or misleading comments
- **Coroutines** — coroutine-specific anti-patterns such as unstructured concurrency or potential context leaks
- **Documentation** — missing KDoc on public members, undocumented parameters or return types

That is a wide net. However, as we discuss in the summary, breadth does not always translate to value for every team.

**Compliance with evaluation metrics**

- **Shareability of configuration** ✅ — Uses a `detekt.yml` file that is trivially committed to the repository
  and shared across the team.
- **Method ordering verification** ⚠️ — Not available out of the box, but the custom rule set API makes it
  straightforward to implement, as demonstrated in the [Custom rulesets](#custom-rulesets) section below.
- **Build time impact** ✅ — Runs fast; type resolution is optional and can be omitted entirely for most checks.
- **More capabilities than ktlint** ✅ — 200+ built-in rules spanning complexity, code smells, potential bugs,
  and more — well beyond ktlint's formatting focus.
- **Ease of rules configuration** ✅ — YAML-based configuration is readable, well-documented, and supports
  selectively enabling or disabling individual rules.

### Diktat

Diktat is a tool strictly based on the official Kotlin coding conventions,
from which every single rule was directly implemented.
Its rules are organised across several areas:

- **Naming conventions** — enforces how identifiers, packages,
    classes, enums, functions, and constants should be named, including opinionated rules like discouraging negatives in boolean variable names
- **Comments & documentation** — strict KDoc requirements on all public members,
    consistent documentation formatting, discourages TODO/FIXME comments in production code
- **Formatting** — file organisation, import ordering, class member ordering 
    (without needed granularity for method ordering based on visibility),
    blank lines, indentation, bracing styles, and line length limits
- **Variables & types** — prefers `val` over `var`, discourages floating-point
    for precise calculations, encourages type aliases and idiomatic Kotlin patterns
- **Code structure** — single-responsibility functions,
    maximum function length, block complexity limits, `when` expression usage, annotation placement
- **Error handling** — best practices around exception propagation and usage

It also supports auto-fixing for style violations and integrates via Gradle,
Maven, and CLI. On paper, it looks thorough.
However, we quickly decided to reject it for a couple of reasons:
- **Overly strict defaults** — ships with very aggressive rules out of the box (e.g., enforcing specific comment formats, mandatory KDoc on everything),
    requiring heavy configuration to make it practical for most teams
- **Noisy output** — many rules flag stylistic preferences that are
    debatable (e.g., forced ordering of class members in a very specific way), leading to a low signal-to-noise ratio without significant rule suppression
- **Configuration problems** — for example if you would like only one rule from a particular chapter of
    Kotlin coding conventions you’d need
    to write all of the sub-rules into the configuration file (and there are many)
    and disable all except the one that you want, effectively creating huge configuration files

**Compliance with evaluation metrics**

- **Shareability of configuration** ✅ — Configuration file can be committed to the repository like any
  other tool.
- **Method ordering verification** ❌ — Has class member ordering rules, but without the granularity needed
  for visibility-based method ordering specifically.
- **Build time impact** ✅ — Performance is comparable to the other tools; no significant overhead.
- **More capabilities than ktlint** ✅ — Covers a broader set of coding conventions across naming, comments,
  formatting, and code structure.
- **Ease of rules configuration** ❌ — To use a single rule from a chapter, you must enumerate all sub-rules
  and disable every one except the desired one, resulting in enormous configuration files.

### Ktlint

Ktlint is a lightweight Kotlin linter and formatter that enforces the official Kotlin coding conventions and the Android Kotlin style guide.
It focuses on code style and formatting — indentation, spacing, imports, trailing commas, etc. — rather than deeper code quality analysis.
Its key strength is auto-fix: most rules can automatically rewrite your code to comply, making it ideal as a pre-commit hook or CI gate.
It requires minimal configuration (anti-bikeshedding philosophy),
integrates via Gradle plugin, Maven, CLI, and has an IntelliJ plugin.
It’s fast because it only performs AST-level checks without type resolution.

**Compliance with evaluation metrics**

- **Shareability of configuration** ✅ — Minimal configuration that can be committed to the
  repository with almost nothing to maintain.
- **Method ordering verification** ❌ — Ktlint is a formatter, not a structural analyser; ordering methods
  by visibility is not supported.
- **Build time impact** ✅ — The fastest of the three: AST-only checks with no type resolution.
- **Ease of rules configuration** ✅ — The anti-bikeshedding philosophy means almost no configuration is
  required, though this also limits customization.

Now we have the overview needed for us to do some coding on custom rulesets. Let’s gooooo!!!

## Custom rulesets

For the purpose of our task we chose detekt for custom rulesets creation.

### Setting up the project

A custom detekt rule set is packaged as a standalone Gradle project — a regular JVM library that detekt discovers at runtime via Java’s
[Service Provider Interface (SPI)](https://en.wikipedia.org/wiki/Service_provider_interface).
You first need to check detekt [version compatibility matrix](https://detekt.dev/docs/introduction/compatibility)
to choose proper version for your project. The minimal `build.gradle` looks like this:

```groovy
buildscript {
    ext {
        kotlin_version = '2.2.10'
    }
}

plugins {
    id("java")
    id 'org.jetbrains.kotlin.jvm' version "${kotlin_version}"
}

group = "pl.allegro.detekt.rules"
version = "1.0"

repositories {
    mavenCentral()
}

wrapper {
    gradleVersion = '8.13'
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    compileOnly("io.gitlab.arturbosch.detekt:detekt-api:1.23.8")

    testImplementation("io.gitlab.arturbosch.detekt:detekt-test:1.23.8")
    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType(Test).configureEach {
    useJUnitPlatform()
}
```

Notice that `detekt-api` is `compileOnly` — detekt itself provides it at runtime.
The `detekt-test` dependency gives us a lean test harness for rules without spinning up the full analysis engine.

### Writing the rule

Every custom rule extends detekt’s `Rule` class and overrides visitor methods that correspond to PSI node types.
Our goal is to enforce that methods in a class body appear in visibility order: `public > protected > internal > private`.

The algorithm is simple: walk all `KtNamedFunction` nodes in a `KtClassBody`, track the highest visibility index seen so far,
and report any method whose visibility index is *lower* than that threshold — meaning a more visible method appeared after a less visible one.

```kotlin
package pl.allegro.detekt.rules

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.lexer.KtTokens
import org.jetbrains.kotlin.psi.KtClassBody
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.psiUtil.visibilityModifierType

class MethodVisibilityOrder(config: Config): Rule(config) {
    override val issue = Issue(
        id = "methodVisibilityOrder",
        severity = Severity.Style,
        "Methods should be ordered by visibility: public > protected > internal > private.",
        Debt.FIVE_MINS
    )

    override fun visitClassBody(classBody: KtClassBody) {
        super.visitClassBody(classBody)

        val declaredMethods = classBody.children.filterIsInstance<KtNamedFunction>()
        if (declaredMethods.isEmpty()) return

        val visibilityOrder = listOf(
            KtTokens.PUBLIC_KEYWORD,
            KtTokens.PROTECTED_KEYWORD,
            KtTokens.INTERNAL_KEYWORD,
            KtTokens.PRIVATE_KEYWORD
        )

        var maxVisibilityIndex = 0
        declaredMethods.forEach { method ->
            val visibility = method.visibilityModifierType()
            val currentIndex = visibilityOrder.indexOf(visibility)

            // If the current method's visibility rank is lower than the
            // highest rank seen so far, it is out of order.
            if (currentIndex < maxVisibilityIndex) {
                report(
                    CodeSmell(
                        issue,
                        Entity.atName(method),
                        "Method '${method.name}' is out of order. " +
                                "Visibility '$visibility' should appear before '${visibilityOrder[maxVisibilityIndex]}'."
                    )
                )
            }
            // Always update the threshold to track the highest visibility index seen
            maxVisibilityIndex = maxOf(maxVisibilityIndex, currentIndex)
        }
    }
}
```

A few things worth highlighting here:
- `visitClassBody` is called for every class body in the file — nested classes are handled automatically by detekt’s traversal.
- `visibilityModifierType()` is a PSI utility that returns `null` when no modifier is present,
    which we map to `"public"` — matching Kotlin’s default visibility semantics.
- `Entity.atName(method)` pins the finding to the method name token, giving IDEs and CI reports a precise location.

### Registering the rule set

A rule is grouped into a `RuleSet` through a `RuleSetProvider`. This is the entry point detekt calls when loading your plugin:

```kotlin
package pl.allegro.detekt.rules

import io.gitlab.arturbosch.detekt.api.Config
import io.gitlab.arturbosch.detekt.api.RuleSet
import io.gitlab.arturbosch.detekt.api.RuleSetProvider

class MethodVisibilityRuleSetProvider: RuleSetProvider {
    override val ruleSetId: String = "custom-rules"

    override fun instance(config: Config): RuleSet {
        return RuleSet(ruleSetId, listOf(MethodVisibilityOrder(config)))
    }
}
```

To make detekt discover this provider at runtime you need to register it via Java SPI.
Create the file: `src/main/resources/META-INF/services/io.gitlab.arturbosch.detekt.api.RuleSetProvider`

with a single line containing the fully-qualified class name: `pl.allegro.detekt.rules.MethodVisibilityRuleSetProvider`

That’s all the wiring needed — no XML, no annotation processors.

### Testing the rule

The `detekt-test` library makes rule testing a breeze. You pass a Kotlin snippet as a string directly to the rule and assert on the returned findings:

```kotlin
class MethodVisibilityOrderTest {
    private val rule = MethodVisibilityOrder(Config.empty)

    @Test
    fun `does not report when ordered public protected internal private`() {
        val code = """
            class Ordered {
                public fun a() {}
                protected fun b() {}
                internal fun c() {}
                private fun d() {}
            }
        """.trimIndent()

        assertEquals(0, rule.compileAndLint(code).size)
    }

    @Test
    fun `reports when default public appears after protected`() {
        val code = """
            class MisorderedDefaultPublic {
                protected fun b() {}
                fun a() {}
            }
        """.trimIndent()

        val findings = rule.compileAndLint(code)

        assertEquals(1, findings.size)
        assertEquals("methodVisibilityOrder", findings.first().issue.id)
        assertTrue(findings.first().message.contains("out of order"))
    }

    @Test
    fun `reports all violations when multiple appears in class`() {
        val code = """
            class MultipleViolations {
                protected fun b() {}
                protected fun c() {}
                fun a() {}
                private fun d() {}
                protected fun e() {}
            }
        """.trimIndent()

        assertEquals(2, rule.compileAndLint(code).size)
    }
}
```

### Integrating the plugin

Once the JAR is published (or built locally), add it as a detekt plugin in the consuming project’s `build.gradle.kts`:

```kotlin
dependencies {
    detektPlugins("pl.allegro.detekt.rules:detekt-allegro-rules:1.0")
}
```

From that point on, the `methodVisibilityOrder` rule is available just like any built-in detekt rule and can be toggled in `detekt.yml`:

```yaml
custom-rules:
  MethodVisibilityOrder:
    active: true
```

## Summary

So, did we succeed? In a sense — yes we did. We quickly evaluated the tooling and had a lot of fun discovering how static analysis works under the hood.

What we did end up with is a lightweight **detekt plugin** that *reports* ordering violations.
The custom rule itself was straightforward to write, really easy and pleasant to test.

However, after reflecting on detekt’s built-in rule set, we decided **not to roll it out across our services**.
The rule categories it covers are either already handled by ktlint,
enforced through code review, or simply not problematic enough in our codebase to 
justify the overhead of introducing and maintaining another tool and additional metrics.
Adding a new linter has a real cost: configuration files to maintain, new CI failures to triage, and rules to gradually agree on as a team.
For us, that cost did not outweigh the benefit.
Additionally, detekt doesn’t support Java 25, which we planned to migrate to soon.

Our final recommendation is therefore: **stick with ktlint**.
It handles formatting reliably, auto-fixes the vast majority of issues, and requires almost no configuration.
If your team does have a concrete, recurring code quality problem that goes beyond formatting
— high complexity, dangerous patterns, or a team-specific convention
like the one we explored — detekt is an excellent choice for that targeted use case, and its custom rule API makes it easy to implement exactly what you need.

Happy linting! 🔍