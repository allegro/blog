---
layout: post
title: "Transactions in MongoDB"
author: [piotr.kisielewicz]
tags: [tech, techradar, NoSQL]
excerpt: >
    Let's look at what transactions in MongoDB are and how they differ from SQL transactions.
---
Since version 4.0, transactions have been introduced to the world of Mongo databases. However, the way they work differs greatly from the tried and true world of SQL.

In databases like PostgreSQL or MySQL there are transactions based on tables and relations with isolation levels such as `READ_UNCOMMITED`, `READ_COMMITED`, `REPEATABLE_READ` and `SERIALIZABLE`. These help us to recognize if the record we’re working on is dirty, both when we want to access it or when someone else wants to do it after we’ve made some changes. In the world of documents, shards and replicas, the changes made to a single document are already atomic by design.

Why do we need transactions then? I only talked about single documents. What about multi-document data, shards and replicas?

That’s why transactions were introduced into MongoDB. In this blog post, we will check how they work and what their use cases are.

### What is a transaction?

A Database transaction is a unit of work, designed to handle the changes of data in the database. It makes sure that the output of the data is consistent and doesn’t generate errors. It helps with concurrent changes to the database, and makes it more scalable.

By definition, database transactions are atomic, consistent, isolated and durable. Sounds familiar? Exactly, it’s **ACID**.

### Does MongoDB implement ACID?

Before implementing transactions? Not really. Of course, there are some properties of ACID that are present (as stated earlier), but before version 4.0 they were impossible to achieve in a distributed ecosystem.

Here’s an excerpt from the MongoDB website: [we estimate that 80%-90% of applications that leverage the document model will not need to utilize transactions in MongoDB](https://www.mongodb.com/basics/acid-transactions).

Alas, when you need to make changes to multiple documents, or worse, if they are split across multiple shards then there is no guarantee that the changes will adhere to ACID properties. That’s why the need for ACID transactions arose.

Fortunately, since version 4.0 transactions were added to MongoDB, first for multi-document changes, and then, in 4.2, for distributed data.

### Specifics of MongoDB transactions

Having in mind the differences between MongoDB and SQL DB engines, we need to first take a look at how transactions in Mongo are specified. Since the problems that arise from having multiple documents, replica sets and shards differ from the issues of concurrent access to a table row, then also the resolutions to these problems would be different in nature.

The transaction in MongoDB is denoted by two properties: **ReadConcern** and **WriteConcern**.

The **ReadConcern** property is used to control the consistency and isolation of the data we read from the database.

Similarly, the **WriteConcern** property is us defining when we consider the data we write to be consistent in the database.

(Side note: when we are talking about majority we are talking about calculated majority, you can read more about it in [Calculating majority count](https://www.mongodb.com/docs/manual/reference/write-concern/#std-label-calculating-majority-count))

We distinguish between three levels of `ReadConcern` for transactions (others are unavailable to use in this case):

- local, which reads the latest data from a node that has been queried. There are no guarantees that the data read is the most recent across the system,
- majority, which reads the data at the point of majority-commit. Said point is calculated by the primary node. This ReadConcern doesn’t guarantee consistency unless WriteConcern of at least majority is also stated,
- snapshot, which reads from a snapshot of majority-commited data. This ReadConcern level is mainly only available in transactions (so we can’t use it in single-document reads save for some outliers) and provides its benefits mainly with sharded transactions as it guarantees that the data is synchronized across shards

As we can see, we can draw some parallels between MongoDB's ReadConcern options and the SQL world, where local would be equal to READ UNCOMMITED, majority would be similar to REPEATABLE READ and snapshot has near likeness to SERIALIZABLE.

What about WriteConcerns? There are three main descriptors:
- 1, which basically means that we are only interested in primary node committing the changes. Unfortunately, using this WriteConcern means that you will have no guarantees for any of the ReadConcerns stated above,
- Any {number} greater than 1 states that we want to get the data committed by the primary and {number - 1} of secondary nodes. This WriteConcern depends on the amount of nodes in the system, since it can denote more than the majority of the nodes and in this case would provide us with read guarantees,
majority, which means that majority of nodes acknowledge the changes in data. This WriteConcern provides us with read guarantees, and also gives us benefits of eventual consistency.

### Enough theory, I want to see it in action!

For this example I’m using [MongoDB community edition 6.0 for macOS](https://www.mongodb.com/docs/manual/installation/).

I’ve created a MongoDB server consisting of one config database and one shard replica set with three members. You can find the steps in the official MongoDB [documentation](https://www.mongodb.com/docs/manual/tutorial/deploy-shard-cluster/).

To start, we need some data that’s already present in the database, so that we can see the changes that are being made. First, let’s connect to one of our nodes in a replica set:

```mongosh --host localhost --port 27027```

Then, let’s insert the following data:

```javascript
db.blog.insertMany([
    {
    "title": "GC, hands off my data!",
    "author": "Allegro Blogperson",
    "date": "Jun 30 2022",
    "url": "https://blog.allegro.tech/2022/06/gc-hands-off-my-data.html"
    },
    {
    "title": "How to facilitate EventStorming workshops",
    "author": "Blog Stormer",
    "date": "Jul 19 2022",
    "url": "https://blog.allegro.tech/2022/07/event-storming-workshops.html"
    },
    {
    "title": "MBox: server-driven UI for mobile apps",
    "author": "Mobile Guru",
    "date": "Aug 3 2022",
    "url": "https://blog.allegro.tech/2022/08/mbox-server-driven-ui-for-mobile-apps.html"
    }
])
```

Let’s also connect to a different node in our replica set:

```mongosh --host localhost --port 27028```

We can verify here that the data is present:

```db.blog.find()```

This should return all our data that we inserted earlier.
```javascript
[
    {
    _id: ObjectId("6311eebd6effda71326b35d3"),
    title: 'MBox: server-driven UI for mobile apps',
    author: 'Mobile Guru',
    date: 'Aug 3 2022',
    url: 'https://blog.allegro.tech/2022/08/mbox-server-driven-ui-for-mobile-apps.html'
    },
    {
    _id: ObjectId("6311eebd6effda71326b35d2"),
    title: 'How to facilitate EventStorming workshops',
    author: 'Blog Stormer',
    date: 'Jul 19 2022',
    url: 'https://blog.allegro.tech/2022/07/event-storming-workshops.html'
    },
    {
    _id: ObjectId("6311eebd6effda71326b35d1"),
    title: 'GC, hands off my data!',
    author: 'Allegro Blogperson',
    date: 'Jun 30 2022',
    url: 'https://blog.allegro.tech/2022/06/gc-hands-off-my-data.html'
    }
]
```

Time to add some data in a transaction. To do that, we first need to establish a transaction using the following command (in the first shell):

```var session = db.getMongo().startSession()```

After we start the session, it’s time to open the transaction:

```session.startTransaction({"readConcern": {"level": "snapshot"}, "writeConcern": {"w": "majority"}})```

Then, to make sure that we are using our collection in the context of a session, we need to run this:

```var blog = session.getDatabase('test').getCollection('blog');```

We can now insert new data into our collection while transaction is active:

```javascript
blog.insertOne({
        "title": "Transactions in MongoDB",
        "author": "Piotr Kisielewicz",
        "date": "Nov 30 2022",
        "url": "https://blog.allegro.tech/2022/11/transactions-in-mongodb.html"
    })
```
```
{acknowledged: true, insertedId: ObjectId("6319e60accc51dfa32ca495a")}
```

Before committing our transaction, let’s try to read the data from another replica (in the second shell which we opened previously):

```javascript
db.blog.find()
[
    {
    _id: ObjectId("6311eebd6effda71326b35d3"),
    title: 'MBox: server-driven UI for mobile apps',
    author: 'Mobile Guru',
    date: 'Aug 3 2022',
    url: 'https://blog.allegro.tech/2022/08/mbox-server-driven-ui-for-mobile-apps.html'
    },
    {
    _id: ObjectId("6311eebd6effda71326b35d2"),
    title: 'How to facilitate EventStorming workshops',
    author: 'Blog Stormer',
    date: 'Jul 19 2022',
    url: 'https://blog.allegro.tech/2022/07/event-storming-workshops.html'
    },
    {
    _id: ObjectId("6311eebd6effda71326b35d1"),
    title: 'GC, hands off my data!',
    author: 'Allegro Blogperson',
    date: 'Jun 30 2022',
    url: 'https://blog.allegro.tech/2022/06/gc-hands-off-my-data.html'
    }
]
```

As you can see, the new record is nowhere to be found. Let’s now commit the transaction (in the first shell):

```
session.commitTransaction();
{
    readOnly: false,
    ok: 1,
    lastCommittedOpTime: Timestamp({ t: 1662641697, i: 1 }),
    '$clusterTime': {
        clusterTime: Timestamp({ t: 1662641697, i: 1 }),
        signature: {
            hash: Binary(Buffer.from("0000000000000000000000000000000000000000", "hex"), 0),
            keyId: 0
        }
    },
    operationTime: Timestamp({ t: 1662641697, i: 1 })
}
```

And now, let’s run the same query (in the second shell):

```javascript
db.blog.find()
[
    {
    _id: ObjectId("6311eebd6effda71326b35d3"),
    title: 'MBox: server-driven UI for mobile apps',
    author: 'Mobile Guru',
    date: 'Aug 3 2022',
    url: 'https://blog.allegro.tech/2022/08/mbox-server-driven-ui-for-mobile-apps.html'
    },
    {
    _id: ObjectId("6311eebd6effda71326b35d2"),
    title: 'How to facilitate EventStorming workshops',
    author: 'Blog Stormer',
    date: 'Jul 19 2022',
    url: 'https://blog.allegro.tech/2022/07/event-storming-workshops.html'
    },
    {
    _id: ObjectId("6311eebd6effda71326b35d1"),
    title: 'GC, hands off my data!',
    author: 'Allegro Blogperson',
    date: 'Jun 30 2022',
    url: 'https://blog.allegro.tech/2022/06/gc-hands-off-my-data.html'
    },
    {
    _id: ObjectId("6319e60accc51dfa32ca495a"),
    title: 'Transactions in MongoDB',
    author: 'Piotr Kisielewicz',
    date: 'Sep 30 2022',
    url: 'https://blog.allegro.tech/2022/09/transactions-in-mongodb.html'
    }
]
```

Success! The data is now present after the commit, and we could see it being absent before committing the change.

### It was all in CLI, is there support for transactions in code?

Yeah, the drivers are already there! For example, if you are using Spring, the only thing you need to do to get MongoDB transaction support is to annotate your methods with ```@Transactional```.

If you’re using specific driver libraries, e.g. mongo-java-driver, then here’s a code snippet for you:

```kotlin
val client = new MongoClient(uri)
val db = client.getDatabase("blog")
val blogCollection = db.getCollection("blogPost", BlogPost::class.java)
val session = client.startSession()
try {
    blogCollection.insertOne(session, BlogPost())
    session.startTransaction(TransactionOptions.builder().writeConcern(WriteConcern.MAJORITY).build())
} catch (e: MongoCommandException) {
    session.abortTransaction()
} finally {
    session.close()
}
```


### Do we use MongoDB transactions at Allegro?

Not yet. We are evaluating transactions internally and are checking whether they would fit our use cases.

### Further reading

[ACID transactions in MongoDB](https://www.mongodb.com/basics/acid-transactions)

[MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/)

[Read concern](https://www.mongodb.com/docs/manual/reference/read-concern/)

[Write concern](https://www.mongodb.com/docs/manual/reference/write-concern/)

[spring-data-mongodb](https://spring.io/projects/spring-data-mongodb)

[mongo-java-driver](https://mongodb.github.io/mongo-java-driver/3.12/javadoc/com/mongodb/client/package-summary.html)



