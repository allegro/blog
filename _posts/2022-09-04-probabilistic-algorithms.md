---
layout: post
title: "Probabilistic Data Structures and Algorithms in NoSQL databases"
author: [michal.knasiecki]
tags: [tech, performance, NoSQL]
excerpt: >
    What would you say if we stored
    1,000 records in a database, and the database claimed that there were only 998 of them? Or, if we
    created a database storing sets of values and in some cases the database would claim that an
    element is in that set, while it is not in fact?
    Such behavior is not necessarily an error, as long as we use a database
    that uses probabilistic algorithms and data structures.
    In this post we will learn about two probability-based techniques, perform some experiments and
    consider when it is worth using a database that lies to us a bit.
---

One of the [four fundamental](https://en.wikipedia.org/wiki/ACID) features of transactional databases is durability. It says that once a
transaction is committed, the stored data remains available even if the database crashes. To put it in a
nutshell, if we upload some information into the database, we must be able to read it later, no matter what happens.

It is so elementary that we frequently don't even think about it: if we save a record with the '42'
value in a database, we will get '42' every time we read that
record, until the next modification. The durability concept can be generalized somewhat, in this manner to consider not only transactional
databases but also such ones that do not provide transactions. After all, in each of them, after a
correct write we can be sure that the stored information is in the database and we have access
to it.

But it turns out that there are databases that provide us with solutions making that the durability idea -
even in this generalized form - is no longer so obvious. What would you say if we stored
1,000 records in a database, and the database claimed that there were only 998 of them? Or, if we
created a database storing sets of values and in some cases the database would claim that an
element is in that set, while it is not in fact? Seeing such a behavior many would probably start
looking for an error. However, behavior like this is not necessarily an error, as long as we use a database
that uses probabilistic algorithms and data structures. Solutions based on these methods allow some
inaccuracy in the results, but in return they are able to provide us with great savings in the resources
used. More interesting is that there is a good chance that you are already using such a base.

In this post we will learn about two probability-based techniques, perform some experiments and
consider when it is worth using a database that lies to us a bit.

## Fast cardinality aggregation

Some time ago I had the opportunity to work on a service based on Elasticsearch. This service collects
huge amounts of data. Then the data is analyzed by admins. One of the key elements to be analyzed
is a simple aggregate - the number of unique occurrences of certain values. In mathematics, this
quantity is called the power of the set or the cardinal number.

The easiest way to understand this is to use an example: imagine that I take out all the banknotes
from my wallet and it turns out that I have 10 of them, with the following nominal values: [10, 20, 50,
20, 50, 100, 50, 20, 10, 10]. If we arranged them by value, we would end up collecting these 10
banknotes in four piles with values: [10, 20, 50, 100], so the cardinality of a set containing my 10
banknotes equals: 4.
Elasticsearch has a specific function: cardinality, which is used to determine this value and it is this
function that we use to count unique occurrences, which are analyzed by our administrators.
Counting of unique occurrences of values seems a trivial task.
Let's go back to our example with the banknotes. You can think of many ways to check how many
unique values are in this list, probably one of the simplest is the HashSet class. It is characterized by a
property that it de-duplicates the elements added to it, thus storing only one occurrence of each.

After adding the 10 values of our banknotes to an instance of the HashSet class: [10, 20, 50, 20, 50,
100, 50, 20, 10, 10], it will only store the values [10, 20, 50, 100] (not necessarily in that order, but it
doesn't matter). So all we need to do is check the size of this set and we have the result we were
looking for.
This solution is very simple, but it has a certain defect: the more unique elements the set stores, the
more memory our program needs. In an extreme case, when each added element is different from
the others, the memory complexity of our this approach will be linear. This is bad news when we
want to operate on a large amount of data, because we will very quickly use the available memory.
If, additionally, we imagine that the operations of determining the cardinal number comes from
clients in high volume, and the input set contains billions of elements, it is easy to imagine that the
approach described above has no chance of success.
What to do then? In such a situation we can turn to one of the clever probabilistic algorithms. Their
main feature is that they give approximate rather than exact results. The huge advantage, on the
other hand, is that they are much less resource-intensive.
One such algorithm - HyperLogLog (HLL) - has been implemented in the aforementioned
Elasticsearch to build the cardinality function. It is used to count the unique values of a given field of
an indexed document, and it does so with a certain approximation, using very little memory.
Interestingly, you can control the accuracy of this approximation with a special parameter. This is
because in addition to the field to be counted, the cardinality function also accepts a
precision_threshold argument, due to which we can specify how much inaccuracy we agree to, in
exchange for less or more memory usage.
Obviously, in some cases even a small error is unacceptable. We must then abandon the probabilistic
approach and look for another solution. However, for a sizable class of problems, certain
approximation is completely sufficient. Imagine a video clip uploaded to a popular streaming service.
If the author of the clip has a bit of luck, the counter of unique views of his/her work starts spinning
very quickly. In case of very high popularity, when displaying the current number of visits, full
accuracy will not matter so much; we can reconcile with displaying a value that differs from the
actual one by a few percent. It is completely sufficient that the accurate data - e.g. for monetization
purposes - is available the next day, when we count it accurately using, for example, Spark.
Implementing such a counter of unique visitors into a site operating on huge data sets, we could
therefore consider using the HLL algorithm.
Readers interested in a detailed description of the HLL algorithm are referred to this [document].
However, its most important features are worth noting here:
* the results, although approximate, are deterministic,
* the maximum possible error is known,
* amount of memory used is fixed.

The last two features are closely related and can be controlled, we can increase the available
memory limit by decreasing the error (level) and vice versa.
There are many ready-made implementations of the HLL algorithm available, so it's worth reaching
for one of them and doing some experiments. I will use [this one] and compare the memory
consumption with the classic approach using the HashSet. Moreover, I will add a third variant based
on a distinct method from the Kotlin language, which - like the HashSet constructor - de-duplicates
elements from the list.
Below there are programs that do exactly the same thing: determine the cardinal number of a set of
numbers. In order to be able to run some trials, I’ve introduced a couple of basic parameters. The
input list consists of n numbers, while using the f parameter and the modulo function I decide what
part of the input list is unique. For example, for n=1000 and f=0.1, the result will be a cardinal
number equal to 100.
The first program uses the HashSet class mentioned above, the second uses the distinct method
available in the Kotlin language, and in the third one I used an implementation of the HLL algorithm.
All the programs, in addition to the result, also bring the performance time. Using jConsole I am also
able to measure the amount of memory used. I decided to measure the total memory used by the
programs, because measuring the size of the data structures is not a trivial task.
We start by checking the variant n=1000000/f=0.25 as a result of which we should get a power of set
equal 250000; here are the results.
In case of such a small set the deviation of the result of the HLL variant from the true value less than
1%, while in this case you can already see the benefits of this method; the amount of memory used is
twice less compared to the HashSet version and as much as 3 times less when compared to the
version using the Kotlin language function. During the next attempt we increase the value of the n
parameter tenfold:
The error value has increased slightly, while the difference in memory usage and the performance
time is even greater than before. Therefore, it is worthwhile to increase the size of the set again:
Deviation from the correct result exceeded 1%; the times also went up, although they are still many
times shorter compared to other variants. Amount of the memory used has practically not changed.
Now let's see how the effect changing the second parameter, which determines the number of
unique numbers in the input set, impacts the results. Here are the results for the variants:
n=10000000/f=0.5 and n=10000000/f=0.75.
Again, the results clearly show the advantages of the HLL algorithm. With a relatively low error we
significantly reduce the amount of memory used and the time required for calculations.
As you can see and as expected, the classical approach gives accurate results but it consumes a lot of
memory, while the solution using HLL brings results characterized by approx. 1% error, but in return
we use much less memory. A certain surprise for me is the poor result of the Kotlin distinct function; I
expected results more similar to the variant based on the HashSet.

The HLL algorithm is implemented in several solutions, including the aforementioned Elasticsearch,
as well as in e.g. Redis. The above experiments clearly show that the approximate method, in case
we need to process huge amounts of data, is a good idea provided that we allow a result with a small
error.
It turns out that the HLL is not the only probabilistic algorithm available in popular databases,
another example of this approach is the Bloom Filter. This is an implementation of a memory-
efficient structure that is used to store the sets on the grounds of which we want to perform so
called presence test. Let’s go back to our example with banknotes. Imagine that we want to test
whether there is a 100 value banknote in my wallet. In this case the answer is positive, but the test
for the 200 value banknote should be false, since there is no such a banknote in the wallet.
Of course, we are able again to implement a solution to this problem by simply using the properties
of the HashSet class and the contains method. However, similarly as in case of determining the
power - as the size of the set increases the memory requirements linearly increase with this
approach. Again, the solution may be the approximate method.
Similarly as in case of the HLL algorithm the Bloom Filter allows for some inaccuracy, and in this case
this means false positives. This is because it can happen that the Bloom Filter finds that an element
poses a part of a given set, while in fact it is not there. However, the opposite situation is not possible
so if the Bloom Filter states that an element is not part of the set, it is certainly true. Referring this to
our example with the content of a wallet, the Bloom Filter could therefore assure me that there is a
200 value banknote in it, while standing at the checkout in a store it would turn out that,
unfortunately, it is not there.
Before we move on to examine how this algorithm works, let's consider where it could be useful. A
typical example is a recommendation system. Imagine we are designing a system intended to suggest
articles for users to read, as it takes place in popular social networks. Such a system needs to store a
list of articles read by each user so that it does not suggest them again. It is easy to imagine that
storing these articles with each user in the classic way would quickly use memory resources. If we
don’t use any data retention mechanism, the database would grow indefinitely. The discussed Bloom
Filter fits perfectly here as it will allow us to save a lot of memory, although, one must consider
consequences of its limitations related to possible false results. It may happen that we will get false
information that a certain article has already been read by someone, while in fact this is not true.
Consequently, we will not offer that user to read the material. On the other hand, the opposite
situation is not possible, we will never display to a user a recommendation of an article that he/she
has already read.
At this point it is worth checking how much we gain by accepting the inconvenience described
above? I have prepared two implementations of a program that adds to a set of values and then
checks if they are there.
The first program uses the classic approach - the HashSet class, while the second uses the Bloom
Filter available in the popular guava library. Again, using jConsole we register for both programs the

amount of memory used, and additionally - for the version with the Bloom Filter we also check the
number of false positives. This value can be easily controlled, as the maximum allowed false positive
rate can be set in the API; for needs of the following tests we will set it to 1%.
Moreover, we will measure the total time of adding values to the set and the total time of queries
whether there are values in the set.
Also this time we will perform some tests and use the following parameters: n - the size of the set of
numbers, and f - what part of it should be added to the set. The configuration n=100 and f=0.1 means
that the first 10 numbers out of 100 will be added to the set. So, in the first part, the program will
add 10 numbers to the set and then it moves to the second stage by performing a membership test:
it checks whether the numbers above 10 pose a part of the set. There is no point in checking the
numbers added to the set beforehand, because we know that Bloom Filters do not give false
negative results. On the other hand, if any number above 10 is found according to the Bloom Filter in
the set, we will consider it a false positive.
We start with the variant n=10000000/f=0.1:
As you can see, the Bloom Filter returned &lt;1% false results, but it used three times less memory
during the process. Unfortunately, the times of this variant are significantly higher. So let's check
what happens when we increase the size of the input set:
The number of false positives is still below the preset 1%, the amount of memory used is still lower
than the classical implementation, and interestingly also the times of the probabilistic variant are
lower. Thus, it can be seen that along with the increase in the size of the data the benefit of this
method increases. The above example clearly shows that by accepting a small share of wrong
answers, we can gain significant savings in memory usage.
Similarly to the HLL algorithm, the structure based on the Bloom Filters is available in many popular
databases. The simple experiments we conducted showed that probabilistic algorithms can save a lot
of money, which is especially important if our database stores huge amounts of data. In such cases it
is sometimes worth letting your database lie to you.
