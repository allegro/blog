---
layout: post
title: "Probabilistic Data Structures and Algorithms in NoSQL databases"
author: [michal.knasiecki]
tags: [tech, performance, NoSQL]
excerpt: >
    What would you say if we stored 1&nbsp;000 records in a database, and the database claimed that there were only 998 of them?
    Or, if we created a database storing sets of values and in some cases the database would claim that some
    element was in that set, while in fact it was not? It definitely must be a bug, right?
    It turns out such behavior is not necessarily an error, as long as we use a database that implements probabilistic algorithms and data structures.
    In this post we will learn about two probability-based techniques, perform some experiments and
    consider when it is worth using a database that lies to us a bit.
---

One of the [four fundamental](https://en.wikipedia.org/wiki/ACID) features of transactional databases is durability. It says that once a
transaction is committed, the stored data remains available even if the database crashes. If we upload some information
into the database, we must be able to read it later, no matter what happens.

It is so elementary that we frequently don’t even think about it: if we save a record with the ’42’
value in a database, we will get ’42’ every time we read that
record, until the next modification. The durability concept can be generalized somewhat, by considering not only transactional
databases but those that do not provide transactions. After all, in each of them, after a
correct write we can be sure that the stored information is in the database and we have access
to it.

But it turns out that there are databases that provide us with solutions making that the concept of durability —
even in this generalized form — no longer so obvious. What would you say if we stored
1&nbsp;000 records in a database, and the database claimed that there were only 998 of them? Or, if we
created a database storing sets of values and in some cases the database would claim that an
element was in that set, while in fact it was not? Seeing such a behavior many would probably start
looking for an error. However, behavior like this is not necessarily an error, as long as we use a database
that implements probabilistic algorithms and data structures. Solutions based on these methods allow some
inaccuracy in the results, but in return they are able to provide us with great savings in the resources
used. More interesting is that there is a good chance that you are already using such a DB.

In this post we will learn about two probability-based techniques, perform some experiments and
consider when it is worth using a database that lies to us a bit.

## Fast cardinality aggregation

Some time ago I had the opportunity to work on a service based on Elasticsearch. This service collects
huge amounts of data, which is later analyzed by our customer care specialists. One of the key elements to be analyzed
is a simple aggregate — the number of unique occurrences of certain values. In mathematics, this
quantity is called the power of the set or the cardinal number.

The easiest way to understand this is to use an example: imagine that I take out all the banknotes
from my wallet and it turns out that I have 10 of them, with the following nominal values:

```javascript
[10, 20, 50, 20, 50, 100, 50, 20, 10, 10]
```

If we arranged them by value, we would end up collecting these 10
banknotes in four piles with values: `[10, 20, 50, 100]`, so the cardinal number of the set containing my 10
banknotes equals: 4.

Elasticsearch has a special function: [cardinality](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-cardinality-aggregation.html), which is used to determine the power of the set and we use
this function specifically to count unique occurrences that I mentioned earlier.

It may seem that counting unique occurrences of values is a trivial task.
Let’s go back to our example with the banknotes. You can think of many ways to check how many
unique values there are in this list, probably one of the simplest is to use the `HashSet` class. One of its main features is
that it de-duplicates the elements added to it, thus it stores only one occurrence of each.

After adding 10 values of banknotes: `[10, 20, 50, 20, 50, 100, 50, 20, 10, 10]` to an instance of the `HashSet`
class, it will ultimately only store the values `[10, 20, 50, 100]` (not necessarily in that order, but it
doesn’t matter it this case). So all we need to do is check the size of this set and we have the result we were
looking for: 4.

This solution is simple and looks tempting, yet it has a certain drawback: the more unique elements the set stores,
the more memory our program needs. In an extreme case, when each added element is different from
the others, the memory complexity of this approach will be linear. This is bad news when we
want to operate on a large volume of data, because we will immediately use all available memory.
If, additionally, requests for the cardinal number come from
clients with high intensity, and the input set contains billions of elements, it is easy to imagine that the
approach described above has no chance of success.

How to address this issue? In such a situation we can switch to one of ingenious probabilistic algorithms. Their
main feature is that they give approximate rather than exact results. The huge advantage, on the
other hand, is that they are much less resource-intensive.

## Near-optimal cardinality estimator

One such algorithm — HyperLogLog (HLL) — has been implemented in the aforementioned
Elasticsearch to build the cardinality function. It is used to count the unique values of a given field of
an indexed document, and it does so with a certain approximation, using very little memory.
Interestingly, you can control the accuracy of this approximation with a special parameter. This is
because in addition to the field to be counted, the cardinality function also accepts a
`precision_threshold` argument, due to which we can specify how much inaccuracy we agree to, in
exchange for less or more memory usage.

Obviously, in some cases even a small error is unacceptable. We must then abandon the probabilistic
approach and look for another solution. However, for a sizable class of problems, certain
approximation is completely sufficient. Imagine a video clip uploaded to a popular streaming service.
If the author of the clip has a bit of luck, the counter of unique views of his/her work starts spinning
very quickly. In case of very high popularity, when displaying the current number of visits, full
accuracy will not matter so much; we can reconcile with displaying a value that differs from the
actual one by a few percent. It is completely sufficient that the accurate data — e.g. for monetization
purposes — is available the next day, when we calculate it accurately using, for example, Apache Spark.

Implementing such a counter of unique visitors into a site operating on huge data sets, we could
therefore consider using the HLL algorithm.

Readers interested in a detailed description of the HLL algorithm are referred to a great article on
[Damn Cool Algorithms post](http://blog.notdot.net/2012/09/Dam-Cool-Algorithms-Cardinality-Estimation).
However, its most important features are worth noting here:
* the results, although approximate, are deterministic,
* the maximum possible error is known,
* amount of memory used is fixed.

The last two features are closely related and can be controlled: we can decrease the error level by increasing
the available memory limit and vice versa.
There are many ready-made implementations of the HLL algorithm available, so it’s worth reaching
for one of them and doing some experiments. I will use [datasketches](https://datasketches.apache.org/docs/HLL/HLL.html)
and compare the memory consumption with the classic approach using the `HashSet`. Moreover, I will add a third variant based
on a `distinct` method from the Kotlin language, which — like the `HashSet` constructor — de-duplicates
elements from the list.

Below there is a code snippet of a simple program that determines the cardinal number of a set of numbers using `HashSet`
class from Java language. In order to be able to run some trials, I’ve introduced a couple of basic parameters. The
input list consists of `n` numbers, while using the `f` parameter and the `modulo` function I decide what
part of the input list is unique. For example, for n=1&nbsp;000&nbsp;000 and f=0.1, the result will be a cardinal
number equal to 100&nbsp;000.

Please note the `HashSet` constructor parameter. By default, when the constructor is empty - this class is
[initialized with the value 16](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/HashSet.html#%3Cinit%3E()),
which means that before adding the 17th element, memory reallocation must occur for next portion of elements, which takes time.
To eliminate this extra time I allocate in advance as much memory as needed.

``` kotlin
val mod = (n * f).toLong()
val set = HashSet<Long>(mod.toInt())

val elapsed = measureTimeMillis {
    for (i in 0 until n) {
        set.add(i % mod)
    }

    cardinality = set.size
}
```

Two other programs do exactly the same thing: determine the cardinal number of a set of numbers, but one uses Kotlin
`distinct` method and the second one uses HLL algorithm. You can find full code of all three applications
on this [repository](https://github.com/mknasiecki/prob-alg-post).

All three programs, in addition to the result, also measure total execution time. Moreover, using
[jConsole](https://openjdk.java.net/tools/svc/jconsole/) I am also able to measure the amount of memory used. I decided
to measure the total memory used by the
programs, because measuring the size of the data structures is not a trivial task.

We start by checking the variant n=1&nbsp;000&nbsp;000/f=0.25 as a result of which we should get a power of set
equal 250&nbsp;000. Let’s take a look at the results:

*n=1&nbsp;000&nbsp;000/f=0.25*

| Metric\Variant | HashSet | distinct | HLL      |
| -------------- | ------- |----------|----------|
| cardinality | 250&nbsp;000 | 250&nbsp;000   | 249&nbsp;979.9 |
| error [%] | 0 | 0        | 0.01     |
| time [ms] | 71 | 106      | 53       |
| memory [MB] | 42 | 73       | 21       |


In case of such a small set the deviation of the result of the HLL variant from the true value is far less than
1%, while in this case you can already see the benefits of this method; the amount of memory used is
half compared to the `HashSet` version and as much as 3 times less when compared to the
version using the Kotlin language function.

It is worth pausing here for a moment to consider what is the reason for such a big difference in consumed memory.
The first two programs are based on collections of objects, thus storing in memory entire instances along with their references.
The HLL method, on the other hand, uses memory-efficient bit arrays that store data based on object hashes. This makes
it insensitive to the original size of the processed data. It means that the benefits of using HLL increase with the
memory needed to store the objects you want to count. The results presented above would be even more spectacular if we
used, for example, email addresses or IP addresses instead of numbers.

During the next attempt we increase the value of the `n` parameter tenfold:

*n=10&nbsp;000&nbsp;000/f=0.25*

| Metric\Variant | HashSet | distinct | HLL       |
| -------------- |---------| ---------|-----------|
| cardinality | 2&nbsp;500&nbsp;000 | 2&nbsp;500&nbsp;000 | 2&nbsp;484&nbsp;301.4 |
| error [%] | 0       | 0 | 0.63      |
| time [ms] | 483     | 863 | 189       |
| memory [MB] | 233     | 574 | 21        |

The error value has increased slightly, while the difference in memory usage and the performance
time is even greater than before. Therefore, it is worthwhile to increase the size of the set again:

*n=100&nbsp;000&nbsp;000/f=0.25*

| Metric\Variant | HashSet  | distinct | HLL        |
| -------------- |----------|----------|------------|
| cardinality | 25&nbsp;000&nbsp;000 | 25&nbsp;000&nbsp;000 | 25&nbsp;301&nbsp;157.2 |
| error [%] | 0        | 0        | 1.2        |
| time [ms] | 3857     | 7718     | 1538       |
| memory [MB] | 1800     | 5300     | 21         |

Deviation from the correct result exceeded 1%; the times also went up, although they are still many
times shorter compared to other variants. It’s worth noting that the amount of memory used has practically not changed.

Now let’s see what happens when we change the second parameter, which determines the number of
unique elements in the input set:

*n=10&nbsp;000&nbsp;000/f=0.5*

| Metric\Variant | HashSet | distinct | HLL       |
| -------------- |---------|----------|-----------|
| cardinality | 5&nbsp;000&nbsp;000 | 5&nbsp;000&nbsp;000  | 5&nbsp;067&nbsp;045.2 |
| error [%] | 0       | 0        | 1.34      |
| time [ms] | 467     | 914      | 183       |
| memory [MB] | 420     | 753      | 21        |

*n=10&nbsp;000&nbsp;000/f=0.75*

| Metric\Variant | HashSet | distinct | HLL       |
| -------------- |---------|----------|-----------|
| cardinality | 7&nbsp;500&nbsp;000 | 7&nbsp;500&nbsp;000  | 7&nbsp;619&nbsp;136.7 |
| error [%] | 0       | 0        | 1.59      |
| time [ms] | 589     | 1187     | 191       |
| memory [MB] | 616     | 843      | 26        |

Again, the results clearly show the advantages of the HLL algorithm. With a relatively low error we
significantly reduced the amount of memory used and the time required for calculations.
As you can see and as expected, the classical approach gives accurate results but it consumes a lot of
memory, while the solution using HLL brings results characterized by approx. 1% error, but in return
we use much less memory. A certain surprise for me is the poor result of the Kotlin `distinct` function; I
expected results more similar to the variant based on the `HashSet`. Presumably the key difference is that it returns an instance
of the `List` class rather than `HashSet`. This requires further investigation, which is beyond the scope of my considerations.

The HLL algorithm is implemented in several solutions, including the aforementioned Elasticsearch,
as well as in e.g. [Redis](https://redis.com/redis-best-practices/counting/hyperloglog/) and [Presto](https://prestodb.io/docs/current/functions/hyperloglog.html). The above experiments clearly show that the approximate method, in case
we need to process huge amounts of data, is a good idea provided that we allow a result with a small
error.

## Memory-efficient presence test

It turns out that the HLL is not the only probabilistic algorithm available in popular databases —
another example of this approach is the Bloom Filter. This is an implementation of a memory-saving structure that is
used in the so-called presence test. Let’s go back to our example with my cash: `[10, 20, 50, 20, 50, 100, 50, 20, 10, 10]`.
Imagine that we want to test whether there is a 100 value banknote in my wallet. In this case the answer is positive, but the test
for the 200 value banknote should be false, since there is no such a banknote in the wallet.

Of course, we are able again to implement a solution to this problem by simply using the properties
of the `HashSet` class and the `contains` method. However, similarly as in case of determining the
cardinality — the memory requirement increases with the size of the dataset.
Again, the solution for this problem may be an approximate method.

Similarly as in case of the HLL algorithm the Bloom Filter allows for some inaccuracy, and in this case
this means false positive results. This is because it can happen that the Bloom Filter finds that an element
belongs to a given set, while in fact it is not there. However, the opposite situation is not possible
so if the Bloom Filter states that an element is not part of the set, it is certainly true. Referring this to
our example with the content of my wallet, the Bloom Filter could therefore assure me that there was a
200 value banknote in it, while standing at the checkout in a store it would turn out that,
unfortunately, it is not there. What a pity...

Before we move on to examine how this algorithm works, let’s consider where it could be useful. A
typical example is a recommendation system. Imagine we are designing a system intended to suggest
articles for users to read, a feature common on social media sites. Such a system needs to store a
list of articles read by each user so that it does not suggest them again. It is easy to imagine that
storing these articles with each user in the classic way would quickly exhaust memory resources. If we
don’t use any data removal mechanism, the database will grow indefinitely. The discussed Bloom
Filter fits perfectly here as it will allow us to save a lot of memory, although, one must consider
consequences of its limitations related to possible false results. It may happen that we will get false
information that a certain article has already been read by someone, while in fact this is not true.
Consequently, we will not offer that user to read the material. On the other hand, the opposite
situation is not possible: we will never display to a user a recommendation of an article that he/she
has already read.

At this point it is worth checking how much we gain by accepting the inconvenience described
above. I have prepared two implementations of a program that adds to a set of values and then
checks if they are there.
The first program uses the classic approach — the `HashSet` class, while the second uses the Bloom
Filter available in the popular [guava](https://guava.dev/releases/20.0/api/docs/com/google/common/hash/BloomFilter.html) library.
Again, using jConsole we register for both programs the amount of memory used, and additionally — for the version with
the Bloom Filter we also check the
number of false positives. This value can be easily controlled, as the maximum allowed false positive
rate can be set in the API; for needs of the following tests we will set it to 1%.

Moreover, we will measure the total time of adding values to the set and the total time of querying
whether there are values in the set.

Same as before we will perform a number of tests using the following parameters: `n` — the size of the set of
numbers, and `f` — what part of it should be added to the set. The configuration n=1&nbsp;000&nbsp;000 and f=0.1 means
that the first 100&nbsp;000 numbers out of 1&nbsp;000&nbsp;000 will be added to the set. So, in the first part, the program will
add 100&nbsp;000 numbers to the set and then — in the second stage — it will perform a presence test
by checking whether the numbers above 100&nbsp;000 belong to the set. There is no point in checking the
numbers added to the set beforehand, because we know that Bloom Filters do not give false
negative results. On the other hand, if any number above 100&nbsp;000 is found according to the Bloom Filter in
the set, we will consider it a false positive.

Following code snippet presents fragment of the Bloom Filter variant:

``` kotlin
val insertions = (n * f).toInt()
val filter = BloomFilter.create(Funnels.integerFunnel(), insertions, 0.01)
var falsePositives = 0

val insertTime = measureTimeMillis {
    for (i in 0 until insertions) {
        filter.put(i)
    }
}

val queryTime = measureTimeMillis {
    for (i in insertions until n) {
        if (filter.mightContain(i)) {
            falsePositives++;
        }
    }
}

val fpRatio = falsePositives/n.toDouble()
```

Again — you can find full code of both programs on aforementioned [repository](https://github.com/mknasiecki/prob-alg-post).

Let’s start with the following configuration: n=10&nbsp;000&nbsp;000/f=0.1:

*n=10&nbsp;000&nbsp;000/f=0.1*

| Metric\Variant   | HashSet | Bloom filter |
|------------------|---------|--------------|
| error[%]         | 0       | 0.9          |
| insert time [ms] | 81      | 293          |
| query time [ms]  | 82      | 846          |
| memory [MB]      | 94      | 30           |

As you can see, the Bloom Filter returned less than 1% false results, but — at the same time — it used three times
less memory than HashSet variant. Unfortunately, the times of Bloom Filter’s version are significantly higher.
Let’s check what happens when we increase the size of the input set:

*n=100&nbsp;000&nbsp;000/f=0.1*

| Metric\Variant   | HashSet | Bloom filter |
|------------------|---------|--------------|
| error[%]         | 0       | 0.9          |
| insert time [ms] | 593     | 318          |
| query time [ms]  | 988     | 944          |
| memory [MB]      | 876     | 29           |

*n=500&nbsp;000&nbsp;000/f=0.1*

| Metric\Variant   | HashSet | Bloom filter |
|------------------|---------|--------------|
| error[%]         | 0       | 0.9          |
| insert time [ms] | 1975    | 1372         |
| query time [ms]  | 4115    | 4923         |
| memory [MB]      | 4400    | 81           |

The number of false positives is still below the preset 1%, the amount of memory used is still lower
than the classic implementation, and interestingly also the times of the probabilistic variant are
lower, at least for inserting. Thus, it can be seen that along with the increase in the size of the data the benefit of this
method increases.

## Summary

The above results clearly show that by accepting a small share of false answers, we can gain significant savings in memory usage.
Similarly to the HLL algorithm, the structure based on the Bloom Filters is available in many popular
databases like [Redis](https://redis.com/redis-best-practices/bloom-filter-pattern/),
[HBase](https://hbase.apache.org/2.2/devapidocs/org/apache/hadoop/hbase/util/BloomFilter.html)
or [Cassandra](https://cassandra.apache.org/doc/latest/cassandra/operating/bloom_filters.html).

The simple experiments we conducted showed that probabilistic algorithms can save a lot
of memory, which is especially important if our database stores huge amounts of data. In such cases it
is sometimes worth letting your database lie to you a little.
