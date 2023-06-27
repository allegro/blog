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

At this point we knew what we needed to do to solve our problems - we had to migrate all MongoDB databases from old shared clusters, to new independent clusters on Kubernetes. Now came more difficult part of _"how"_ should we do it.

## Available tools on the market

Firstly, we've started with preparing list of requirements, which needed to be met by a tool to migrate databases (referred to as _"migrator"_). 

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

_mongo-migration-stream_ is a tool which can be used to perform online migrations of MongoDB databases. It utilises `mongodump` and `mongorestore` [MongoDB Command Line Database Tools](https://www.mongodb.com/docs/database-tools/), [Mongo Change Streams](https://www.mongodb.com/docs/manual/changeStreams/) and [Kotlin](https://kotlinlang.org/) application. To fully explain what _mongo-migration-stream_ is capable of and how it works, I will define glossary, present building blocks and a bird's eye view of the tool, and provide implementation details.

### Glossary

- _Source database_ - MongoDB database which we would like to migrate,
- _Destination database_ - MongoDB database to which we would like to migrate all the data from _source database_,
- _Transfer_ - a process of copying dumping data from _sorce database_, and restoring it on _destination database_,
- _Synchronization_ - a process of keeping eventual consistency between _source database_ and _destination database_,
- _Migration_ - an end-to-end migration process formed of _transfer_ and _synchronization_ processes,
- _Migrator_ - a tool for performing _migrations_.

### Building blocks

As mentioned earlier to perform migrations _mongo-migration-stream_ utilises `mongodump`, `mongorestore`, Mongo Change Streams and Kotlin application.

- `mongodump` is used to dump _source database_ in form of binary file,
- `mongorestore` is used to restore previously created dump on _destination database_,
- Mongo Change Streams allow us to keep consistency between _source database_ and _destination database_,
- Kotlin application is orchestrating, managing and monitoring all above processes.

`mongodump` and `mongorestore` are resposible for the _transfer_ part of migration, where Mongo Change Streams play the main role in _synchronization_ proces mechanism.

### Bird's eye view

To create a _migrator_, we firstly needed to came up with a concept how to preform _migrations_. The result was formed in list of steps which guarantees migration of all documents and keeps eventual consistency during synchronization phase.

General steps required to perform _migration_:
1. Start listening for Mongo Change Events on _source database_ and save all incoming Mongo Change Events in the queue,
2. Dump all the data from _source database_ using `mongodump`,
3. Restore all the data on _destination database_ using `mongorestore`,
4. Start to push all the changes stored on the queue (changes on _source database_) to the _destination database_,
5. Wait for the queue to empty to establish eventual consistency.

![Migration process](/img/articles/2023-05-28-online-mongodb-migration/migration_process.png)

One may ask, why we're subscribing to Mongo Change Stream before starting `mongodump` command? The answer is simple - in case where collection copes with high amount of writes we need to assure that no change from _source database_ will be lost during migration phase. Diagram below shows such kind of _write anomaly_ during migration.

![Avoiding event loss](/img/articles/2023-05-28-online-mongodb-migration/avoiding_event_loss.png)

This means, that each Mongo Change Event stored in the queue is idempotent, as migration is finished after processing all events from the queue.

### Implementation

There is a ton of technicalities behind _mongo-migration-stream_, and I will try to focus on the most important ones.

#### Concurrency

From the beginning we wanted to make _mongo-migration-stream_ fast - we knew that it would needed to cope migrating databases with more than 10k writes per second. As a result _mongo-migration-stream_ paralellizes migration of one MongoDB database into migration of multiple collections. Each migration consists multiple little _migrators_ in itself - one _migrator_ per collection in the database.

_Transfer_ process is performed in paralell for each separate collection. Every collection is dumped and restored individually, on separate thread pool. When it comes to _synchronization_ process, it was also implemented concurrently. At the beginning of migration, each collection on _source database_ is watched individually using [Mongo Change Streams with collection target](https://www.mongodb.com/docs/manual/changeStreams/#watch-a-collection--database--or-deployment). Each collection has its own queue, where events from Mongo Change Streams are stored. At final phase of migration, each of these queues is processed independently.

![Concurrent migrations](/img/articles/2023-05-28-online-mongodb-migration/concurrent_migrations.png)

#### Initial data transfer

To perform transfer of the database, we're executing `mongodump` and `mongorestore` commands for each collection. To achieve that, machines where _mongo-migration-stream_ is running need to have MongoDB Command Line Database Tools installed.

Exporting data from collection `collectionName` in `source` database can be done with command:

```shell
mongodump \
 --uri "mongodb://mongo_rs36_1:36301,mongo_rs36_2:36302,mongo_rs36_3:36303/?replicaSet=replicaSet36" \
 --db source \
 --collection collectionName \
 --out /tmp/mongomigrationstream/dumps
```

In `mongo-migration-stream` this command (in form of list of Strings) is prepared with `prepareCommand` function:

```kotlin
override fun prepareCommand(): List<String> = listOf(
    mongoToolsPath + "mongodump",
    "--uri", dbProperties.uri,
    "--db", dbCollection.dbName,
    "--collection", dbCollection.collectionName,
    "--out", dumpPath,
    "--readPreference", readPreference
) + credentialsIfNotNull(dbProperties.authenticationProperties, passwordConfigPath)
```

Previously prepared command in form of list of Strings is run using Java's `ProcessBuilder` feature.

```kotlin
fun runCommand(command: Command): CommandResult {
    val processBuilder = ProcessBuilder().command(command.prepareCommand()) // <- Here we're calling prepareCommand
    currentProcess = processBuilder.start()
    
    // ...
    
    val exitCode = currentProcess.waitFor()
    stopRunningCommand()
    return CommandResult(exitCode)
}
```

Adequate procedure is implemented to execute `mongorestore` command.

#### Event queue

During process of migration _source database_ is constantly receiving write requests, which _mongo-migration-stream_ is watching by using Mongo Change Streams. Events from the stream are saved in the queue, to be send later to the _destination database_. Currently _mongo-migration-stream_ provides two implementations of the queue - one is in memory and the other is persistent.

In memory implementation can be used for databases with low traffic, or on machines with huge amount of RAM (as events are stored as objects on JVM heap), or for testing purposes.

```kotlin
// In memory queue implementation
internal class InMemoryEventQueue<E> : EventQueue<E> {
    private val queue = ConcurrentLinkedQueue<E>()

    override fun offer(element: E): Boolean = queue.offer(element)
    override fun poll(): E = queue.poll()
    override fun peek(): E = queue.peek()
    override fun size(): Int = queue.size
    override fun removeAll() {
        queue.removeAll { true }
    }
}
```

In our production setup we're using persistent event queue, which is implemented using [BigQueue project](https://github.com/bulldog2011/bigqueue). As BigQueue only allows enqueuing and dequeuing byte arrays, we had to properly serialize and deserialize data from the events.

```kotlin
// Persistent queue implementation
internal class BigQueueEventQueue<E : Serializable>(path: String, queueName: String) : EventQueue<E> {
    private val queue = BigQueueImpl(path, queueName)

    override fun offer(element: E): Boolean = queue.enqueue(element.toByteArray()).let { true }
    override fun poll(): E = queue.dequeue().toE()
    override fun peek(): E = queue.peek().toE()
    override fun size(): Int = queue.size().toInt()
    override fun removeAll() {
        queue.removeAll()
        queue.gc()
    }

    private fun E.toByteArray(): ByteArray = SerializationUtils.serialize(this)
    private fun ByteArray.toE(): E = SerializationUtils.deserialize(this)
}
```

#### Migrating indexes

To migrate indexes without blocking migration process, we've came up with a solution which for each migrated collection, fetches all indexes for that collection, and then rebuilds them on destination database. For older versions of MongoDB we are specifying `{ background: true }` option, [which does not block all operations on given database](https://www.mongodb.com/docs/v3.6/core/index-creation/).

```kotlin
private fun getRawSourceIndexes(sourceToDestination: SourceToDestination): List<Document> =
    sourceDb.getCollection(sourceToDestination.source.collectionName).listIndexes()
        .toList()
        .filterNot { it.get("key", Document::class.java) == Document().append("_id", 1) }
        .map {
            it.remove("ns")
            it.remove("v")
            it["background"] = true
            it
        }
```

If the _destination database_ is newer or equal than MongoDB 4.2, `{ background: true }` option is ignored as [optimized index build is used](https://www.mongodb.com/docs/manual/core/index-creation/#comparison-to-foreground-and-background-builds). In both cases index rebuild does not block synchronization process. 

#### Application modules

_mongo-migration-stream_ code was divided into two separate modules: `mongo-migration-stream-core` module which can be used as an library in JVM application and `mongo-migration-stream-cli` module which can be run as standalone JAR. In Allegro production setup, we are using _mongo-migration-stream_ as a library, but migrator can be easily runned as a standalone JAR with proper configuration provided.

This is API of provided by the `mongo-migration-stream-core`:

```kotlin
class MongoMigrationStream(
    properties: ApplicationProperties,
    meterRegistry: MeterRegistry
) {
    val stateInfo = StateInfo(properties.stateConfig.stateEventHandler)
    private val migrationController = MigrationController(properties, stateInfo, meterRegistry)

    fun start() {
        migrationController.startMigration()
    }

    fun stop() {
        migrationController.stopMigration()
    }

    fun pause() {
        migrationController.pauseMigration()
    }

    fun resume() {
        migrationController.resumeMigration()
    }
}
```

And here you can find how _mongo-migration-stream_ can be run using standalone JAR:

```shell
java -jar mongo-migration-stream-cli.jar --config /Users/szymon.a.marcinkiewicz/Projects/allegro/mongo-migration-stream/config/local/application.properties
```

#### Verification of migration state

- Scheduled verification after all migrators get into queue processing state
- Events on each change
- Micrometer metrics
- Logs

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
