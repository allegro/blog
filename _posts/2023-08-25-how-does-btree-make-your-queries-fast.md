---
layout: post
title: How does B-tree make your queries fast
author: mateusz.kuzmik
tags: [ tech ]
---

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/apple-i.webp"
alt="Original 1976 Apple I computer in a briefcase, Public Domain image
from https://upload.wikimedia.org/wikipedia/commons/6/68/Original_1976_Apple_1_Computer_In_A_Briefcase.JPG"
class="small-image"/>

On the picture above, you see an Apple first commercial computer. This picture's size is 331kB, so it would barely fit
on its
storage, which had 456KB. I'm writing this post on a MacBook with 512GB of storage, which would manage to store over
1,5 millions copies of this picture.

Apple I was revealed in 1976. 6 years after **B-tree** was invented (1970).

While no one use Apple I on daily basis, B-tree is still employed by majority of modern databases. Although average disk
size
is millions of times grater than in 1970, **B-tree** suits any disk size.

Why is this data structure still relevant in modern systems? Is it going to be replaced at some point? Let's find out!

## Origins

> "the more you think about what the B in B-trees means, the better you understand B-trees." ~ Edward M. McCreight
> according to [wikipedia.org](https://en.wikipedia.org/wiki/B-tree)

B-tree inventor can't be wrong. B-tree is sometimes confused with Binary Search Tree (BST). The fact that nobody knows what
"B" means doesn't help. Anyway, BST is a great start point in order to reinvent B-tree. Let's start with a simple example of BST:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-basic.webp"
alt="Binary Search Tree with 3 nodes"
class="small-image"/>

The greater number goes to the right, the lower to the left. It may become more clear, if we add more numbers:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-bigger.webp"
alt="Binary Search Tree with 7 nodes"
class="small-image"/>

This tree already does its job. It contains 7 numbers, but we need to visit at most 3 nodes, to find any number.
The following example visualize searching for 14. We need "3 hops" for such action.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-bigger-searching.webp"
alt="Searching for single node within Binary Search Tree with 7 nodes"
class="small-image"/>

## Pages

TODO:
- disk - random access vs sequential
- keeping multiple values in single place on disk is more optimal
- fixed size pages

## Summary

The end
