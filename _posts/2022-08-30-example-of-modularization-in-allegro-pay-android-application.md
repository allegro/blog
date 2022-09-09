---
layout: post
title: "Example of modularization in Allegro Pay Android application"
author: [michal.kwiatek]
tags: [tech, kotlin, android, modularization, gradle, allegro-pay]
---
Currently, in the Android world, the topic of modularization is very popular. Many bloggers describe their experiences
with it and analyze what [Google recommends](https://developer.android.com/topic/modularization/patterns). Our team
started the modularization process before it was so hot. I will describe our reasons, decisions, problems and give you
some advice. We will see if modularization makes sense and what it brings to the table. I will also post some statistics
showing what it looked like before and after the modularization process.

## Some theory

### Module

„A [module](https://developer.android.com/studio/projects#:~:text=inside%20your%20project.-,Modules,test%2C%20and%20debug%20each%20module)
is a collection of source files and build settings that allow you to divide your project into discrete units of
functionality. Your project can have one or many modules, and one module may use another module as a dependency. You can
independently build, test, and debug each module.”

### Background

Allegro Pay is a payment method on Allegro that allows you to postpone the payment by 30 day or divide it into smaller
parts. People who use Allegro Pay know how many functionalities it has, those who don’t use it yet will know after
reading this article. It started from 3 modules. At the time of writing this article the Allegro application for the
Android platform consists of over 120 modules, 9 of which are maintained by Allegro Pay Team. In this quarter, we
focused on extracting several domains (features) from the main Allegro Pay module into separate, smaller and specialized
modules.

## What made us start the modularization process?

The main reason for the modularization process was the build time of one of these 3 modules — containing the entire
Allegro Pay domain. Our internal monitoring tools showed that build times started to average 100 seconds, and at their
worst point grew to just over 120 seconds. The module contains over 40k LoC (lines of code). In addition, we faced
problems when introducing changes, such as conflicts or the possibility of accidental modification of another
functionality.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/before_both.png)

### Cheat

I mention the build time for a reason. In our case, in a multi—module project, we use some gradle instructions. Our
gradle.properties file looks something like this:

```groovy
// some instructions
org.gradle.parallel = true
org.gradle.configureondemand = true
org.gradle.caching = true
// more instructions
```

The first instruction
enables [parallelization](https://docs.gradle.org/current/userguide/performance.html#parallel_execution)
so that gradle can perform more than one task at a time as long as the tasks are in different modules. The second one
allows you to
[configure modules](https://docs.gradle.org/current/userguide/multi_project_configuration_and_execution.html#sec:configuration_on_demand)
that are relevant only to the task you want, rather than configuring them all, which is the default behavior.
Importantly, this instruction should be used for multi—module projects. And the last one is
[caching](https://docs.gradle.org/current/userguide/build_cache.html). It is „a cache mechanism that aims to save time
by reusing outputs produced by other builds. The build cache works by storing (locally or remotely) build outputs and
allowing builds to fetch these outputs from the cache when it is determined that inputs have not changed, avoiding the
expensive work of regenerating them.” By default, the build cache is disabled.

## Refinement, decisions and plans

At one of the weekly meetings, we discussed how to solve the problem of the growing module and the increasing number of
dependencies and functionalities. We decided that the best way would be to extract several domains (features) into
separate modules. Every new module should contain the implemented part of the domain that it represents according to the
name and a small contract module that can be attached to other modules in order to provide them with the implemented
functionality. So, we have planned the following modules:

1. ais (a banking service that isn't relevant in the context of this article) with contract module,
2. common,
3. consolidation with contract module,
4. onboarding with contract module,
5. overpayment with contract module,
6. repayment with contract module.

## Contract

The contract is a special module containing all the necessary interfaces, classes and methods that allow you to use the
functionality in other places in an easy way. It is defined inside the module containing the functionality
implementation. It should be emphasized here that the implementation module can only be based on a contract. This
solution means that every developer working on the project knows where to find the necessary information and interfaces
to run any feature.

```kotlin
interface AllegroPaySomeProcessHandler {

    fun createSomeIntent(context: Context, someId: String, otherData: OtherData): Intent

    fun observeSomeResult(): Observable<SomeResultEvent>
}
```

```kotlin
internal class AllegroPaySomeProcessHandlerImpl : AllegroPaySomeProcessHandler {

    override fun createSomeIntent(context: Context, someId: String, otherData: OtherData): Intent =
        SomeActivity.getIntent(context, someId, otherData)

    override fun observeSomeResult(): Observable<SomeResultEvent> =
        DataBus.listen(SomeResultEvent::class.java)
}
```

The above example shows what one of the assumptions of object-oriented programming — encapsulation — looks like in
practice. The *AllegroPaySomeProcessHandler* interface provides two methods, one of them creates the intent necessary to
run the process, and the other observes its result. The exact implementation is hidden in an internal class, not
accessible from the contract module. Every change of interface implementation is transparent to contract clients.
Example of how to declare a dependency on a contract:

```kotlin
dependencies {
    implementation project (':allegropay-some:contract')
}
```

## Tool

The Allegro application consists of many modules and it is important to provide programmers with the right tools to work
effectively. In the organization, the delivery of this type of tools is handled by the core team. A tool that allows us
to check whether our module meets the requirement set for it is
the [Module Graph Assert](https://github.com/jraska/modules-graph-assert). It is a Gradle plugin which „helps keep your
module graph healthy and lean.” This tool defines the types of modules that are allowed in the application, the
dependencies between them and the height of the dependency tree. The following types are defined in the Allegro
application: *App*, *Feature*, *Contract*, *Library*, *Util* and *NeedsMigration*. The last type informs that the module
still requires work from its owners and appropriate adaptation to one of the other types. We can also define allowed and
restricted dependencies between modules, e.g. a contract may depend only on another contract or a module marked as a
feature depends only on the contract or library. Allegro app configuration:

```groovy
moduleGraphAssert {
    maxHeight = 5
    allowed = [
        'App -> Feature',
        'App -> Library',
        'App -> Util',
        'App -> Contract',
        'Feature -> Library',
        'Feature -> Util',
        'Feature -> Contract',
        'Contract -> Contract',
        'NeedsMigration -> .*',
        '.* -> NeedsMigration',
    ]
    restricted = [
        'Contract -X> NeedsMigration',
        'Library -X> .*'
    ]
}
```

## Initial modules

The first separated feature module was overpayment. We immediately prepared a common module containing functionalities
used in more than one Allegro Pay module. The contract that is shown earlier contains one method returning an Intent
needed to run the overpayment process. The feature module includes user-visible screens, use cases and network
communication. Several thousand lines of code were added to this module and the time needed to build the main Allegro
Pay module was shortened. At that time, the build time of the main module was around 87.5 seconds, common and
overpayment modules around 10.5 seconds.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/first_modules_both.png)

## Following modules

In the next stages, we separated the ais, consolidation and repayment modules. The current values of the build times of
individual modules are around 33.7 seconds for the Allegro Pay main module, 13.4 seconds for the ais, 12 seconds for the
consolidation, 10.6 seconds for the repayment. The extraction process was analogous to that of the first module.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/few_both.png)

## Onboarding module

This module was the most challenging and possibly the most time consuming. This was due to the combination of the
process being available from multiple screens in different modules and ensuring unchanged functionality. During this
modularization process, we discovered the possibility of optimizing and reducing the amount of code. This module
contains approximately 10k LoC and the build time is less than 20 seconds. It is a really huge module.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/onboarding_both.png)

## Other two modules

If you remember, I mentioned three modules at the beginning of this text. So far, I have described the division of the
largest module. Let me now describe others in more detail. The first is the special analytical module. Includes an
external library and a small contract. It was created at the same time as the main Allegro Pay module. The current value
of the build time is 3 seconds and the module has more than 150 lines of code.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/sms_both.png)

The second is the SMS verification module. It contains a functionality that allows users to authorize operations by
providing SMS code. Currently, it is used in the processes of buying, consolidation, onboarding and overpayment. We only
wrote a contract here, which provides a universal and easy interface. The build time is approximately 9 seconds and the
module contains almost 2k lines of code.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/sa_both.png)

## Fin

Probably for some of you, the division method used may be associated with the Latin term divide et impera. This paradigm
of algorithm design could also be used in the modularization process by dividing one large module into several smaller
ones, each specialized in one task. The use of the concept of this paradigm, encapsulation by creating a contract and
gradle configuration allowed to significantly reduce the build time and speed up the development of the application.
This solution introduces consistency in the module and decreases the possibility of introducing a regression by
encapsulating each individual domain. Also the problem with the redundant conflicts has been minimalized. After the
implementation of the modules described above, the main module containing the Allegro Pay responsibilities has shrunk
significantly, and now contains around 18.4k LoC (which means it was reduced by half). In addition, modularization will
allow us to add new features and extend the existing ones in an easier and safer way. It was an interesting challenge
from a technical point of view.
![Build time in seconds and LoC.](/img/articles/2022-08-30-example-of-modularization-in-allegro-pay-android-application/after_both.png)
