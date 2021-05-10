---
layout: post
title: How to ruin your Elasticsearch performance in 10 easy steps
author: [michal.kosmulski]
tags: [tech, "full-text search", elasticsearch, elastic, es, performance]
aaaaaaaaaaaaaaaaaa dodac ikonkę jako miniaturę per tag
---
It’s relatively easy to find resources about _improving_ Elasticsearch performance, but what if you wanted to _decrease_ it? Here is a collection of select tips
which can help you ruin ES performance in no time. Most should also be applicable to Solr, raw Lucene, or, for that matter, to any full-text search engine as well.

Surprisingly, a number of people seem to have discovered these tactics already, and you may even find some of them used in your own production code.

## The basics

In order to deal a truly devastating blow to Elastic’s performance, we first need to understand what goes on under the hood. Since full-text search is
a complex topic, this introduction will be both simplified and incomplete.

### Index and document contents

In most full-text search engines, data is split into two separate areas: the index, which makes it possible to find documents (represented by some sort of ID)
which match specified criteria, and document storage which makes it possible to retrieve the contents (values of all fields) of a document with specified ID.
This distinction improves performance, since usually document IDs will appear multiple times in the index, and it would not make much sense to duplicate all
document contents. IDs can also be fit into fixed-width fields which makes managing certain data structures easier. This separation also enables further
space savings: it is possible to specify that certain fields will never be searched, and therefore do not need to be in the index, while others might never
need to be returned in search results and thus can be omitted in document storage.

For certain operations, it may be useful to [store field values within the index itself](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-store.html),
which is yet another approach, but still distinct from the index used for finding document IDs.

### Inverted index

The basic data structure full-text search uses is the [inverted index](https://en.wikipedia.org/wiki/Inverted_index). Basically, it is a map from keywords
into sorted lists of document ID-s, so called postings lists. The specific data structures used to implement this mapping are many, but are not relevant here.
What matters, is that for a single-word query, this index can find matching documents very fast: it actually contains a ready-to-use answer. The same
structure can, of course, be used not only for words: for example in a numeric index, we may have a ready-to-use list with IDs of documents which contain
the value 123 in a specific field.

aaaaaaaaaaaaaaa images

### Indexing

The mechanism for finding all documents which contain a single word described above is very neat, but it can be so fast and simple only because in the index
there is a ready answer for our query. In order for it to get there, however, we need to perform a rather complex operation called _indexing_. We won’t get
into the details here, but you can easily imagine that this process is both complicated when it comes to the logic it implements, and resource-intensive, since
it requires information about all documents to be gathered in a single place.

This has further-reaching consequences. Adding a new document, which may contain hundreds or thousands of words, to the index, means that hundreds or thousands
of postings lists would have to be updated. This would be prohibitively expensive in terms of performance. Therefore, full-text search engines usually employ
a different strategy: once built, an index is effectively immutable. When documents are added, removed or modified, a new tiny index is created which contains
just the changes, and at query time results from the main and incremental index are merged. Any number of these incremental indices, called _segments_ in
Elastic parlance, can be created, but the cost of merging results grows quickly with their number. Therefore, a special process of segment merging must be
present, in order to ensure that the number of segments does not get out of control. This, obviously, further increases complexity of the whole system.

### Operations on postings lists

So far, we talked about the relatively simple case of searching for documents matching a single search term. But what if you want to find documents
containing multiple search terms at once? This is where Elastic needs to combine several postings lists into a single one. Interestingly, the same issue arises
even for a single search term if your index has multiple segments.

A postings list represents a set of document IDs, and most ways of matching documents to search terms correspond to boolean operations on those sets.
For example, finding documents which contain both `term1` and `term2` corresponds to the logical operation `set1 AND set2` (or intersection of sets) where
`set1` and `set2` are the sets of documents matching the corresponding search terms. Likewise, finding documents with any of a set of words corresponds
to the logical `OR` operation (sum of sets) and documents which contains one term but do not contain another correspond to `AND NOT` operator (or difference
of sets).

There are many ways these operations can be implemented in practice, with search engines using lots of optimizations. However, some constraints on the
complexity remain. Let’s take a look at one possible implementation and see what conclusions we can draw.

While the operations described below can be generalized to work on multiple lists at once, we’ll just discuss operation which are binary, i.e. which take
two arguments, for simplicity. Conclusions remain the same.

In the algorithms below, we'll assume each postings list is an actual list of integers (doc IDs), sorted in ascending order, and that their sizes
are _n_ and _m_.

#### OR

aaaaaaaaaaaaaaaaa images

The way to merge two sorted lists is straightforward (and this is also the reason we want these lists to be sorted in the first place).
For each list, we need to keep a pointer which will indicate the current position. Both pointers start at the beginning of their corresponding lists.
In each step, we compare the values indicated by the pointers, and add the smaller one to the result list. Then, we move that pointer forward. If the values
are equal, we add the value to the result just once and move both pointers. When one pointer reaches the end of its list, we copy the remainder of the second
list to the end of result list, and we’re done. The result is a sorted list without duplicates, so it has the same properties as each of the input lists.

If you are familiar with [merge sort](https://en.wikipedia.org/wiki/Merge_sort), you will notice that this algorithm corresponds to the merge phase of this
algorithm.

Since the result is a sum of the two sets, its size is at least _max(m, n)_ (in the case one set was a subset of the other) and at most
_m + n_ (in the case the two sets were disjoint). Due to the fact that the cursor has to go through all entries in each of the lists, the
algorithm’s complexity is O(n+m). But even for any other algorithm, since the size of the result list may reach _m + n_, and we have to generate that list,
complexity of O(n+m) is expected.

The result does not depend on the order of lists (OR operation is symmetric), and performance is not (much) affected by the order, either.

#### AND and AND NOT

aaaaaaaaaaaaaaaaa images

Calculating the intersection of two sets (which corresponds to the logical AND operator) or their difference (AND NOT) are very similar operations.
Just as when calculating the sum of sets, we need to maintain two pointers, one for each list. In each step of the iteration, we look at the current value
in the first list and then try to find that value in the second list, starting from the second list’s pointer’s position. If we find the value, we add it
to the result list, and move the second list’s pointer to the corresponding position. If the value could not be found, or the second list’s pointer reaches
the end, we are done and no more calculations are necessary.

The algorithmic complexity of these two operations differs quite a bit from that of OR operation. First of all, a new sub-operation of searching for a value
in the second list is used. It can be implemented in a number of ways depending on the data structures used, but for a simple sorted list as used here, we could
use binary search whose complexity is O(log(m)). Things get a little more complicated since we only search starting from current position rather than from
the beginning, but let’s skim over this for now. What matters is that we perform a search for each item from the first list: the complexity is no longer
symmetric between the two lists. If we change the order of the lists, the result of AND operation does not change, but the cost of performing the calculation
does. It pays to have the shorter of the two list as the first one, and the difference can be huge. The cost also depends very much on the data, i.e. how
big the intersection of the two lists is. If the intersection is empty, looking for even the first element of first list in the second list will move the second
list’s pointer to the end, and the algorithm will finish very quickly. The size of the result list (which puts a lower limit on algorithmic complexity here)
is _min(m, n)_ which also shows the asymmetry.

If we’re performing the AND NOT rather than AND operation, the match condition has to be reversed from _found_ to _not found_. While the result changes if
we exchange the two lists, algorithmic properties are the same as for AND, especially the asymmetry in how the first and second list’s size affects the
computational cost.

Many search engines automatically change the order in which operations are evaluated if it does not change the end result in order to improve performance.
In particular, Lucene (and thus also Elasticsearch and Solr) reorder lists passed to AND operator so that they are sorted by length in ascending order.

### Beyond the basics

There are lots of factors which affect Elasticsearch performance and can be exploited in order to make that performance worse, and which I haven’t mentioned
here. These include scoring, phrase search, hardware, and disk vs memory access just to name a few. There are also lots of minor quirks which are too
numerous to list here. On the other hand, search engines employ a number of optimizations which may counter some of our efforts at achieving low performance.

Still, even the basic knowledge presented above should allow you to deal some heavy damage to your search performance, so let’s get started.

## Using complicated boolean queries

Looking at the algorithms above, you can easily notice that simple queries such as finding a document containing two or three specific words, are relatively
cheap to compute. We can easily increase the cost by making the queries more complex. This complexity is best achieved by using boolean queries which make it
possible to write any boolean expressions, including nested subexpressions.

A “flat” query with even a large number of words boils down to a single AND operation (though potentially with many lists). Since a search engine is usually
smart enough to sort these lists by length, it can execute such queries really fast. But what happens if we use a complicated boolean expression? Let’s compare
two example queries:

* Q1: find blog posts which contain all of the words: “I like apples”
* Q2: find books which contain all of the words: “I like apples” or “I like oranges” and were published in 2020 or 2021 by John Doe

Let us now look at the boolean expressions which correspond to these queries:

* Q1: `I AND like AND apples`
* Q2: `((I AND like AND apples) OR (I AND like AND oranges)) AND (2020 OR 2021) AND (John Doe)`

Clearly, there is much more stuff to calculate in the case of Q2, and the query will take more time, accordingly. Even though from a UX perspective,
we only added a few filters, the complexity of the query rose dramatically. For Q1, we need to perform 2 AND operations. For Q2, we end up with
6 AND operations and 2 OR operations. However, this query is probably still much worse for performance than it may seem.

Let’s start analyzing this query from the bottom up.

The expression `2020 OR 2021` is a little gem which looks innocent but is actually quite costly. As you remember, the cost of an OR operation is proportional
to the sum of the sizes of input lists. The lists of posts published in a year are probably quite long already, so the cost of merging two will be quite high.
As a bonus, we get an even longer list as a result and this long list will take part in any calculations that follow. So here are the takeaways:
* OR operations are costly,
* even more so when inputs are large document sets;
* subqueries (parentheses in the logical expression) cause temporary postings lists to be created, which then take part in further calculations and so their
  sizes affect query performance.

Looking further at our query, we see that even more temporary document ID lists will have to be created: one for each pair of parentheses. These results have
to be calculated, and since they are temporary partial results, they will have to be stored in memory since they cannot be retrieved from the index directly.

Also note that subqueries can hinder many optimizations search engines employ. I mentioned above that Lucene will sort postings lists by length when AND-ing
them together, but this only works reliably if the lengths of the list are known. For a postings list of a single word, its length is stored in the index and
known exactly. For a nested subexpression, Lucene would either need to calculate the whole subquery first to learn the size of the results (which is not always
the best idea, for other reasons), or, not knowing the size, it tries to estimate it based on the sizes of its constituents. For example, it may estimate the
result size of a subquery with AND-s as the minimum of the sizes of its inputs, and the size of an OR-block as the sum. However, this estimate may be off
and thus cause suboptimal query performance further up the stack. Takeaway:
* subqueries are great at hindering global query optimizations.

Another reason why subqueries may negatively affect performance becomes apparent with queries such as `(a AND b) AND (c AND d)` (I have actually run into
a case like this in production code). Since AND is an associative operation, the expression above gives the same result as `a AND b AND c AND d`. In the
version without parentheses, the optimization of sorting lists by size works globally since all inputs are at the same nesting level, potentially achieving
better performance than the version with nested subexpressions which can only sort the lists within each pair of parentheses separately.

Looking at how long postings lists affect query performance, especially with OR operator, you can see one of the reasons for introducing
[stopwords](https://en.wikipedia.org/wiki/Stop_word) into search configuration. Words such as _the_ are very common, and on one hand they introduce practically
no meaning at all to the query (with rare exceptions), matching almost all documents anyway, and on the other, they could add immense computational cost.

Obviously, the longest postings list one can get is the one which contains all documents in the index. And indeed, pure negative queries such as
“all documents but those with the word x” tend to be very expensive. Surprisingly, AND-ing or OR-ing the full set of documents (the result of a `match_all`
query) with results of another query is very fast. This is because of a special optimization which uses the identities `ALL OR a = ALL` and `ALL AND a = a`
to simplify those queries so that the expensive computation can be completely avoided. This is called _query rewriting_ and can transform a number of
query patterns to queries with the same result but better performance characteristics. However, this only works for a set of rather simple cases, and
complex query structure with subqueries can effectively disable these optimizations as well.

Thinking about indexing and index segments, you have to notice that merging partial results from each shard is an operation similar to OR-ing (though it
additionally has to account for document removal and updates). This leads to the conclusion that having many segments hurts search performance, especially
for popular keywords whose postings lists are large anyway. Indeed, this happens in practice. Performance may vary significantly depending on the number
of segments, and the optimum is just a single segment in your index. In Elastic, you can use the
[force merge](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-forcemerge.html) API to reduce the number of segments after indexing.
I actually work with a product in which data is never indexed incrementally, but instead the whole index is rebuilt from scratch and force-merged to a single
segment after each update. This is a relatively small index with high search traffic and big gains in search performance (on the order of twice shorter response
times) are the reason for this seemingly wasteful indexation process.

aaaaaaaaaaaaa do at search time what you can do at index time - przykąłd z mnetodami dostawy
aaaa zamiana and na and not dopelnienia itp.

## Returning lots of search results

Elasticsearch indexes may be huge, often searching millions and even billions of documents. Usually only a tiny fraction of those documents match each query’s
criteria, and of those, only a handful (10 or so) are returned to the end user. Increasing the number of documents returned is detrimental to search performance
in many ways:
* Many algorithms, such as finding the top N results when sorting by relevance, have complexity which depends on N: they are much faster if N is much smaller
  than the total number of matches, and become slower as N grows.
* Some operations a full-text search engine performs are linear in the number of documents returned. As you remember, just finding matches works on fixed-size
  document IDs, but in order to actually return the documents’ contents, they have to be fetched from document store, and this operation scales linearly with
  the number of documents returned. So, if you fetch 100 documents instead of 10, this part takes around ten times more time. Same goes for highlighting
  query terms. The amount of data transferred over the network scales in a similar manner.
* Aggregations such as grouping documents by a field’s value may also have complexity linear in the number of the documents returned.

Also note that paging the results (e.g. retrieving 100 pages of 10 documents each instead of a single request asking for 1000 documents) helps only a little.
The problem is that in order to find documents on positions 990-1000, Elastic has to find the complete list of results 1-1000 first, and only then take the last
10 items. This means the cost of fetching documents from storage is indeed proportional to 10, but the cost of performing set operations on postings lists
and aggregations is still proportional to 1000.

So, if you think you have a million documents in ES and can just retrieve them all (or some large subset), you may be in for a surprise.

## Assuming Elastic knows as much about your data as you do

Much of the discussion above centered on replacing boolean expressions with equivalent expressions that have different performance characteristics.
Some of those transformations are always correct since the expressions before and after the transformation can be proven equal by means of boolean algebra.
However, sometimes two forms of a query are equivalent only within a specific data set. Despite many smart optimizations used by modern full-text search
engines, by using knowledge about your dataset, you can often achieve more in terms of increasing or decreasing search performance than by relying on
mathematics alone.

A simple example of using this knowledge in practice is removing subqueries which, due to the nature of the data, are redundant, in order to improve performance.
Suppose your index contains both printed and online publications. Only online publications have a URL. By following the simplest logic, if you wanted to find
an online publication by URL, you would issue a query such as `type:online AND url:value`. This will work, but you could query just `url:value` as well,
but knowing something about your data, namely that only online publications have any value set in the `url` field. Obviously, this simplified query will
be faster than the original.

Where you can’t avoid complex queries, you can still use your domain knowledge to improve or reduce performance. For example, since the cost of merge operations
depends on sizes of inputs, knowing that a particular subquery is likely to return many or few results (query selectivity) and modifying the query in a way
in which the sizes of consecutive intermediate results diminish faster may boost performance while relying only on Elastic’s optimizations may result in
sub-par performance.

Suppose (a real-world example) there is an index with two types of documents whose counts differ wildly: documents of type 1 make up 99% of the index while
type 2 amounts to just 1% of all documents. Certain queries must be limited to just a single type. The obvious way to filter these results is to add a clause
such as `... AND type:1` and `... AND type:2`, correspondingly, but replacing the first one with `... AND NOT type:2` may be faster since the results list for
type 2 is much shorter than for type 1. If the filters can be combined (e.g. by the user checking checkboxes in a GUI), and the user selects both types,
meaning effectively no filtering by type, it is probably much more efficient to simply remove the filter from the query than to add a `... AND (type:1 OR type:2)`
clause.

## Treating search and indexing as two independent problems

You might be tempted to think of Elasticsearch as yet another database. If you do, you are likely to run into many issues, including performance issues, which
are the topic of this post. One of the main things that set ES apart from most databases, whether they be SQL or NoSQL, is the search-indexing asymmetry.
In contrast to a normal database, in Elasticsearch you can’t just insert a bunch of documents: this process causes indexing, creates new segments, potentially
triggers segment merges, etc. and may affect performance in interesting ways. While indices are present and configurable in many databases, in ES they play a
more important role.

Since ES is much more about search performance than anything else, it is a common optimization to move cost from search time to indexing time when possible.
Let’s say your index of blog posts aaaaaaaaaaaaaaaaaaa

aaaa search vs query time cost
aaaaaaaaaaa ejdncozesne obciazenie klastra przezi ndeksowanie i search

## Jumping right into optimization without checking first

aaaaaaaaaa always measure if there is a problem and how much there is to gain and what you gain in pracitce
aaaaaaaaaaa optymalizacje moga dzialac roznie dla roznych typow zapytan
aaaaaaaaaaa jaka czesc calej logiki aplikacji to czas ES?
aaaaaaaaaaaa koszt optymalizacji vs zlozonosci kodu - premature?

## Blindly trusting what you read on the web
aaaaaaaaaaaaaaaaa including this post

## Summary
