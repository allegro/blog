---
layout: post
title: "How AI Agents Halved the Effort of Migrating 500 Gradle Modules from Koin to Hilt"
author: wojciech.topolski
tags: [tech, android, kotlin, ai, dependency-injection, hilt, koin, migration]
---

How do you migrate a dependency injection framework in a large-scale Android application without stopping
feature delivery? At [Allegro](https://allegro.tech), this question became urgent when our data analysts
indicated a direct link between app startup time and user retention. The answer involved a combination of careful
architectural decisions, a hybrid migration strategy, and AI-powered automation that reduced the migration time
per module from roughly one week to under two days.

In this article, we describe the problem that triggered the migration, the technical approach we took, the patterns
that emerged during implementation, and the measurable results from a controlled experiment comparing manual work
against AI-assisted migration.

## Problem statement

In Q3 2024, cold start times in the Allegro Android app climbed to 6.0 seconds (p90), while user-perceived ANR (Application Not Responding) rates climbed 0.05 percentage points to 0.13% — still below [Google's 0.47% "bad behavior" threshold](https://developer.android.com/topic/performance/vitals/anr) that triggers Play Store discoverability penalties, but heading the wrong way. At the same time, our product teams reported a sharp increase in application uninstalls. The biggest problem affected older and lower-end devices, where performance issues were much more visible.

After initial optimizations in Q4 2024 (async initialization of core features), in Q1 2025 the uninstallation rate decreased by 25%, cold start time dropped to 4.7 seconds (p90), and ANR rates fell to 0.08%. The correlation was clear: users directly associate app quality with startup speed and responsiveness. 

After those quick wins, [Koin](https://insert-koin.io/) — the Kotlin dependency injection framework the app was
built on — became the primary bottleneck standing between us and our performance targets. Its runtime-based
approach consumed up to one-third of the cold start time in extreme cases. With nearly 500 Gradle modules in the
codebase, the dependency graph initialization at runtime simply did not scale.

<img alt="Koin initialization blocking the main thread during app startup" src="/assets/img/articles/2026-07-27-how-ai-agents-halved-effort-migrating-gradle-modules-koin-to-hilt/start_koin_block.png" width="600">
The Perfetto system trace visualizes the app's cold startup timeline, highlighting the START_KOIN dependency injection process nested under the bindApplication execution block. Read horizontally left-to-right for time progression and top-to-bottom for call-stack depth, the wide span of START_KOIN visually demonstrates its heavy impact relative to overall startup duration.

## Context and background

We evaluated several dependency injection (DI) frameworks and selected [Hilt](https://dagger.dev/hilt/). The key
difference is **when** the DI work happens. Koin resolves dependencies at runtime — on app startup it registers
every module and then lazily wires the graph together on the device through a typed service-locator lookup. Hilt,
built on top of [Dagger](https://dagger.dev/), does this work at build time instead - its annotation processor
reads `@Inject`, `@Module`, and related annotations in the source code and generates the entire dependency graph
as plain Kotlin classes during compilation. At runtime the phone just executes those pre-generated instructions —
no graph construction, no per-lookup resolution — which dramatically reduces the impact on application startup
time.

Beyond performance, Hilt provides compile-time dependency validation by design. Missing modules or incorrect
definitions produce build errors rather than runtime crashes. This shifts the cost of finding DI issues from end
users to the CI/CD pipeline.

### Migration model

The migration replaces Koin’s runtime DI with Hilt’s compile-time generated code. Each Gradle module is migrated
independently while preserving backward compatibility through EntryPoint proxying. This allows teams to migrate at
their own pace without blocking each other.

<img alt="Koin-to-Hilt proxy layer using EntryPoint bridging during migration" src="/assets/img/articles/2026-07-27-how-ai-agents-halved-effort-migrating-gradle-modules-koin-to-hilt/di_proxy.png" width="600">

The migrated modules remain available in Koin as proxies to Hilt. This is necessary to maintain compatibility with
feature modules that have not yet been converted. Once downstream modules switch to Hilt, the proxy layer is removed.

### Current status

By the end of Q2 2026, more than 60 core modules had been completely migrated as part of the "Core First" phase,
the foundation that all feature modules depend on. These included analytics, networking, deep linking, remote config,
and utils. Approximately 400+ feature modules remain.

## Approach

### Delivery strategy

We adopted a bottom-up, core-first migration order. Base modules were migrated first because Hilt requires
dependencies to be available up the dependency tree. Whenever possible, entire modules are converted at once to avoid
the complications of partial migration.

The key principles of our bridging strategy:
- Create the Hilt module with matching scopes and qualifiers.
- Modify the existing Koin module to proxy through Hilt via `@EntryPoint`.
- Replace injections in the UI layer (swap `get()`/`inject()` for `@Inject`).
- Remove the Koin proxy only when the entire dependency area has been migrated.

Koin files are never deleted during migration, only modified to proxy dependencies from Hilt. When a Hilt module
depends on a not-yet-migrated Koin module, temporary glue code based on KoinComponent bridges the gap.

### Glue migration pattern

During the transition period, two interoperability patterns keep migrated and non-migrated modules working together.
When a Koin module needs to consume a dependency already managed by Hilt, we expose it through a DependencyProvider
object that uses `@EntryPoint`:

```kotlin
internal object PaymentDependencyProvider {

    private fun entryPoint(context: Context) =
        EntryPoints.get(context, PaymentEntryPoint::class.java)

    fun getPaymentService(context: Context): PaymentService {
        return entryPoint(context).paymentService()
    }

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    interface PaymentEntryPoint {
        fun paymentService(): PaymentService
    }
}
```

The existing Koin factory then delegates to this provider instead of creating the dependency directly:

```kotlin
object PaymentKoinModuleFactory {
    fun create(context: Context) = module {
        factory<PaymentService> {
            PaymentDependencyProvider.getPaymentService(context)
        }
    }
}
```

Koin inside Hilt (`KoinComponent` glue): when a module being migrated depends on another module that still lives
in Koin, we use a temporary `KoinComponent` wrapper:

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object CheckoutHiltModule {

    object LegacyCartFromKoin : KoinComponent {
        fun create(): CartRepository = get<CartRepository>()
    }

    @Provides
    fun provideCheckoutService(@ApplicationContext context: Context): CheckoutService {
        return CheckoutServiceImpl(cart = LegacyCartFromKoin.create())
    }
}
```

This glue code is intentionally temporary. Once the upstream module is migrated, the `KoinComponent` wrapper is
replaced with standard Hilt injection.

### Acceleration with AI agents

Manual migration of 500 modules was estimated to require an immense amount of engineering effort and time. To reduce
this burden, we created a dedicated AI skill that encodes the entire migration process as a repeatable,
agent-executable workflow (via GitHub Copilot with Claude Opus 4.6 or Claude Code directly).

The skill translates every Koin DSL construct (factory, single, viewModel, named(), binds, scoped, and others) into
its Hilt equivalent through a step-by-step procedure: factory and singleton conversion, qualifiers, multi-interface
binds, networking, deep linking, ViewModels, scoped dependencies, test migration, and build verification.

The key design principle is that the skill never assumes the agent already knows how to perform a Koin-to-Hilt
migration. Each step provides explicit “Before”/“After” code examples. The agent matches the pattern it finds in
the source code against the “Before” template, identifies the declaration type, and generates the corresponding
“After” code. This makes the output highly predictable regardless of which LLM executes the skill.

The skill ends with a verification step: running a build script that compiles the entire project and confirms all
dependencies resolve correctly.

Example: A fragment from the skill shows how a Koin factory is converted

````
### Step 2: Create Hilt Structure and Modules

- If the Gradle module's `build.gradle` file you are working with does not have the plugin `id 'pl.allegro.libs.hilt'`, add it at the end of the plugins section.
- Creating a new file for the Hilt module, use the name of the existing file for Koin. Remove the “KoinModuleFactory” or “ModuleFactory” suffix from the name and replace it with “HiltModule”.
- If you need to create a `DependencyProvider` file, use the base name and add the suffix `DependencyProvider` to it.
- Create `HiltModule` file before `DependencyProvider` file and fill it with entries first. `HiltModule` must not be empty in the final migration result!
#### Before

- There is a file named with the postfix `KoinModuleFactory` (or just `ModuleFactory`) in some `di` package, for example `DummyKoinModuleFactory`

```kotlin
object DummyKoinModuleFactory {
    fun create() = module {
        factory<DummyClass> { DummyClassImpl() }
    }
}
```

#### After

- There is another Kotlin file with the same prefix, but a different postfix. Reuse the first part of the name and add `HiltModule` instead of `KoinModuleFactory`. The new file could be named like `DummyHiltModule`.
- Create one more Kotlin file with the same prefix, but with the `DependencyProvider` postfix, like `DummyDependencyProvider`

Initial content of an empty `HiltModule` for the `Dummy` module could look like:

```kotlin
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
internal class DummyHiltModule {
}
```

Initial content of an empty `DependencyProvider` for the `Dummy` module could look like:

```kotlin
import android.content.Context
import dagger.hilt.InstallIn
import dagger.hilt.EntryPoint
import dagger.hilt.EntryPoints
import dagger.hilt.components.SingletonComponent

internal object DummyDependencyProvider {

    private fun entryPoint(context: Context) = EntryPoints.get(context, DummyEntryPoint::class.java)

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    interface DummyEntryPoint {
    }
}
```
````

## Trade-offs

### Fix technical debt before migrating

Hilt verifies the complete dependency tree at compile-time. Migrating modules with incorrect structure or missing
dependencies forces the creation of a large number of fake DI modules in tests. We found it more efficient to address
existing structural issues before starting the migration.

### Centralize DI declarations

We recommend centralizing dependency provision within Hilt modules using `@Provides` rather than scattering
`@Inject constructor()` annotations throughout business code. This improves readability and facilitates future DI
framework changes.

### Build time increase

Hilt’s annotation processing adds compile-time. For our codebase, this is an acceptable trade-off: slower builds
but faster, more reliable runtime. The cold start reduction and elimination of runtime DI crashes outweigh the
CI impact.

## Results

### Productivity experiment

To measure the impact of AI-assisted migration, we conducted a crossover experiment. The study involved developers
performing several migrations on modules of comparable complexity: one entirely manual (the baseline) and one using
an AI coding agent. The crossover design, where developer A migrates module X manually and module Y with AI, while
developer B does the reverse, eliminates individual skill level as a confounding variable.

We tracked three categories of time: active time (prompting, instructing, and correcting the agent), passive time
(the agent working autonomously while the developer does other tasks), and total elapsed time. Each session was
logged with start/end timestamps and brief descriptions.

Fair-play rules ensured valid comparison. In the manual phase, developers could use IDE code completion but no LLM
assistants. In the AI phase, the agent was the “driver” and developers intervened only when it stalled or made errors.

| Approach | Developer time | Agent time | Total elapsed | Developer time saved | Total time saved |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Manual | 14h 23m | — | 14h 23m | — | — |
| Agentic  | 3h 26m | 3h 16m | 6h 42m | 10h 57m (76%) | 7h 41m (53%) |

The AI agents reduced active developer time by approximately 76%. Total elapsed time (including agent processing)
was reduced by roughly 53%. The agents handled boilerplate conversion effectively, while developers focused on scope
decisions, UI injection verification, and edge cases.

### Performance impact

The migration of core modules has already contributed to measurable startup improvements. The uninstallation rate
dropped after initial optimizations, with further reductions correlated with Hilt adoption in subsequent quarters.
The target is to bring cold start below 3.5 seconds for lower-end devices, which is expected to further reduce
uninstallation rates.

## Conclusion

Migrating a DI framework in a 500-module Android application requires a deliberate strategy: core-first rollout,
backward-compatible proxying, and comprehensive testing infrastructure for the hybrid state. The migration is ongoing,
and the goal is to fully sunset Koin by the end of the year. The combination of architectural decisions and AI-assisted
automation has been critical in maintaining feature delivery while achieving significant performance improvements.
The lessons learned from this migration will inform future large-scale refactorings and framework transitions
at Allegro.
