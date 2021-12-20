---
layout: post
title: "Evaluating performance of time series collections"
author: [michal.knasiecki]
tags: [tech, mongodb, performance, "time series"]
---
A few years ago, I was working on a new version of [Allegro](https://allegro.tech) purchase ratings.
It was a time of a pretty large revolution in the rating system when we moved this product away from our monolith, also
introducing quite significant changes to the concept of purchase rating itself. Replacing the system of positive, neutral
or negative rating, we introduced an approach based on “thumbs up” and “thumbs down” as well as the option to rate several
elements of the purchase separately: the time and cost of delivery, or products’ conformity with its description. The
product-related revolution was accompanied by a major change in technology. Apart from transitioning towards the
microservices architecture, we also decided to migrate data from a large relational database to MongoDB. There were many
reasons for this decision: from the non-relational nature of our model, through the need for easier scaling, to the wish
for cost reduction. Upon completion of the works, we were for the most part content with the decision that we made. The
new solution was more user-friendly, easier to maintain and worked smoothly. The sole exception was aggregation queries,
specifically: determining the average of seller ratings in a specified period of time. While at the level of the 99th
percentile times were very low, some queries were much slower. We spent a lot of time optimising both queries and the
code, and had to use some programming tricks to achieve satisfactory results. While we were able to solve our problems in
the end, the final conclusion was that the aggregation of data in large MongoDB collections is quite challenging.

## To the rescue: Time series
A new version of MongoDB, 5.0, has been recently launched. The list of changes included one that I found particularly
interesting: the time series collections. It is a method of effective storing and processing of time-ordered value series.
A classic example for this case is measuring the temperature of air. These measurements are taken
periodically (for instance every hour), and their sequence forms time series. We then often review such data in an
appropriate order, as well as calculate the maximum and minimum values, or the arithmetic mean. Therefore, in the said
case of use, a database must be highly efficient when saving the data, store records in a compact manner due to the
large number thereof, and must quickly calculate aggregates. Although in the case of temperature readings database write
operations are made on a regular basis, it turns out that in the case of time series it is not mandatory, and the only
thing that truly matters is the presence of time. While reading about this topic, I instantly remembered my countless
late nights struggling with slow ratings aggregations. Therefore, I decided to explore this topic and see how the
solution works in practice.

Before the release of MongoDB 5.0, the only way to efficiently process time series was to store pre-calculated
aggregates, or use a [bucket pattern](https://www.mongodb.com/blog/post/building-with-patterns-the-bucket-pattern),
which was obviously associated with additional work and complexity of the
code. Now, things have been made much easier as this additional complexity is covered by a convenient abstraction. In
MongoDB, time series are not actual collections, but materialised views that cover physical collections. This
abstraction is intended to simplify complicated operations based on “buckets” of documents. You can read more about the
concept of storing data in the new kind of collection on the MongoDB [official blog](https://www.mongodb.com/developer/how-to/new-time-series-collections/).
Everyone who is interested in using this solution should take a look at it. In my article, on the other hand, I would
like to verify whether the processing of time series is really as fast as promised by the authors.

## Data preparation
For the purposes of our considerations I will use a simple document describing the rating in the form of:

```
{
    "timestamp" : ISODate("2021-10-22T00:00:00.000Z"),
    "rating" : 2.0
}
```

Attentive readers will immediately notice the absence of the field containing the ID of the seller whom the rating
concerns. It was done intentionally, otherwise I would have to
create an additional index covering this field. However, I did not want to introduce any additional elements in my
experiment that could have any impact on the results. Let’s assume for this experiment that we are rating a
restaurant, not Allegro sellers, therefore all ratings in the collection concern the restaurant only.

Now we can create two collections storing an identical set of data. One will be a standard collection, and the other will
be a time series. The time series collection has to be created manually by indicating the field specifying the time label:

```javascript
db.createCollection("coll-ts", { timeseries: { timeField: "timestamp" } } )
```

If you did not install Mongo 5.0 from scratch, but updated its previous version, you should make sure that
it is set to an adequate level of compatibility. Otherwise, the above command will not create a time series collection.
You can check it with this command:

```javascript
db.adminCommand( { getParameter: 1, featureCompatibilityVersion: 1 } )
```

If the returned value is less than 5.0, you need to issue:

```javascript
db.adminCommand( { setFeatureCompatibilityVersion: "5.0" } )
```

Upon creating a collection, it is also worth checking that a time series has actually been created:

```javascript
db.runCommand( { listCollections: 1.0 } )
```

We look for `"type" : "timeseries"` entry:

```
{
    "name" : "coll-ts",
    "type" : "timeseries",
    "options" : {
        "timeseries" : {
            "timeField" : "timestamp",
            "granularity" : "seconds",
            "bucketMaxSpanSeconds" : 3600
        }
    },
    "info" : {
        "readOnly" : false
    }
}
```

We will also create the second collection manually (although it is not necessary, because it would be created with the
first INSERT command). We will want to check the speed of data search based on time field, so we will create a unique index:

```javascript
db.createCollection("coll-ord")
db.getCollection('coll-ord').createIndex({timestamp: 1}, {unique: true})
```

Let’s use the following scripts to fill both collections with 10 million documents:

```javascript
// Save as fill-ts.js
var bulk = db.getCollection("coll-ts").initializeUnorderedBulkOp();
var startTime = new Date("2021-10-22T00:00:00.000Z")
for (let i = 0; i < 10000000; i++) {
    bulk.insert({
       "timestamp": new Date(startTime.getTime() + i * 60000),
       "rating": Math.floor(1 + Math.random() * 4)
    })
}
bulk.execute();
```

```javascript
// Save as fill-ord.js
var bulk = db.getCollection("coll-ord").initializeUnorderedBulkOp();
var startTime = new Date("2021-10-22T00:00:00.000Z")
for (let i = 0; i < 10000000; i++) {
    bulk.insert({
       "timestamp": new Date(startTime.getTime() + i * 60000),
       "rating": Math.floor(1 + Math.random() * 4)
    })
}
bulk.execute();
```

It is worth to measure the execution time of scripts to compare write times to both collections. For this purpose I use
`time` command and `mongo` command-line client, `test` is the name of my database.
To avoid network latency I perform the measurements on my laptop with a local instance of MongoDB version 5.0.3 running.

```shell
time mongo test fill-ts.js
```

```shell
time mongo test fill-ord.js
```

As expected, the filling of the time series collection was faster: 3:30,11 vs 4:39,48. Such a difference can be essential
if our system performs many write operations in a short period of time. At the very beginning of our experiments
collection of a new type comes to the forefront.

Now when our collections already contain data, we can take a look at the size of files. On the
[manual page](https://docs.mongodb.com/manual/core/timeseries-collections/) we can read that:

> Compared to normal collections, storing time series data in time series collections improves query efficiency and
> reduces the disk usage

Let’s find out how true that is.

## A closer look at the data

In the first place, it is worth making sure that documents in both collections look the same:

```javascript
db.getCollection('coll-ts').find({}).limit(1)
db.getCollection('coll-ord').find({}).limit(1)
```

Both documents should be similar to this one:

```
{
    "timestamp" : ISODate("2021-10-22T00:00:00.000Z"),
    "_id" : ObjectId("6184126fc42d1ab73d5208e4"),
    "rating" : 2.0
}
```

The documents have the same schema. In addition, the `_id` key was automatically generated in both cases, although our
filling script did not contain them.

Let’s move on to indexes now and use the commands: `db.getCollection('coll-ord').getIndexes()` and `db.getCollection('coll-ts').getIndexes()`
to get the indexes of both collections.

The normal collection has two indexes, one that was created automatically for the `_id` key and the one that we created manually:

```
// coll-ord:
[
    {
        "v" : 2,
        "key" : {
            "_id" : 1
        },
        "name" : "_id_"
    },
    {
        "v" : 2,
        "key" : {
            "timestamp" : 1.0
        },
        "name" : "timestamp_1",
        "unique" : true
    }
]
```

What is interesting is that the time series collection has no index at all:

```
// coll-ts:
[]
```

The lack of the index for the `_id` key of
course means that, by default, the time series collection will have to perform the `COLLSCAN` operation if we want to
search documents based on `_id`. The index is probably missing simply to save disc space and storage time,
stemming from the assumption that the time series collections are mainly used to search based on time. The lack of
the index for the timestamp field is much more surprising. Does it mean that time-based searches in time series will
also cause `COLLCSAN` and work slowly? The answer to this question can be found in the documentation:
> The internal index for a time series collection is not displayed

So, there actually is an index, but it is different from those created manually, and even from indexes created
automatically for the `_id` key.
As I wrote in another [post]({% post_url 2021-10-18-comparing-mongodb-composite-indexes %}), indexes are not all the
same, so it’s worth taking a closer look at this one. Let’s check the query execution plans:

```javascript
db.getCollection('coll-ord').find({"timestamp" : ISODate("2021-10-22T00:00:00.000Z")}).explain('executionStats')
db.getCollection('coll-ts').find({"timestamp" : ISODate("2021-10-22T00:00:00.000Z")}).explain('executionStats')
```

```
//coll-ord
"winningPlan" : {
    "stage" : "FETCH",
    "inputStage" : {
        "stage" : "IXSCAN",
        "keyPattern" : {
            "timestamp" : 1.0
        }
    },
    "indexName" : "timestamp_1",
}
```

```
//coll-ts
"winningPlan" : {
    "stage" : "COLLSCAN",
    "filter" : {
        "$and" : [
            {
                "_id" : {
                    "$lte" : ObjectId("6171ff00ffffffffffffffff")
                }
            },
            {
                "_id" : {
                    "$gte" : ObjectId("6171f0f00000000000000000")
                }
            },
            {
                "control.max.timestamp" : {
                    "$_internalExprGte" : ISODate("2021-10-22T00:00:00.000Z")
                }
            },
            {
                "control.min.timestamp" : {
                    "$_internalExprLte" : ISODate("2021-10-22T00:00:00.000Z")
                }
            }
        ]
    },
}
```

It turns out that while in the case of the regular collection the plan shows the use of the index, in the time series
collection we see the `COLLSCAN` operation. It doesn’t mean that this operation is slow, though. The execution times of
both operations were similar. We will move on to a more detailed time comparison in a moment; for now we should only
note that the hidden index in the time series collection follows specific rules, it is not only invisible, but it also
cannot be seen in the execution plan, although it clearly affects the speed of the search.

And what happens if we add sorting?

```javascript
db.getCollection('coll-ts').find({}).sort({timestamp: 1})
```

```
{
 "ok" : 0,
 "errmsg" : "PlanExecutor error during aggregation :: caused by :: Sort exceeded memory limit of 104857600 bytes,
 but did not opt in to external sorting.",
 "code" : 292,
 "codeName" : "QueryExceededMemoryLimitNoDiskUseAllowed"
}
```

Surprise! The internal index for the time series collection does not have a sorting feature. This means that if we add
the sort clause to our query, the operation will take very long, or even fail because of exceeding the memory
limit. It is surprising because I did not find any information on this in the documentation. Therefore, if we plan to
sort our data based on the field with time, we will need to index this field manually. It means, of
course, that the benefits stemming from a lower disc usage and faster saving times will unfortunately diminish.

Since we are talking about the use of disc space, let’s check the data size:

```javascript
db.getCollection('coll-ts').stats()
db.getCollection('coll-ord').stats()
```

We will compare several fields:

- `size`: data size before the compression,
- `storageSize`: size of data after the compression,
- `totalIndexSize`: size of indexes,
- `totalSize`: total size of data and indexes.

Results are gathered in the table below (in bytes, space is thousand separator):

| Field | Normal collection | Time series collection | Diff |
| ---- | ----: | ----: | :----: |
| size| 570 000 000 | 747 855 228 | + 31% |
| storageSize | 175 407 104 | 119 410 688 | -31% |
| totalIndexSize | 232 701 952 | 0 | -100% |
| totalSize | 408 109 056 | 119 410 688 | -70% |

As you can see, raw data of the time series collection may take up more space, but after their compression the new-type
collection turns out to be the winner in the size-on-disc category. After adding the size of indexes created in the
regular collection, the difference will be even greater. Therefore, we must admit that the way time series data are
packed on the disc is impressive.

Now it’s time to compare query execution times for both collections.

## Speed is all that matters

Using the script below (saved as `gen-find.sh` file), I generated two files containing commands getting documents from
both collections based on the
time label:

```shell
#!/bin/bash
RANDOM=42
for ((i = 1; i <= $1; i++ ));
do
  x=$(( $RANDOM % 10000000))
  t=$(date -jv +${x}M -f "%Y-%m-%d %H:%M:%S" "2021-10-22 0:00:00" +%Y-%m-%dT%H:%M:%S)
  echo "db.getCollection('$2').find({'timestamp' : new ISODate('$t')})"
done >> find-$2.js
```

The script takes as parameters: the number of queries, and the name of the collection that we want to search. I
generated a million queries (it may take some time depending on your hardware, so you can start with a lower amount of
queries):

```shell
./gen-find.sh 1000000 coll-ts
./gen-find.sh 1000000 coll-ord
```

Then I checked the time of the execution of both query sequences using the command:

```shell
time mongo test find-coll-ts.js
time mongo test find-coll-ord.js
```

The standard collection was a bit slower: 16,854 for `coll-ord` vs 16,038 for `coll-ts`. Although the difference is small,
another point goes to time series: simple search is slightly faster than in the case of the regular collection.

But we’re yet to discuss the most interesting part. Time series is primarily used for quick aggregate counting. Let’s
see what the comparison looks like when calculating the arithmetic mean in a given time interval.

The script below (saved as `gen-aggregate.sh`) creates a list of queries calculating the arithmetic mean of ratings for
a randomly selected six-hour interval:

```shell
#!/bin/bash
RANDOM=42
for ((i = 1; i <= $1; i++ ));
do
  x1=$(( $RANDOM % 10000000))
  x2=$(( x1 + 360))
  t1=$(date -jv +${x1}M -f "%Y-%m-%d %H:%M:%S" "2021-10-22 0:00:00" +%Y-%m-%dT%H:%M:%S)
  t2=$(date -jv +${x2}M -f "%Y-%m-%d %H:%M:%S" "2021-10-22 0:00:00" +%Y-%m-%dT%H:%M:%S)
  echo "db.getCollection('$2').aggregate([{ \$match: { "timestamp" : " \
    "{\$gte:new ISODate('$t1'),\$lt:new ISODate('$t2')} } }," \
    "{ \$group: { _id: null, avg: { \$avg: \"\$rating\" } } }])"
done >> aggregate-$2-$1.js
```

I prepared three script sets with: 10K, 50K and 100K queries for both collections:

```shell
./gen-aggregate.sh 10000 coll-ts
./gen-aggregate.sh 50000 coll-ts
./gen-aggregate.sh 100000 coll-ts

./gen-aggregate.sh 10000 coll-ord
./gen-aggregate.sh 50000 coll-ord
./gen-aggregate.sh 100000 coll-ord
```

I made the measurements using following commands:

```shell
time mongo test aggregate-coll-ts-10000.js
time mongo test aggregate-coll-ord-10000.js

time mongo test aggregate-coll-ts-50000.js
time mongo test aggregate-coll-ord-50000.js

time mongo test aggregate-coll-ts-100000.js
time mongo test aggregate-coll-ord-100000.js

```

The results are shown in the table below:

| Number of queries | Normal collection [min:sec] | Time series [min:sec] | Diff |
| :----: | ----: | ----: | :----: |
| 10000 | 0:21,947 | 0:16,835 | -23% |
| 50000 | 1:37,02 | 1:11,18 | -26% |
| 100000 | 4:33,29 | 2:21,37 | -48% |

Although there are far fewer queries this time than in the previous experiment, the differences in times are much
greater. It clearly proves that time series collections are indeed spreading their wings when we want to use aggregation
queries and have been developed mainly for this purpose. The reason is probably the sequential way of writing data,
which shows a noticeable improvement when running ranged queries. The results clearly show also how much of an impact
query performance can have on an element that often doesn’t get the adequate attention: proper modelling the data.

## Limitations

Of course, time series collections also have their limitations and should not be used as a golden hammer.
We have already mentioned the first one — the lack of the primary key index. It stems from the assumption
that searches will be primarily based on time, so there is no point in creating an index that will be useful for very
few people. Of course, we can create this index ourselves.

It is also not possible to sort by time field, which is another inconvenience. If we want to have
sorting queries, we have to create an additional index.

Although these two missing indexes may seem to be an easy thing to fix, we must remember that it involves additional use
of disc space as well as longer indexing time during the saving of the document, which means that the benefits
stemming from the use of time series will be somewhat reduced.

The third, and perhaps most import limitation is the immutability of the document. Once saved, documents cannot be
updated or deleted. The only way to delete data is to use `drop()` command or to define retention for the collection
using the `expireAfterSeconds` parameter, which, like TTL indexes, will automatically delete documents certain time
after creation.

The lack of possibility to manipulate the saved documents will probably be the main reason why programmers will be
hesitant to use time series. We should mention, however, that the authors of MongoDB will probably add the possibility
to edit and delete documents in the future:

> While we know some of these limitations may be impactful to your current use case, we promise we’re working on this
> right now and would love for you to provide your feedback!

## Summary
Adding the ability to store time series in MongoDB is a step in the right direction. First tests show that in certain
cases the new type of collections really does work better than the regular ones. They use less disc space, are faster at
saving and searching by the time. But high performance always comes at a cost, in this case: the cost of reduced flexibility.
Therefore, the final decision to use time series should be preceded by an analysis of
advantages and disadvantages of both in particular cases. We should also hope that the authors of the database are
working on improving it and will soon eliminate most limitations.
