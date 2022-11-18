layout:
post                                                                                                                                                                               
title: "Onion Architecture - The most tasteful Software Architecture
Style"                                                                                                                   
author: [tomasz.tarczynski]                                                                                                                                                                 
tags: [tech, architecture, software, engineering]                                                                                                                                                           
excerpt: >
    Software Architecture is an elusive thing which, if neglected, can lead to a hard to develop and maintain codebase, and 
    in more drastic circumstances to the failure of a product. This article discuses one of the backend application architecture styles which proved to be - from the author's perspective - 
    successful in providing a good foundation for building and maintaining an application in the long run: Onion Architecture.
--- 
# Onion Architecture - The most tasteful Software Architecture Style
**TODO ilustracja ze zdjęciem cebularza i opisem, że to lubelski produkt regionalny.**

Onion Architecture is a software architectural style which strongly promotes the separation of concerns between the most important part of a business
application - the domain code - and its technical aspects like HTTP or database. It does so with ideas similar to [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) 
(more on that comparison later), but reuses the concept of layers, which, from my experience, enhance the readability and maintainability of the codebase. Additional
complexity to the build setup and extra learning curve introduced by the layered approach, pays back during the development. It reduces cognitive load on the
programmer by giving a more concrete structural foundation and guidance.
## The text
An issue I have with many architecture-related tech articles is that they are usually high-level, and don’t give code examples. So after an introductory
description I’ll try to illustrate the concepts with concrete code examples. If you want to jump straight into the code, do make sure to check out the GitHub
repository with a runnable example. TODO link
## Why does Software Architecture matter?
During my Engineering career I’ve worked on multiple projects using different architecture styles. From a happy-go-lucky approach without any obvious structure,
through “classic”[^1] three-tier enterprise style, to highly structured architecture, reflected by the setup of the build tool and supported by the compiler.

The experience of working in those projects was also very different. Having to introduce a change in a shapeless blob of spaghetti code was always a painful
experience, connected with stressful moments of *Have I broken something?* Or *Oh no! A gazillion of unrelated tests broke…*

On the other hand, working in a more rigid, but at the same time more expressive, and structured environment of well-architected application, was a breeze and a
real pleasure. Not to mention that the time required to introduce the change was smaller, and the estimates more precise and predictable.

Good architecture guides the implementation, makes it easy to introduce new changes, andm to some degree prevents, less experienced team members from making doubtful decisions.
It allows developers to focus on the value-providing implementation rather than thinking *Hmm where should I put this class?*.

Last but not least, software architecture is often defined as *the things that are hard to change*, so choosing a proper architectural approach to your new application is of key
importance on its future development and maintenance.
## About the Onion
The idea, firstly introduced by Jeffrey Palermo in a [series of articles](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/), and recently reiterated in 
Robert “Uncle Bob” Martin’s book [Clean Architecture](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) is similar to Hexagonal / Ports and Adapters approach on architecture. The core concept in both styles is the same - to make the domain the most central part of the application, and remove infrastructure concerns (such as talking via HTTP, messaging, database mapping, testing, etc.) away from it. The core of the business logic should be free (in theory at least) from any of the technical, and framework-related problems, allowing for easy testing and rapid development.

The main difference between Hexagonal Architecture and Onion Architecture lies mostly in the overall, more structured approach to the code layout of the latter.
Both styles rely on conscious usage of interfaces, the [Dependency Inversion Principle](https://web.archive.org/web/20041221102842/http://www.objectmentor.com/resources/articles/dip.pdf)[^2], and encapsulation, but the Onion, like the real vegetable, has layers, which guide an implementation and give more clear structure to the codebase.

This Architecture style does have some learning curve for developers on the project, but once mastered, pays back many times. Finally, as with every solution in
the IT industry, it is not a one-size-fits-all, and you should always consider if the architecture style matches your needs.
## The Onion has Layers
Onion Architecture is a form of layered architecture. The main difference between “the classic” three-tier architecture and the Onion, is that every outer layer
sees classes from all inner layers, not only the one directly below. Moreover, the dependency direction always goes from outside to the inside, never the other way
around.

But wait, what are the layers of Onion Architecture, what they describe, and why they matter?

There are three[^3] main layers in Onion Architecture:
- The domain layer
- The application layer
- The infrastructure layer
each of which has its responsibilities.

TODO: obrazek z trzema kółkami

### The Domain Layer
This is the layer that you place your classes describing the core of your business.

Let’s use a simple example. An application written to help manage a Library would most probably have classes like Book, Reader, Copy and so on. The classes, relations
and interactions between them describe the core of the domain of the application, i.e. what business needs it fulfils and in what way. In the Library there
would be a process of adding new titles to the catalogue, a process of borrowing and returning copies of a book, charging readers for overdue books, and
many more.

TODO przykład klasy domenowej w Javie

Since the domain changes the most - here is the place where you put all the new features, and business requirements - it should be as easy as possible to
modify. Thus, it should not be concerned which database is used in the project, nor should it know which communication style, synchronous RPC calls,
asynchronous messaging, or a mix of is used to trigger the logic or maybe that it’s triggered by unit tests and not real user interactions.
### The Application Layer
This is the layer where you place your application services. The services describe the use cases of the application and coordinate the work of the domain
classes. For example, we can imagine that adding a new title to the book catalogue would involve checking if the title does not yet exist, validating that all
the necessary data is present, and finally calling a repository to save the new catalogue entry.

The code describing such a use case can look like this:
TODO przykład w Javie

This is also the layer that “knows” which operations should be performed atomically, thus usually the transaction-related code is placed here. The same goes for
security aspects - this layer should check if the user has appropriate rights and privileges to perform the action.

TODO przykład w Javie
### The Infrastructure Layer
This layer, the outermost layer of our Onion, is a place where all framework, and technology related stuff goes. It tends to be the most "thick", since it
contains the implementations of the interfaces defined in the more inner layers. Need an HTTP controller, a message listener or database adapter (an implementation of repository interface
defined at domain layer) - infrastructure is the place to go.

The domain, although the most important part of the application, tends to be also the smallest in terms of code size. The reverse is true about the infrastructre code - all the supporting
mechanisms, which are placed at the infrastructure layer, are the backbone which animates the domain behaviour, and as such that part of the service should not be neglected. 
## Wait! What about context?
It happens quite often that a domain logic requires a more broad context to make a decistion, than that of a single class, effectively requiring an access to the database. If the
domain layer does not have such an access, nor the application layer, how can that need be fulfilled? Fear not, Dependency Inversion Principle to the rescue.

Say, when borrowing a book, the age of the reader has to be verified, and the loan rejected if the reader is below a certain threshold defined by the Library policy
for the given book category. Here’s how it can be coded.

TODO: przykład z polityką

The BookCopy class can have a borrowBy method taking two parameters: a ReaderId and BookBorrowingPolicy. The second argument is a class with a single method:
isSatisfiedBy(readerId, bookId). The implementation of the class takes a ReaderRepository interface as constructor parameter - the interface is defined in the
domain layer, but its implementation lies in the infrastructure. Thus the domain operates on the high level of abstraction leaving the underlying details of
talking to a DB, converting from Mongo or MySQL entities into the domain classes to infrastructure. Only the business is what it does.

Looking it at an more abstract level, define the desired behaviour at the domain level using interfaces, but flesh it out with an implementation on the infra level.
## The Flavours of The Onion or how to represent layers in code?
There are two basic approaches to representing the layers in the code. The one that we have used in our most recent project was to use package naming
convention.

TODO obrazek z pakietami

Every domain package has three subpackages: domain, application and infrastructure. This method is clear, easy to understand and navigate, and does not require
changes to the build tool setup. The downside is that, except for the agreed convention, and Code Review process to check them, there is no mechanism preventing
you from using a class defined in the application layer in the domain layer, thus breaking the direction of the dependencies. One can always use such tools like
ArchUnit [TODO link] to write tests checking if there are no "prohibited" imports, but in my opinion this is not the best way to go, as this is an extra tool that needs to be 
maintained.

TODO przykład kodu no-no
### Build tools to the rescue
The more involved approach is to define compilation modules representing the layers. The con of this approach is a more complicated build structure and setup of
your build tool of choice. On the flip side though, having the compiler on your side is very helpful, and prevents the above mentioned issue. The direction of
the dependencies between layers is clearly defined in the module build files.

TODO przykład dla Gradle

Using Gradle setup as an example, one can define three modules - domain, application, and infrastructure - in `settings.gradle` file. Than in build files corresponding to each of the modules, daclare its dependencies, clearly defining the direction of dependencies. 

TODO przykład dla Gradle.

Notice, that the biggest file is the one for instractuture layer. It should not be a supprise by now. The infrastructure has all of the framework - in this case Spring Boot - database driver, and other dependencies, and depends on both domain and application. There's of course nothing preventing you from declaring extra dependencies, say Lombok, in the domain build file, but the most important thing to note is with that build setup it will not be possible 

## Final Thoughts
- The Problems The Onion solves
-- More structured, layered layout of the code makes code navigation easier, and makes the relationship between different parts of the codebase more visible at
first glance
-- Loose coupling between the domain and the infrastructure
-- Coupling is towards the centre of The Onion - expressed by the relationship between the layers
-- (Usually) No coupling between the domain and the infrastructure concerns of the application
-- Build tool support in enforcing layers
- The Problems The Onion creates
-- Additional learning curve for new developers, and those used to other architecture styles
-- Increased overall complexity of the codebase - especially with the flavour utilising the modularizing capabilities of build tools such as Gradle or Maven.
-- Not everyone likes the smell of it.
## Final-Final Thoughts
As mentioned above at the beginning of the article, Onion Architecture is not a one-size-fits all solution. It has its learning curve and is best suited for
services with a clear domain definition. This makes it a bad choice, for more technical-oriented services, e.g. a high-throughput proxy written in a reactive
framework.

### Footnotes
[^1]: The typical, “classic” enterprise architecture, usually consists of three layers: the presentation layer, the domain layer and the persistence (data) layer. The dependency direction goes top down, and in the strict approach a layer sees only its nearest neighbour. The clear advantage is the separation of concerns, and the reduction of the scope of responsibilities of each layer. There are two issues though - that architecture style often leads to a so-called anemic domain model, since most of the business logic is placed in service classes, because, and that’s the second issue domain classes depend on the persistence layer - and often become only data carriers without behaviour. For further reading see: M. Fowler, PresentationDomainDataLayering, M. Fowler, Anemic Domain Model. For comparison of different software architecture styles, see Software Architecture Patterns (e-book, pdf)
[^2]: The term has been popularised by Robert C. Martin, and describes an approach to code design based on two premises: a) High-level modules should not import anything from low-level modules. Both should depend on abstractions (e.g., interfaces). b) Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions. See linked article for detailed explanation.
[^3]: The number of layers may differ. The three-tier division is usually sometimes called Simplified Onion Architecture. Another possible rendition of the division is to have five layers with a separate Repository layer above the domain and service layer above the repositories. I find that division to be a step towards overengineering, and found that the 3-layered approach strikes the best balance.
