---
layout: post
title: How does B-tree make your queries fast
author: mateusz.kuzmik
tags: [ tech ]
---

**B-tree** is a structure that helps to search through a great amounts of data. It was invented over 40 years ago and
yet, it is still employed by majority of modern databases. Although there are newer index structures, like LSM trees,
**B-tree** is unbeaten when handling most of the database queries.

After reading this post, you will know how **B-tree** organizes the data and how it performs search queries.

## Origins

In order to understand **B-tree** lets focus on **Binary Search Tree (BST)** first.

Wait, it's not the same?

What does "B" mean then?

According to [wikipedia.org](https://en.wikipedia.org/wiki/B-tree), Edward M. McCreight, the inventor of B-tree once
said:

> "the more you think about what the B in B-trees means, the better you understand B-trees."

Confusing **B-tree** with **BST** is really common misconception.
Anyway, in my opinion, BST is a great start point in order to reinvent B-tree.
Let's start with a simple example of BST:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-basic.webp"
alt="Binary Search Tree with three nodes"
class="small-image"/>

The greater number is always on the right, the lower on the left. It may become clearer if we add more numbers:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-bigger.webp"
alt="Binary Search Tree with seven nodes"
class="small-image"/>

This tree contains seven numbers, but we need to visit at most three nodes to find any number.
The following example visualizes searching for 14. We need "3 hops" for such action.
I used SQL to define the query, in order to think about this tree as if it was an actual database index.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-bigger-searching.webp"
alt="Searching for single node within Binary Search Tree with seven nodes"
class="small-image"/>

## Hardware

In theory, using Binary Search Tree for running our queries looks fine. Its time complexity (when searching) is $$ O(log
n) $$, same as B-tree. However, in practice, this data structure needs to work on actual hardware. An index needs to be
stored somewhere in the computer.

The Computer has three places where the data may be stored:

- CPU caches
- RAM (memory)
- Disk (storage)

The cache is managed fully by CPUs. Moreover, it is relatively small, usually has a few megabytes.

The memory/RAM is vastly used by databases. It has several great advantages:

- assures fast random access (you will read more about that in the next paragraph)
- its size may be pretty big (AWS RDS cloud service [provides instances](https://aws.amazon.com/rds/instance-types/)
  with a few terabytes of memory available).

Cons? You lose the data when the power supply is off. Moreover, it is pretty expensive (compared to the disk).

Finally, the cons of a memory are the pros of a disk storage.
It's cheap and data will remain there even if we lose the power.
However, there are no free lunches!
The catch is that we need to be careful about random and sequential access.
Reading from the disk is fast, but only under certain conditions!
I'll try to explain them simply.

### Random and sequential access

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/random-sequential-access.webp"
alt="Random and sequential access visualized on a small chunk of a memory"
class="small-image"/>

Memory may be visualized as a line of containers for values, every container is numbered. There are two task to perform:

1. Read the values from container 3, 4 and 5.
2. Read the values from container 1, 4 and 6.

Hard Disk Drive consists of the head and the disk. When performing task no. 1, you only need to move the head to
container 3 and spin the disk in order to read 3 consecutive values.
This is called sequential access, reading a bunch of values located next to each other.
Task no. 2 is more challenging for an HDD. The head needs to be moved three times to different locations. This is random
access!
When reading megabytes of data, the difference between these two types of access is enormous.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/hdd-disk.webp"
alt="Hard Disk Drive with cover removed, Public Domain image
from https://en.wikipedia.org/wiki/Hard_disk_drive#/media/File:Laptop-hard-drive-exposed.jpg"
class="small-image"/>

Differences in speed between random and sequential access were researched in the article "The Pathologies of Big Data"
by Adam Jacobs, [published in Acm Queue](https://queue.acm.org/detail.cfm?id=1563874).
It revealed a few mind-blowing facts:

- Sequential access on HDD may be hundreds of a thousand times faster than random access. 🤯
- It may be faster to read sequentially from the disk than randomly from the memory.

This research also shows that reading fully sequentially from HDD may be faster than SSD.
However, please note that the article is from 2009 and SSD developed significantly through the last decade.
These results are probably outdated.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/random-vs-sequential-benchmark.webp"
alt="A graph visualizing difference between random and sequential access in memory, SDD and HDD, Benchmark
from https://queue.acm.org/detail.cfm?id=1563874"
class="small-image"/>

The key takeaway is to prefer sequential access wherever we can. Let's think of how to apply it to our index structure.

## Optimizing tree for sequential access

Binary Search Tree may be represented in memory in the same way
as [the heap](https://en.wikipedia.org/wiki/Binary_heap):

- parent node position is $$ i $$
- left node position is $$ 2i $$
- right node position is $$ 2i+1 $$

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-searching-with-memory.webp"
alt="Searching in Binary Search Tree with memory visualization"
class="small-image"/>

When performing the exactly same query as before, memory addresses 0, 2 and 5 need to be visited.
Visiting three nodes is not a problem, but as we store more data, the tree gets higher. Storing more than 1 million
values requires a tree of height at least 20. It means that 20 values from different places in memory must be read. It
gives us completely random access!

### Pages

While tree grows in height, random access is causing more and more delay. The solution for reducing this problem is
simple - grow the tree in width rather than in height. It may be achieved with packing more than one value in a single
node. For our

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/tree-with-3-values-in-node.webp"
alt="A tree with 3 values in single node"
class="small-image"/>

It brings us following benefits:

- tree is shallower (2 levels instead of 3)
- it still has a lot of space for new values without growing further

The query performed on such index looks like that:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/tree-with-3-values-query.webp"
alt="A query performed on a tree with 3 values in single node"
class="small-image"/>

Please note that every time we visit some node, we need to load all its values. In this example we need to load 4
values (or 6 if the tree was full) in order to reach the one we are looking for. Below you may find a visualization of
this tree in a memory:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/tree-with-3-values-memory.webp"
alt="A tree with 3 values in single node represented in a memory"
class="small-image"/>

Compared to [the previous example](#optimizing-tree-for-sequential-access), this search should be faster. We need random
access only twice (jump to cell 0 and 9) and read sequentially the rest of values.

This solution works better and better, as our database grows. If you store more than 1 million values:

- Binary Search Tree has 20 levels
- 3-values node Tree has 10 levels

If you go with a tree that has 9 values in a single node, 6 levels are enough to handle 1 million of values.

Postgres page size is 8kB. Let's assume that 20% is for metadata, so it's 6kB left. Half of the page is needed to store
pointers to node's children, so it gives us 3kB for values. BIGINT size is 8 bytes, thus we may store ~375 values in a
single node. It may store **1 billion** values with a tree that has only 4 levels. Binary Search Tree would require 30
levels for such amount of data.

To sum up, placing multiple values in a single node of the three helped us to reduce its height, thus using benefits of
sequential access.

## Balancing

In databases, we may distinguish two types of operations: writing and reading. In the previous section, we addressed the
problems with reading the data from the B-tree. Nonetheless, writing is also a crucial part. When writing the data to
database, b-tree needs to be constantly updated with new values.

The tree shape depends on the order of values added to the tree. It's easily visible on a binary tree. We may obtain
trees
with different depths if the values are added in incorrect order.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-imbalance.webp"
alt="Two Binary Trees with shapes depending on the order of inserted values."
class="small-image"/>

When the tree has different depths on different nodes it is called an unbalanced tree. There are basically two ways of
returning such tree to balanced state:

1. Rebuilding it from the very beginning. Just by adding the values in correct order.
2. Keeping it balanced all the time, as the new values are added.

B-tree implement the second option. A feature, which makes the tree balanced all the time is called self-balancing.

### Self-balancing algorithm

We start with adding new values until there is a free space in existing nodes. We start with one node.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/self-balancing-step-1.webp"
alt="Self-balancing, step 1, Add new values until there is a free space in existing nodes."
class="small-image"/>

If there is no space in the corresponding page, split it into two pages. Generate a new root page and move the value
from the middle there.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/self-balancing-step-2.webp"
alt="Self-balancing, step 2, Splitting the page and generating a new root page."
class="small-image"/>

Then again, add the values until there is a free space for them. If we try to add the value to the page, which has no
free space, we make a split. The middle value goes to the upper page.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/self-balancing-step-3.webp"
alt="Self-balancing, step 3, Splitting the page and moving the middle value to the upper page."
class="small-image"/>

Following this algorithm, we add new values until there is no space in root page!

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/self-balancing-step-4.webp"
alt="Self-balancing, step 4, Adding next values until there is no space in root."
class="small-image"/>

In this situation, there is no space in the root. But the only thing we need to do is to repeat Step 2 - generating a
new root!

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/self-balancing-step-5.webp"
alt="Self-balancing, step 5, Generating a new tree level."
class="small-image"/>

> **_NOTE:_**  On this point you may have a valid concern that there is a lot of free space that has no chance to be
> filled. For example the page with 14. 15 and 16 are in different pages, so this page will remain with only one value
> and
> two free spaces forever.
>
> It was caused because of the split location choice. We split the page always in the middle. But every time we do a
> split, we may choose any split location we want.
>
> Postgres has the algorithm, which is run every time a split is performed! Its implementation may be
> found
>
in [_bt_findsplitloc() function in Postgres source code](https://github.com/postgres/postgres/blob/54ccfd65868c013a8c6906bc894bc5ea3640740a/src/backend/access/nbtree/nbtsplitloc.c#L87).
> Its goal it to leave as little free space as possible.

## Summary

The end
