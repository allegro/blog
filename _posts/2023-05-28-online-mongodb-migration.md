---
layout: post
title: Online MongoDB migration
author: szymon.marcinkiewicz
tags: [tech, mongodb, nosql, kotlin, open source, mongo change streams]
---

MongoDB is the most popular database used in Allegro. We have hundreds of MongoDB databases running on our on-premise servers. Last year we've decided that we need to migrate all our MongoDB databases from existing shared clusters to new MongoDB clusters hosted on Kubernetes pods with seperated resources. To perform migration of all databases we needed a method of moving all the data from old databases to the new ones, while at the same time keeping consistency between databases. That's how _mongo-migration-stream_ project was born.

## Why we needed to migrate MongoDB databases at all?

At Allegro we are managing tens of MongoDB clusters, with hundereds MongoDB databases running on them. This kind of approach, where one MongoDB cluster runs multiple MongoDB databases allowed us to utilize resources more effectively while easing maintenance of clusters.

![Old approach](/img/articles/2023-05-28-online-mongodb-migration/one_cluster_multiple_databases.png)
 
We've been living with this approach for years, but unfortunatelly with more and more databases created on various clusters it resulted in noisy neighbour problem.

### Noisy neighbour problem

Generally speaking, noisy neighbour situation happens when one application consumes so much resources (like CPU, RAM or Storage), that it causes starvation of other applications running on the same infrastructure.

In Allegro this problem started to be visible because over the years we created more and more new MongoDB databases which were distributed between fixed amount of clusters.

The most often cause of noisy neighbour problem in Allegro infrastructure was long time high CPU usage by one MongoDB database on a given cluster. On various occasions it occured that non-optimal query performed on humongous collection was consuming too much CPU time, negativelly affecting all the other databases on that cluster by making them slower or completely unresponsive.

![Cluster CPU usage](/img/articles/2023-05-28-online-mongodb-migration/cluster_cpu.png)

### MongoDB on Kubernetes as a solution for noisy neighbours problem

To solve noisy neighbours problem a separate team implemented the solution allowing Allegro developers to create independent MongoDB clusters on Kubernetes. From now, every new MongoDB cluster serves only one MongoDB database. Each cluster is formed from multiple replicasets and arbiter spread between datacenters. Running each database on separate cluster with isolated resources managed by Kubernetes solved our resource contention issue.

![Kubernetes CPU usage](/img/articles/2023-05-28-online-mongodb-migration/k8s_cpu.png)

## Available tools on the market

At this point we knew what we needed to do to solve our problems - we had to migrate all MongoDB databases from old shared clusters, to new independent clusters on Kubernetes. Now came more difficult part of _"how"_ should we do it. To be able to answer this question, we've started with preparing list of requirements, which needed to be met by a tool to migrate databases (referred to as _"migrator"_). 

### Requirements

- Migrator needs to support MongoDB versions from 3.6 to the newest one (at the time it was Mongo 6.0),
- Migrator must be able to migrate databases from older versions of MongoDB to newer ones (e.g. from 3.6 to 6.0),
- Migrator must be able to migrate replicasets and sharded clusters,
- Migration must be performed without any downtime,
- Migration cannot affect database clients,
- Migrator must be able to handle more than 10k writes per second,
- Migrator must copy indexes from source database to destination database,
- Database owners need to be able to perform migration by themselves,
- Migrator must be able to modify collection names.

### Existing solutions

With prepared list of requirements, we checked what tools were available on the market at the time.

#### [py-mongo-sync](https://github.com/caosiyang/py-mongo-sync)

Referring to documentation _py-mongo-sync_ is:

> "Oplog-based data sync tool that synchronizes data from a replica set to another deployment, e.g.: standalone, replica set, and sharded cluster."

After configuring _py-mongo-sync_ we realized that this tool doesn't suit our needs from end to end. _py-mongo-sync_ focuses mainly on synchronization of the data (it doesn't transfer existing data from source to destination database). What's more, at the time _py-mongo-sync_ supported MongoDB versions between 2.4 to 3.4, which were incompatible with ones used in Allegro.

#### [MongoDB Cluster-to-Cluster Sync](https://www.mongodb.com/docs/cluster-to-cluster-sync/current/)

On July 22, 2022 MongoDB released _mongosync_ v1.0 - a tool for migrating and synchronizing data between MongoDB clusters. As described in _mongosync_ documentation:

> "The mongosync binary is the primary process used in Cluster-to-Cluster Sync. mongosync migrates data from one cluster to another and can keep the clusters in continuous sync."

This description sounded like a perfect fit to our case! But after initial excitement (and hours spend on reading documentation) we realized, that we cannot use _mongosync_ as it was able to perform migration and synchronization process only if source database and destination database were both in the exact same version. It meant, that there was no option to migrate databases from MongoDB 3.6 to MongoDB 6.0, which was a no-go for us.

When we realised that there is no tool which meets all our requirements, we've made a tough decision to implement our own online MongoDB migration tool named _mongo-migration-stream_.

## mongo-migration-stream

_mongo-migration-stream_ is a tool which can be used to perform online migrations of MongoDB databases. It is composed of `mongodump`, `mongorestore` [MongoDB Command Line Database Tools](https://www.mongodb.com/docs/database-tools/), [Mongo Change Streams](https://www.mongodb.com/docs/manual/changeStreams/) and [Kotlin](https://kotlinlang.org/) application. To fully explain what _mongo-migration-stream_ is capable of and how it works, I will define glossary, present a bird's eye view of the tool, and provide implementation details.

### Glossary

- _Source database_ - MongoDB database which we would like to migrate,
- _Destination database_ - MongoDB database to which migrator will restore all the data dumped from _source database_,
- _Transfer_ - a process of copying existing data from _sorce database_, and putting it to _destination database_,
- _Synchronization_ - a process of keeping eventual consistency between _source database_ and _destination database_,
- _Migration_ - an end-to-end migration process formed of _transfer_ and _synchronization_ processes,
- _Migrator_ - a tool for performing _migrations_.

### Building blocks

As mentioned earlier to perform migrations _mongo-migration-stream_ utilises `mongodump`, `mongorestore`, Mongo Change Streams MongoDB utilities and Kotlin application.

- `mongodump` is used to dump _source database_ in form of binary file,
- `mongorestore`is used to restore previously created dump on _destination database_,
- Mongo Change Streams allow us to keep consistency between _source database_ and _destination database_,
- Kotlin application is orchestrating and managing all processes.

`mongodump` and `mongorestore` are resposible for the _transfer_ part of migration, where Mongo Change Streams are the main mechanism of _synchronization_ proces.

### Bird's eye view

To create a _migrator_, we firstly needed to came up with a concept how to preform _migrations_. The result was formed in list of steps which guarantees migration of all documents and keeps eventual consistency during synchronization phase.

General steps required to perform _migration_:
1. Start listening for Mongo Change Events on _source database_ and save all incoming Mongo Change Events in the queue,
2. Dump all the data from _source database_ using `mongodump`,
3. Restore all the data on _destination database_ using `mongorestore`,
4. Start to push all the changes stored on the queue (changes on _source database_) to the _destination database_,
5. Wait for the queue to empty to establish eventual consistency.

![Migration process](/img/articles/2023-05-28-online-mongodb-migration/migration_process.png)

### Implementation
mongo-migration-stream is implemented...

Operations stored on the queue are idempotent.


## Performance issues and improvements

After implementing mongo-migration-stream and testing it locally on small constantly-populated databases, it was time to verify its performance on real-world databases.

### Reactive MongoDB source client

Describe how it was working at the beginning (synchronous MongoDB client with event loop 1s) vs new approach with Reactive MongoDB Client.

### Rebuilding indexes in the background

We've changed process of rebuilding indexes from using mongorestore to custom solution (Kotlin code)

### Admin user for destination database

Next phase of testing mongo-migration-stream showed that there is a problem with long batch processing on destiation databases:

```
2023-06-10 12:00:00.000	Sending batch of size: [1000] to destination mongo took: [29175 ms]
```

We've fixed that by connecting with admin user to destination database (instead of regular user with RW access).

## Achievements // What we've managed to do with mongo-migration-stream

- How many DBs we were able to migrate?
- What was largest DB that we've migrated?
- How many wps mongo-migration-stream handled?
