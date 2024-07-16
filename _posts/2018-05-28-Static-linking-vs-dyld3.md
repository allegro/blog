---
layout: post
title: Static linking vs dyld3
author: kamil.borzym
tags: [mobile, ios, macos, static linking, dyld, dyld3]
---

The following article has two parts. The first part describes improving
[Allegro iOS app](https://itunes.apple.com/pl/app/allegro/id305659772?l=pl&mt=8)
launch time by adopting static linking and sums it up with a&nbsp;speedup
analysis. The second part describes how I&nbsp;managed to launch a&nbsp;custom
macOS app using not-yet-fully-released dyld3
[dynamic linker](https://en.wikipedia.org/wiki/Dynamic_linker) and also
completes with an app launch speedup analysis.

## Improving iOS app launch time

It takes some time to launch a&nbsp;mobile app, especially on a&nbsp;system with
limited power of mobile CPU. Apple suggests
[400ms](https://developer.apple.com/videos/play/wwdc2016/406) as a&nbsp;good
launch time. [iOS](https://en.wikipedia.org/wiki/IOS) performs zoom animation
during the app launch – thus creating an opportunity to perform all
CPU-intensive tasks. Ideally the whole launch process on iOS should be
completed as soon as the app opening animation ends.

Apple engineers described some techniques to improve launch times in
[WWDC 2016 - Session 406: Optimizing App Startup Time](https://developer.apple.com/videos/play/wwdc2016/406).
This wasn't enough, so the very next year they announced a&nbsp;brand new
dynamic linker in
[WWDC 2017 - Session 413: App Startup Time: Past, Present, and Future](https://developer.apple.com/videos/play/wwdc2017/413/).
Looking at the history of dyld, one can see that Apple is constantly trying to
make their operating systems faster.

At Allegro we also try to make our apps as fast as possible. Aside from using
Swift (Swift performs much better than ObjC in terms of launch time and app
speed), we build our iOS apps using
[static linking](https://en.wikipedia.org/wiki/Static_library).

## Static linking

Allegro iOS app uses **a&nbsp;lot** of libraries. The app has modular
architecture and each module is a&nbsp;separate library. Aside from that,
Allegro app uses a&nbsp;lot of 3rd-party libraries, integrated using
[CocoaPods](https://cocoapods.org/) package manager. All these libraries used to
be integrated as
[frameworks](https://developer.apple.com/library/content/documentation/MacOSX/Conceptual/BPFrameworks/Concepts/WhatAreFrameworks.html) –
a&nbsp;standard way of dylibs (dynamic libraries) distribution in Apple
ecosystem. 57&nbsp;nested frameworks is a&nbsp;number large enough to impact app
launch time. iOS has a&nbsp;20 seconds app launch time limit. Any app that hits
that limit is instantly killed. Allegro app was often killed on a&nbsp;good old
iPad 2, when the device was freshly started and all caches were empty.

Dynamic linker performs a&nbsp;lot of disk IO when searching for dependencies.
Static linking eliminates the need for all that dylib searching – dependencies
and executable become one. We decided to give it a&nbsp;try and to link at
least some of our libraries statically into main executable, hence reducing
frameworks count.

We wanted to do this gradually, framework by framework. We also wanted to have
a&nbsp;possibility to turn the static linking off in case of any unexpected
problem.

We decided to use a&nbsp;two-step approach:
- compiling frameworks code to static libraries,
- converting frameworks (dynamic library packages) to resource bundles
  (resources packages).

### Compiling framework code as a static library

Xcode 9 provides `MACH_O_TYPE = staticlib` build setting –
[linker](https://en.wikipedia.org/wiki/Linker_(computing)) produces static
library when the flag is set. As for libraries integrated through CocoaPods, we
had to create a&nbsp;custom script in
[Podfile](https://guides.cocoapods.org/syntax/podfile.html) to set this flag
only for selected external libraries during `pod install` (that is during
dependencies installation, because CocoaPods creates new project structures for
managed libraries with each reinstallation).

`MACH_O_TYPE` does a&nbsp;great job, but we performed static linking even
before Xcode&nbsp;9 was released. Although Xcode&nbsp;8 had no support for
static Swift linking, there is a&nbsp;way to perform static linking using
[`libtool`](https://www.manpagez.com/man/1/libtool/). In those dark times, we
were just adding custom build phases with
[buildstatic](https://github.com/aliceatlas/buildstatic) script for selected
libraries. This may seem like a&nbsp;hack, but it is really just a&nbsp;hefty
usage of well-documented toolset... and it worked flawlessly.

That way we replaced our dynamic libraries with static libraries, but that was
the easier part of the job.

### Converting framework to resource bundle

Aside from dynamic libraries, a&nbsp;framework can also contain resources
(images,
[nibs](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/LoadingResources/CocoaNibs/CocoaNibs.html),
etc.). We got rid of dynamic libraries, but we couldn't leave
resource-only-frameworks. Resource bundle is a&nbsp;standard way of wrapping
resources in Apple ecosystem, so we created
[`framework_to_bundle.sh`](https://gist.github.com/kam800/7e9b0fd55a3fbcd455695aab3ffa08ac)
script, which takes `*.framework` and outputs `*.bundle` with all the resources.

The resource-handling code was redesigned to automatically use the right
resource location. Allegro iOS app has
a&nbsp;[`Bundle.resourcesBundle(forModuleName:)`](https://gist.github.com/kam800/ae364706988526abf5b09bf959c5646e)
method, which always finds the right bundle, no matter what linking type was
used.

### Results

Last time the Allegro iOS app launch time was measured, it still had 31 dynamic
libraries – so merely 45% libraries were linked statically and results were
already very promising. Our job with static linking revolution is not complete
yet, the target is 100%.

We measured launch time on different devices for two app versions: one with all
libraries dynamically linked and the other one with 26 libraries statically
linked. What measurement method did we use? A&nbsp;stopwatch... yes, real
stopwatch. `DYLD_PRINT_STATISTICS=1` variable is a&nbsp;tool that can help
identify the reason of a&nbsp;dynamic linker being slow, but it does not
measure the whole launch time. We used a&nbsp;stopwatch and slow motion camera,
to measure the time between an app icon tap and the app home screen being fully
visible.

<video src="/assets/img/articles/2018-05-28-Static-linking-vs-dyld3/measurement_start.mp4" autoPlay loop></video>
<video src="/assets/img/articles/2018-05-28-Static-linking-vs-dyld3/measurement_stop.mp4" autoPlay loop></video>

Each measurement in the following table is an average of 6&nbsp;samples.

&nbsp;                        | iPhone 4s | iPad 2 | iPhone 5c | iPhone 5s | iPhone 7+ | iPad 2 cold launch
------------------------------|-----------|--------|-----------|-----------|-----------|-------------------
57 dylibs app launch time [s] | 7.79      | 7.33   | 7.30      | 3.14      | 2.31      | 11.75
31 dylibs app launch time [s] | 6.62      | 6.08   | 5.39      | 2.75      | 1.75      | 7.27
Launch speedup [%]            | 15.02     | 17.05  | 26.16     | 12.42     | 24.24     | 38.13

Allegro iOS app launch time decreased by about 2&nbsp;seconds on iPhone 5c –
this was a&nbsp;significant gain. The app launch time improved even more on
freshly turned on iPad 2 – the difference was about 4.5 seconds, which was about
38% of the launch time with all libraries being dynamically linked.

![speedup.png](/assets/img/articles/2018-05-28-Static-linking-vs-dyld3/speedup.png)

### Static linking pitfall

Having some statically linked library, beware of linking it with more than one
dynamic library – this will result in static library objects being duplicated
across different dynamic libraries and that could be a&nbsp;serious problem.
We have created
a&nbsp;[`check_duplicated_classes.sh`](https://gist.github.com/kam800/0d04917b4f051c1dd906d629d685f571)
script to be run as a&nbsp;final build phase.

That was the only major obstacle we've come across.

## Dyld3

Dyld3, the brand new
[dynamic linker](https://en.wikipedia.org/wiki/Dynamic_linker), was announced
about a&nbsp;year ago at
[WWDC 2017](https://developer.apple.com/videos/play/wwdc2017/413/). At the time
of writing this article, we are getting close to WWDC 2018 and dyld3 is still
not available for 3rd party apps. Currently only
[system apps use dyld3](https://twitter.com/lgerbarg/status/882055176298704896).
I&nbsp;couldn't wait any longer, I&nbsp;was too curious about its real power.
I&nbsp;decided to try launching my own app using dyld3.

### Looking for dyld3

I wondered: What makes system apps so special that they are launched with dyld3?

First guess: `LC_LOAD_DYLINKER` load command points to dyld3 executable...

```bash
$ otool -l /Applications/Calculator.app/Contents/MacOS/Calculator | grep "cmd LC_LOAD_DYLINKER" -A 2
          cmd LC_LOAD_DYLINKER
      cmdsize 32
         name /usr/lib/dyld (offset 12)
```

That was a&nbsp;bad guess. Looking through the rest of load commands and all
the app sections revealed nothing particular. Do system applications use dyld3
at all? Let's try checking that using [lldb](https://lldb.llvm.org/) debugger:

```bash
$ lldb /Applications/Calculator.app/Contents/MacOS/Calculator
(lldb) rbreak dyld3
Breakpoint 1: 887 locations.
(lldb) r
Process 92309 launched: '/Applications/Calculator.app/Contents/MacOS/Calculator' (x86_64)
Process 92309 stopped
* thread #1, stop reason = breakpoint 1.154
    frame #0: 0x00007fff72bf6296 libdyld.dylib`dyld3::AllImages::applyInterposingToDyldCache(dyld3::launch_cache::binary_format::Closure const*, dyld3::launch_cache::DynArray<dyld3::loader::ImageInfo> const&)
libdyld.dylib`dyld3::AllImages::applyInterposingToDyldCache:
->  0x7fff72bf6296 <+0>: pushq  %rbp
    0x7fff72bf6297 <+1>: movq   %rsp, %rbp
    0x7fff72bf629a <+4>: pushq  %r15
    0x7fff72bf629c <+6>: pushq  %r14
Target 0: (Calculator) stopped.
```

lldb hit some dyld3-symbol during system app launch and did not during
any custom app launch. Inspecting the backtrace and the assembly showed that
`/usr/lib/dyld` contained both the old dyld2 and the brand new dyld3. There had
to be some `if` that decided which dyldX should be used.

Reading assembly code is often a&nbsp;really hard process. Fortunately
I&nbsp;remembered that some parts of apple code are open sourced, including
[dyld](https://opensource.apple.com/source/dyld/). My local binary had
`LC_SOURCE_VERSION = 551.3` and the most recent dyld source available was
`519.2.2`. Are those versions distant? I&nbsp;spent a&nbsp;few nights looking
at local dyld assembly and corresponding dyld sources and didn't see any
significant difference. In fact I&nbsp;had a&nbsp;strange feeling that the
source code exactly matched the assembly – it was a&nbsp;perfect guide for
debugging.

What did I&nbsp;end up with? Hidden dyld3 can be activated on macOS High Sierra
using one of the following two approaches:

1. setting ``dyld`sEnableClosures``:
   - ``dyld`sEnableClosures`` needs to be set by e.g. using lldb `memory write`
    (unfortunately undocumented `DYLD_USE_CLOSURES=1` variable only works on
    Apple internal systems),
   - `/usr/libexec/closured` needs be compiled from [dyld
    sources](https://opensource.apple.com/source/dyld/) (it needs a&nbsp;few
    modifications to compile),
   - `read` invocation in `callClosureDaemon` needs to be fixed (I filed
    a&nbsp;[bug report](https://openradar.appspot.com/40522089) for this
    issue); for the sake of tests I&nbsp;fixed it with lldb `breakpoint
    command` and a&nbsp;custom
    [lldb script](https://gist.github.com/kam800/e1f1fa143257c733a20aea2974929ab8)
    that invoked `read` in a&nbsp;loop until it returned 0, or
1. dyld closure needs to be generated and saved to the dyld cache... but...
   what is a&nbsp;dyld closure?

### Dyld closure

[Louis Gerbarg](https://twitter.com/lgerbarg) mentioned the concept of dyld
closure at [WWDC 2017](https://developer.apple.com/videos/play/wwdc2017/413/).
Dyld closure contains all the informations needed to launch an app. Dyld
closures can be cached, so dyld can save a&nbsp;lot of time just restoring them.

[Dyld sources](https://opensource.apple.com/source/dyld/) contain
`dyld_closure_util` – a&nbsp;tool that can be used to create and dump dyld
closures. It looks like Apple open source can rarely be compiled on
a&nbsp;non-Apple-internal system, because it has a&nbsp;lot of Apple private
dependencies (e.g. `Bom/Bom.h` and more...). I&nbsp;was lucky –
`dyld_closure_util` could be compiled with just a&nbsp;couple of simple
modifications.

I created a&nbsp;macOS app just to check dyld3 in action. The `TestMacApp.app`
contained 20 frameworks, 1000 ObjC classes and about 1000~10000 methods each.
I&nbsp;tried to create a&nbsp;dyld closure for the app, its
[JSON representation (36.5&nbsp;MB)](https://raw.githubusercontent.com/kam800/dyld3-samples/master/sample_dyld_closure.txt)
was pretty long - almost milion lines:

```bash
$ dyld_closure_util -create_closure ~/tmp/TestMacApp.app/Contents/MacOS/TestMacApp | wc -l
  832363
```

The basic JSON representation of a&nbsp;dyld closure looks as follows:

```json
{
  "dyld-cache-uuid": "9B095CC4-22F1-3F88-8821-8DFD979AB7AD",
  "images": [
    {
      "path": "/Users/kamil.borzym/tmp/TestMacApp.app/Contents/MacOS/TestMacApp",
      "uuid": "D5BDC1D3-D09E-36D5-96E9-E7FFA7EE955E"
      "file-inode": "0x201D8F8BC", // used to check if dyld closure is still valid
      "file-mod-time": "0x5B032E9A", // used to check if dyld closure is still valid
      "dependents": [
        {
          "path": "/Users/kamil.borzym/tmp/TestMacApp.app/Contents/Frameworks/Frm1.framework/Versions/A/Frm1"
        },
        {
          "path": "/Users/kamil.borzym/tmp/TestMacApp.app/Contents/Frameworks/Frm2.framework/Versions/A/Frm2"
        },
        /* ... */
      ],
      /* ... */
    },
    {
      "path": "/Users/kamil.borzym/tmp/TestMacApp.app/Contents/Frameworks/Frm1.framework/Versions/A/Frm1",
      "dependents": [ /* ... */ ]
    },
    /* ... */
  ],
  /* ... */
}
```

Dyld closure contains a&nbsp;fully resolved dylib dependency tree. That means:
no more expensive dylib searching.

### Dyld3 closure cache

In order to measure dyld3 launch speed gain, I&nbsp;had to use the dyld3
activation method #2 – providing a&nbsp;valid app dyld closure. Although setting
``dyld`sEnableClosures`` creates a&nbsp;dyld closure during app launch, the
closure is currently not being cached.

[Dyld sources](https://opensource.apple.com/source/dyld/) contain
an&nbsp;`update_dyld_shared_cache` tool source code. Unfortunately this tool
uses some Apple-private libraries, I&nbsp;was not able to compile it on my
system. By pure accident I&nbsp;found that this tool is available in every
macOS High Sierra in `/usr/bin/update_dyld_shared_cache`. Also the
[`man update_dyld_shared_cache`](https://www.manpagez.com/man/1/update_dyld_shared_cache/)
was present – this made the cache rebuild even simpler.

`update_dyld_shared_cache` sources showed that it generates dyld closures cache
only for a&nbsp;set of predefined system apps. I&nbsp;could modify the tool
binary to take `TestMacApp.app` into account, but I&nbsp;ended up renaming the
test app to `Calculator.app` and moving it to `/Applications` – simple, but
effective.

I updated the dyld closure cache:

```bash
sudo update_dyld_shared_cache -force
````

and restarted my system (as stated by `man update_dyld_shared_cache`). After
that, my test app launched using dyld3! I&nbsp;verified that with lldb. Also
setting `DYLD_PRINT_WARNINGS=1` variable showed that the dyld closure was not
generated, but taken from the dyld cache:

```
dyld: found closure 0x7fffef8f278c in dyld shared cache
````

### Dyld3 performance

As I&nbsp;wrote earlier, the test app contained 20 frameworks, each framework
having 1000 ObjC classes and 1000~10000 methods. I&nbsp;also created
a&nbsp;simple dependency network between those frameworks: main app depended on
all frameworks, 1st framework depended on 19 frameworks, 2nd framework depended
on 18 frameworks, 3rd framework depended on 17 frameworks, and so on... After
launching, the app just invoked `exit(0)`. I&nbsp;used
[`time`](https://www.manpagez.com/man/1/time/) to measure the time between
invoking the launch command and app exit. I&nbsp;didn't use
`DYLD_PRINT_STATISTICS=1`, because, aside from the reasons presented above,
dyld3 does not even support this variable
[yet](https://openradar.appspot.com/40593547).

Test platform was MacBook Pro Retina, 13-inch, Early 2015 (3,1 GHz Intel Core
i7) with macOS High Sierra 10.13.4 (17E202). Unfortunately I&nbsp;didn't have
access to any significantly slower machine. Each measurement in the following
tables is an average of 6&nbsp;samples. Two types of launches were measured:

- warm launch – without system restart,
- cold launch – system restart between each measured time sample.

Statically linked app always launched very fast, but I&nbsp;could not see any
significant difference between dyld2 and dyld3 loading time.

launch type | dyld2  | dyld3  | static
------------|--------|--------|-------
warm        | 0.737s | 0.726s | 0.676s
cold        | 1.166s | 1.094s | 0.871s

I tried measuring app launch from some slower drive configuration – an old USB
drive (having terribly low sequential read speed of 17.1 MB/s). Disk IO was
supposed to be a&nbsp;bottleneck of dyld2 loading. I&nbsp;faked
`/Application/Calculator.app` path using `ln -s /Volumes/USB/Calculator.app`
and regenerated dyld cache.

Next measurements looked much better. No difference at warm launch, but cold
launch was 20% faster with dyld3 than with dyld2. Actually dyld3 cold launch
was right in the middle, between dyld2 launch time and statically linked app
launch time.

launch type | dyld2  | dyld3  | static
------------|--------|--------|-------
warm        | 0.722s | 0.731s | 0.679s
cold        | 3.687s | 2.947s | 2.276s

### dyld3 status

Mind that dyld3 in still under development, it has not been released for 3rd
party apps yet. I&nbsp;guess it is currently available for system apps not to
increase their speed, but mainly to test dyld3 stability.

[Louis Gerbarg](https://twitter.com/lgerbarg) said that dyld3 had its daemon.
On macOS High Sierra there is no dyld3 daemon. `closured` is currently invoked
by dyld3 as a&nbsp;command line tool with `fork`+`execve`. It does not even
cache created dyld closures. For sure we will see a&nbsp;lot of changes in the
near future.

Are you curious about my opinion? I&nbsp;think a&nbsp;fully working dyld3 with
`closured` daemon will be shipped with the next major macOS version.
I&nbsp;think this new dyld3 version will implement even faster in-memory
closure cache. Everyone will feel a&nbsp;drastic app launch time improvement on
all Apple platforms – launch time much closer to statically linked app
launching than to the current dyld2 launching. I&nbsp;keep my fingers
crossed.
