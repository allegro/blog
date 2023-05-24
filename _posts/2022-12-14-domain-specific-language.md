---
layout: post
title: Domain Specific Language - hiding the Cloud in understandable terms
author: lukasz.rokita
tags: [python, dsl, cloud, gcp, iaac]
---

Domain Driven Design is a set of tools every developer and architect should get familiar with. Whether you decide on using all or none of them the practices broaden horizons and show other perspectives to consider. One of often overlooked is ubiquitious language. DDD assumes that everyone - from developers to product owners and clients share a common language. This language should be precise so that misunderstandings are not an issue, after all what we can talk about we can reason about.

This is the premise of Domain Specific Languages. They should precisely and concisely describe the specific domain in which they are useful. The examples are Gradle's build scripts, UnrealScript for writing Unreal Engine's code or Cucumber's testing scenarions.

In this post I'd like to show you how we try to hide underlying Cloud provider by using our own DSL.

## Extracting domain

People decide on a common vocabulary pretty early on. Leading theory is that children have a specialized parts of brain which are responsible for language learning. This leads to dialects and language evolution (see American and British English). This all happens pretty much unconciously. 

Harder part is comming to a language conciously. There is a scientific study thats called linguistics which deals with those kind of questions. Programmers are pretty good linguists on their own. They translate natural language to machine code. It doesn't seem that far fetched to translate natural language into an ubiquitious, domain language. 

This process starts with defining domain. Where are the boundaries of our language, what should be easy to reason about and what should be difficult. Then we need to see how people actually speak about the domain. This sample should be big but cohesive. Those people should be recipents of this language so it should feel natural to them. 

When you have a good feeling on what the language looks like you need to start model it. See how common sentences will look like and make sure that they are concise and natural. Users should have a natural feel as to what gets done under the hood. Be cautious not to overengineer the solution. This doesn't have to read like a book. Understandability and common vocabulary will go a long way. 

## DSL get down to brass tacks

templating vs AST manipulation


## Infrastructure DSL

Our DSL - middle ground
how does it work
why we like it

## Conclusion 
