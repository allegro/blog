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
on its storage, which had 456KB. I'm writing this post on a MacBook with 512GB of storage, which would manage to store over
1,5 millions copies of this picture.

Apple I was revealed in 1976. 6 years after **B-tree** was invented (1970).

While no one use Apple I on daily basis, B-tree is still employed by majority of modern databases. Although average disk
size
is millions of times grater than in 1970, **B-tree** suits any disk size. Because of their great flexibility, **B-trees**
works consistently good on old Apple I as well as modern MacBook Pro.

Why is this data structure still relevant in modern systems? Is it going to be replaced at some point? Let's find out!

## Origins

> "the more you think about what the B in B-trees means, the better you understand B-trees." ~ Edward M. McCreight
> according to [wikipedia.org](https://en.wikipedia.org/wiki/B-tree)

B-tree is sometimes confused with **Binary Search Tree (BST)**. The truth is that even its inventors don't know what B is supposed
to mean. Anyway, BST is a great start point in order to reinvent B-tree. Let's start with a simple
example of BST:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-basic.webp"
alt="Binary Search Tree with 3 nodes"
class="small-image"/>

The greater number goes to the right, the lower to the left. It may become more clear, if we add more numbers:

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-bigger.webp"
alt="Binary Search Tree with 7 nodes"/>

This tree contains 7 numbers, but we need to visit at most 3 nodes, to find any number.
The following example visualize searching for 14. We need "3 hops" for such action. I used SQL to define the query, let's
trat this tree as our actual database index.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/bst-bigger-searching.webp"
alt="Searching for single node within Binary Search Tree with 7 nodes"
class="small-image"/>

## Hardware

In theory, using Binary Search Tree for running our queries looks fine. However, in practice, this data structure needs to
work on actual hardware. An index needs to be stored somewhere in the computer. In general, there are 3 places where we may store the data:

- CPU caches
- RAM (memory)
- Disk (storage)

The cache is managed fully by CPUs. Moreover, it is relatively small, usually has a few megabytes.

The memory/RAM is vastly used by databases. It assures fast random access and its size may be pretty big.
AWS RDS cloud service [provides instances](https://aws.amazon.com/rds/instance-types/) with a few terabytes of memory available.
Cons? It is not persistent - you lose the data when power is off. Moreover, the cost may be relatively high.

The cons of a memory are the pros of a disk storage. It's cheap and data will remain there even if we lose the power.
However, there are no free lunches! The catch is that we need to be careful about random and sequential access.
Reading from the disk is fast, but only under certain conditions! I'll try to explain them simply.

### Random and sequential access

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/random-sequential-access.webp"
alt="Random and sequential access visualized on a small chunk of a memory"
class="small-image"/>

Memory may be visualized as a line of containers for values, every container is numbered. There are two task to perform:
1. Read the values from container 3, 4 and 5.
2. Read the values from container 1, 4 and 6.

Hard Disk Drive consists of the head and the disk. When performing task no. 1, you only need to move the head to container 3 and spin the disk in order to read 3 consecutive values.
This is called sequential access, reading a bunch of values located next to each other.
Task no. 2 is more challenging for an HDD. The head needs to be moved three times to different locations. This is random access!
When reading megabytes of data, the difference between these two types of access is enormous.

<img src="/img/articles/2023-08-25-how-does-btree-make-your-queries-fast/hdd-disk.webp"
alt="Hard Disk Drive with cover removed, Public Domain image
from https://en.wikipedia.org/wiki/Hard_disk_drive#/media/File:Laptop-hard-drive-exposed.jpg"
class="small-image"/>

### Benchmarks

## Summary

The end
