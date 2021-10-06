---
layout: post
title: "How did we refactor the search UI component?"
author: [volodymyr.khytskyi]
tags: [tech, frontend, architecture, refactoring, developmentexperience, typescript]
---
This article describes a classic case of refactoring a search form UI component, a critical part of every e-commerce platform. In it I’ll explain the precursor for change, analysis process, as well as, aspects to pay attention to and principles to apply while designing a new solution. If you find yourself in a similar situation or just curious to learn more about frontend internals at Allegro, you might learn a thing or two from the article. Sounds interesting? Hop on!

## How does the search form function at Allegro?

For starters, so that we all are on the same page, let me briefly explain how search form at Allegro works and which functionalities it is responsible for. Under the hood, it is one of our many [OpBox](https://blog.allegro.tech/2016/03/Managing-Frontend-in-the-microservices-architecture.html) components and the technical name of this one is opbox-search.

From UI standpoint it consists of four parts:

* Input
* Scope selector
* Submit button
* Dropdown with list of suggestions

Functionality-wise, whenever a user clicks/taps into the input or types a search phrase, a dropdown with a list of suggestions shows up and the user can navigate through it by using keyboard/mouse/touchscreen. Suggestion list itself, at most, consists of two sections: phrases searched in the past and popular/matching suggestions. Those are fetched in real time as the user interacts with the form. Additionally, there is also a preconfigured option to search the phrase in products’ descriptions.

The form also provides a possibility to narrow down the search scope whether it is a particular department, a certain user, a charity organization, etc. Depending on the selected scope, when the user clicks the submission button, one is redirected to an appropriate product/user/charity listing page and a search phrase is sent as a URL query parameter.

At this point you might be wondering: sounds quite easy, how come you messed up with such a simple component?

## A bit of history & precursor for refactoring

The initial commit took place back in 2017 and up until the point of refactoring it, there were 2292 commits spread across 189 pull requests merged to the main branch. All those contributions were made by different independent teams. Throughout time the component evolved, some external APIs have changed, some features became deprecated and new ones were added. At one point it also changed its ownership to another development team. As expected, all those factors left some marks on the codebase.

One of ample examples of troublesome condition was the Store entity that is responsible for handling the runtime state. In reality, besides doing its primary function it also handles network calls and contains non-relevant pieces of business logic of search scoping and suggestions listing.

To make matters worse, the internals of the entity are publicly exposed and therefore any dependent is free to manipulate the store in a random manner. Not hard to imagine, using such “shortcuts” lead to degradation of codebase readability and maintainability.

At one point in time it reached its critical mass and we started considering the cost of maintaining the existing codebase vs. the cost of redeveloping it from scratch.

## Refactoring expectations

Refactoring itself doesn’t provide any business value, instead it is an investment that should save engineers’ time and effort. That is why the primary goals were to:

* gain back the confidence in further development of the component by:

  * streamlining the maintenance of existing features
  * streamlining and simplifying the development of new business features
  * using tools, design patterns and principles to help an engineer to develop stable and correctly functioning features

* and, hence, shortening the delivery time
* additionally from architectural standpoint, we want new solution to be resilient to multiple future contributions from different teams

## Into technical analysis

So by this point we learned what functional requirements are and identified the issues we have with the current solution. We also outlined refactoring expectations, hence we can start laying down the conceptual foundation of a new solution. We could start by asking ourselves a few questions that could help us formalize our technical end goals.

## What issues do we want to avoid this time? What do we want a new solution to improve upon?

Going back to the Store example, we clearly don’t want to allow any dependent to mutate its data in any random way nor do we want the Store to contain pieces of logic that are not of its concern, like networking. Instead we want to move those irrelevant pieces into more suitable locations, decrease entanglement of different parts of the codebase, structure it into logical entities that are more human readable, draw boundaries between those entities, define rules of communication and make sure we expose to the public API only what we were intended to.

## What development principles and design patterns could we incorporate?

### The single-responsibility principle (SRP)

The “S” of the “SOLID” acronym. As name hints, a class (or a unit of code) should be responsible only for a single piece of functionality. Simple and powerful principle, but quite often it is overlooked. Say, if we build a wrapping logic around an input HTML element, its only responsibility is to tightly interact with the element, e.g. listen to DOM events of interest and update its value if needed.

### The separation of concerns principle (SoC)

SoC goes well in pair with SRP and states that one should not place functionalities of different domains under the same logical entity. For example, we need to render a piece of information on the screen but beforehand the information needs to be fetched over the network. Since view and network layers have different concerns we don’t want to place both of them under a single logical entity. Let those be two entities with established dependency relation of one another via a public API.

### The loose coupling principle

Loose coupling means that a single logical entity knows as little as possible about other entities and communication between them follows strict rules. One important characteristic we want to achieve here is to minimize negative effects on application’s runtime in case an entity malfunctions.

### Event-driven dataflow

Since we are dealing with the UI component that has several moving parts, applying event-driven techniques comes in handy because of its asynchronous nature and because messaging channels are subscription based.

### What development constraints (if any) do we intentionally want to introduce?

We want the architecture of the new solution to follow a certain set of rules in order to maintain its structure. We also want to make it harder for engineers to break those rules. In the short term it might be a drawback but we are interested in keeping the codebase well maintained in the long run. By carefully designing the APIs and applying static type analysis we are not only able to meet the requirement but also lift some complexity from engineers’ shoulders and that is where TypeScript shines brightly.

## Applying all of the above in a new store solution

With all the above conclusions, we can start the actual work and start it from the core, which is the store entity. As with any store solutions, let us enlist functional characteristics that one should provide:

* Store should hold current runtime state
* Store should be initialized with a default state
* Store should provide a public API that allows dependents to update its state in runtime in a _controlled way_
* Store should expose information channels to propagate the state change to every subscriber
* Store should not expose any implementation details

Defining a structure of the store’s data is as simple as declaring a TypeScript interface, but we need to be able to expose information that the state has mutated in a particular way. That is, we need to build event driven communication between the store and its dependents. For that purpose we can use an event emitter and define as many topics as needed. In our case, having a dedicated topic per state property turned out to work perfectly as we don’t have that many properties in the first place. And because we want to have the state and event emitter under the same umbrella, we encapsulate them into the following class declaration:

```ts
interface State {
  foo: boolean;
  bar: string;
  // ...
}

type Topic = {
  [K in Capitalize<keyof State>]: Uncapitalize<K>;
}

class Store {
  constructor(
    private state: State,
    private readonly emitter: Emitter<Record<
       keyof State,
       (state: State) => void
    >>,
  ) {}

  public on(...args) { return this.emitter.on(...args);
}
```

The last piece of a puzzle is that we need to automate event emission triggering. At the same time, we want to minimize the size of a boilerplate code needed to set up this behavior for each state property. Since every property has a corresponding topic, that is where we were able to leverage the power of JavaScript’s accessor descriptor and within a setter we can trigger the emission:

```ts
Object
  .values(Topic)
  .forEach(key => Object.defineProperty(Store.prototype, key, {
    get() {
      return this.state[key];
    },
    set(value) {
      this.state = { ...this.state, [key]: value };
      this.emitter.emit(key, this.state);
    }
  }));
```

After putting it all together, not only we achieved above-mentioned characteristics but also working with the store becomes as simple as:

```ts
store.foo = true;
store.on(Topic.Foo, (state: State) => ...);
```

At this point the store is ready and we would like to test how well the solution performs on a battlefield.

## Event-driven communication between the store and UI parts

Now we can focus on developing UI parts of our component. Luckily, business requirements provide enough hints where to place each piece of functionality. Let’s take a look at how we shaped search input and suggestion list, and how those UI parts cooperate with each other and the store.

Recall that functionality-wise suggestion list is a dropdown that should be rendered whenever a user types a search phrase or clicks/taps into the input element. We also need to fetch best matching suggestions whenever input value changes.

We are going to start with a search input as it doesn’t have any dependencies besides the store. With functional requirements in mind, we want it to be good at doing just two things and those are:

* Proxying DOM events such as focus, blur, click, keydown, etc.
* Notifying the store whenever input value changes

Since updating the store is pretty much straightforward, let’s take a look at how we handle DOM events. Such events as `click`, `focus`, `blur` convey the fact that there was some sort of interaction with the input HTML element. Unlike `input` event, where one is interested in knowing what current value is, the above-mentioned ones don’t include any related information. We only need to be able to communicate to dependents the fact that such an event took place and that is why, similarly to store, search input has an event emitter of its own. Now, you might be thinking: why would you want to have multiple sources of information given you already have the event driven store solution? There are couple of reasons:

* Because those DOM events don’t contain additional information, there is nothing we need to put into our store. It aligns well with single-responsibility principle, according to which store only fulfills its primary function and has no hint of existence of search input
* By bypassing the store we shortened an event message travel distance from a source to a subscriber
* It also aligns well with mental model, where if one wants to react to an event that happened in search input, one subscribes to its publicly available communication channels

The gist of this approach and binding with the store can be achieved in just a few lines of code. Here we add several DOM event listeners and, depending on a event type, decide whether we need to proxy them into the event emitter or update the store’s state:

```ts
class SearchInput {
  constructor(
    private readonly inputNode: HTMLInputElement,
    private store: Store,
    public readonly emitter: Emitter<Record<
      'click' | 'focus' | 'blur',
      () => void,
    >>,
  ) {
    inputNode.addEventListener('click', () => emitter.emit('click'));
    inputNode.addEventListener('focus', () => emitter.emit('focus'));
    inputNode.addEventListener('blur', () => emitter.emit('blur'));
    inputNode.addEventListener('input', ({ currentTarget: { value }}) => store.input = value);
  }
  // ...
}
```

Now, we can focus our attention on a suggestions list. Communication-wise all it needs to do is to subscribe to several topics, provided by the store and the search input:

```ts
import { fetchSuggestions } from './network';

class SuggestionsList {
  constructor(
    private store: Store,
    private readonly searchInput: SearchInput,
    // ...
  ) {
    searchInput.emitter.on('click', () => this.renderVisible());
    searchInput.emitter.on('focus', () => this.renderVisible());
    searchInput.emitter.on('blur', () => this.renderHidden());
    store.on('input', () => this.fetchItemsList());
    store.on('suggestionsListData', () => {
      this.renderItemsList();
      this.renderVisible();
    });
  }

  private async fetchItemsList() {
    this.store.suggesiontsListData = await fetchSuggestions(this.store.input);
  }
  // ...
}
```

When a `click` or `focus` event message arrives from search input, `SuggestionsList` renders a dropdown UI element. Opposite to that, `blur` event occurrence hides it. A change of input value in the store leads to fetching suggestions over the network and lastly, whenever suggestions data is available, `SuggestionsList` renders the item list and makes the dropdown visible.

Note that because we apply the separation of concerns principle, the `fetchItemsList` method only delegates a job to an external dependency that is responsible for network communication. Upon successful response, SuggestionsList doesn’t immediately start rendering the data, instead the data is put into the store and SuggestionList listens to that data change. With a such data circulation we ensure that:

* Store is a single source of truth (and data)
* Suggestions’ data is propagated to every dependent
* We avoid possible redundant rendering cycles

With that, our functional requirement is implemented.

## The final solution

Reapplying the above principles and techniques to develop the remaining functional requirements, we ended up with a solution that can be illustrated as following:

<img src="/img/articles/2021-08-17-refactoring-opbox-search/architecture-diagram.png" alt="Architecture Diagram" style="max-width: 600px;">

Were we able to meet our expectations? At the end of the day, after careful problem analysis, testing out POCs and development preparations, the implementation process itself went quite smoothly. Multiple people participated in it and we are quite satisfied with the end result. Will it withstand future challenges? Only time will tell.

## Summary

At Allegro we value our customer experience and that is why we pay a lot of attention to performance of our frontend solutions. At the same time, as software engineers, we want to stay productive and, therefore, we also pay attention to our development experience. Achieving good results from both worlds is where the challenge comes in. In this article I explained what development issues we had with opbox-search component and what goals did we want to achieve after refactoring. I described the analysis and implementation process, and presented the final result.
