---
layout: post
title: Kotlin - language for everyone and for everything. Even scripts.
author: [weronika.orczyk]
tags: [tech, kotlin, script]
---

According to Wikipedia there are approximately 700 computer languages available. Seven hundred.
This is an unbelievable number and it’s the reason why programmers face the problem of
choosing a programming language to work with, which frameworks to use and which tech stack to learn.
All of them have pros and cons but when you are looking for an all-purpose language you should take Kotlin
into consideration and ask yourself the question: “Do I need another programming language?”.

![scripting](/img/articles/2021-03-19-scripting.jpg)

Kotlin is an open source, statically typed and powerful language. It takes inspiration from many programming languages like Java,
Scala, C#, Groovy, Python and it tries to combine the best features from each. The support for multiplatform programming
is one of Kotlin’s key benefits. Kotlin is able to compile to many platforms including Android, JVM, JavaScript,
and native.

Kotlin is great for building applications but what if you need to write a script? The first thing that comes to mind is to use
a classic, traditional shell script or Python which gives you the ability to move files, copy, delete and more by running
a program from command-line. But if Kotlin is your cup of tea, it can be also used as a scripting language!

When talking about shell scripts, I have to mention their syntax, which can be unclear and enigmatic. It is really hard to write
a clear piece of code in a complex script. Another drawback is long execution time. Shell scripts are simply slow due to almost
every executed shell command need to launch a new process. Additionally, there are compatibility problems between platforms.
The creator of Perl, Larry Wall, famously wrote that “It is easier to port a shell than a shell script.”

I’ve mentioned slow execution of shell scripts due to creation a new process every command. It’s a true,
but on the other hand creation a new JVM to execute a script and a compilation process is also long. The execution time usually
depends on a machine and distribution of JVM. It can be a bit frustrating when Java version is impropriety for an executed script
or when some machines use different operating system which can lead to some compatibility issues but now when
containerization is getting more and more popular this problem is insignificant.

So what’s about Python? Python has lots of nice libraries which can be used for everything and is available on most
systems — the problem with compatibility is eliminated.

While scripts written in Python are more readable than shell scripts, but they aren’t type-safe in the way that Kotlin
is. Kotlin is statically typed which means that types are verified during compilation and strongly typed which means that
he type of a variable cannot change after its declaration. In contrast to a dynamically typed language, which Python is,
it helps prevent all kinds of incompatible type errors. It brings the opportunity to create scripts that help you automate
mundane tasks, but it can be done in a much safer way.

Let’s move to the code and see Kotlin scripts in practice.

### Install Kotlin for scripting
In order to allow scripting, you need to make Kotlin available for the entire system. Open a terminal and check if Kotlin is
installed:
```
kotlinc -version
```
If the command was not found, the easiest way to install Kotlin on UNIX-based systems such as OS X,
Linux, Cygwin, FreeBSD, and Solaris is SDKMAN!. Install Kotlin with the command:
```
sdk install kotlin
```

Alternatively, on OS X you can install the compiler via Homebrew
```
brew install kotlin
```
Check the kotlin version again.

### First script

[Kotlin Evolution and Enhancement Process (KEEP) document](https://github.com/Kotlin/KEEP/blob/master/proposals/scripting-support.md)
was created to explain Kotlin scripting. It presents use cases of scripting, examples and contains the whole proposal
but it is still a draft. According to this file, a Kotlin script is a simple Kotlin snippet. Each command in the file is
executed as if it was in the main function. To make a file executable the file has to be named `*.kts`.

Create the first script and give the file the name `first-script.kts`.
```
touch first-script.kts
```
Edit file and add some code:
```
println("Hello, it’s your first script called with args:")
args.forEach {
    println("* $it")
}
```
And run it with example arguments:
```
kotlinc -script first-script.kts test 'test with space'
```
You should see the result:
```
Hello, it’s your first script called with args:
* test
* test with space
```
Really simple! In addition, scripts can use Java or Kotlin stlib to have access to more powerful libraries.
Of course, functions and classes can be used to make the script more readable and easy to maintain.

```
import java.io.File

fun printDirs() {
    File(".").listFiles { file -> file.isDirectory }?.forEach {
        println(it)
    }
}

printDirs()
```

### Kotlin-main-kts
Kotlin-main-kts is a solution from the Kotlin team. The 1.3.70 version brought a set of improvements that
provide a better experience of using Kotlin scripts with IntelliJ IDEA and Kotlin command-line tools.
More details can be found in [a release blog post](https://blog.jetbrains.com/kotlin/2020/03/kotlin-1-3-70-released/).
All you need to use kotlin-main-kts is create a file with name `*.main.kts` and execute script.

Moreover, from 1.3.70 on, it is easier to run the program. Command is:

```
kotlin myscript.main.kts
```

Using kotlin-main-kts has a lot of advantages. `*.main.kts` scripts are supported out of the box in IntelliJ,
even outside the source directories. It gives you highlighting and navigation, autocomplete code
and resolves dynamic dependencies. What’s more, third party libraries can be used in scripts,
including them as dependencies using directives or annotations, and specified with gradle-style with group ID,
artifact ID and version. For example if you write a script which copies data from a CSV file and inserts the data
to a database you need to use a connector. You can achieve this by `@file:DependsOn` annotation. The example below shows
how to connect to a MongoDB database. A database _URL_ is required as an argument e.g. `mongodb://localhost:27017/test-db`

```
@file:Repository("https://jcenter.bintray.com")
@file:DependsOn("org.mongodb:mongo-java-driver:3.12.8")

import com.mongodb.client.MongoClients

fun createConnection(url: String) =
    MongoClients.create(url).use {
        println("Connected to MongoDB!")
    }

val (mongoUrl) = args
createConnection(mongoUrl)
```

### Kscript

Also, I have to mention [Kscript](https://github.com/holgerbrandl/kscript). It is one of the ways to support scripting in
Kotlin. Actually, it is a wrapper around kotlinc which adds some features. After Kscript installation you can easily run
script by command:
```
kscript first-script.kts
```

This tool was created in 2016. In the beginning, Kotlin wasn’t feature-rich enough to be a viable alternative to the
shell. [The great talk on Kotlin Conf by Holger Brandl](https://www.youtube.com/watch?v=cOJPKhlRa8c) shows the
history of its creation and explained that initially the tool was created for data science purposes.

The creators listed such advantages as:
* compiled script caching (using md5 checksums)
* dependency declarations using gradle-style resource locators and automatic dependency resolution
* possibility to deploy scripts as standalone binaries
* inlined usage - you don’t need to create script file

In my opinion, the cache mechanism is the biggest advantage of using Kscript tool. Whenever you run a script with kotlinc,
it is recompiled, which makes it slow. Each time the script is started, Kscripts checks if code has been modified since the last
compilation (by hashing the content of the script). If file wasn’t changed, cached version is immediately executed. The
table below shows time of execution the same script by ```kotlinc``` command and Kscript. As we can see the cache has a
positive effect on execution time.

| ```time kotlinc -script script.kts``` | ```time kscript script.kts``` |
|---------------------------------------|-------------------------------|
| 2.930s                                | 3.972s                        |
| 2.991s                                | 0.868s                        |
| 2.968s                                | 0.912s                        |


Kotlin v1.4 brought a much improved scripting integration. But until Kotlin scripting interpreter isn’t rich and
versatile, Kscript will be supported and developed.

### Conclusion
Kotlin makes scripting really easy. Powerful scripts can be created with the autocompletion and the strong typing which
makes them really readable and highly maintainable.
Happy scripting!
