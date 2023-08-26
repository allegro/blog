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

B-tree inventor can't be wrong. B-tree is sometimes confused with Binary Search Tree. The fact that nobody knows what
"B" means doesn't help. So, let's look at the difference based on the example below.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-basic.webp"
alt="Binary Search Tree with 3 nodes"
class="small-image"/>

The same numbers represented on B-tree:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/btree-basic.webp"
alt="B-tree with 2 nodes"
class="small-image"/>

Confusing, huh? In order to understand that we need to define the first feature of B-tree: pages.

## Page

You can treat B-tree page like a page in a book. Every page can contain the same amount of data (letters in this example).
A page may be only half full or empty (if you need to open another chapter).

For B-tree page it work exactly the same way. I assumed that my page size is 2. I cannot fit all 3 numbers on single page,
so I needed to open another one on the right.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/btree-page.webp"
alt="B-tree with 2 pages"
class="small-image"/>

## Summary

The end
