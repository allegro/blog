---
layout: post
title: Moving towards Micronaut
author: konrad.kaminski
tags: [tech, backend, performance, micronaut, kotlin, graalvm]
---
[Micronaut](https://micronaut.io) is one of the new application frameworks that have recently sprang up. It promises
low memory usage and faster application startup. At [Allegro](https://allegro.tech/) we decided to give it a try. In this article we’ll learn what
came out of it and if it’s worth considering when creating microservices-based systems.

## Paradise city
At Allegro we run a few hundred microservices, most of which use Spring Framework. We also have services created in other technologies.
And to make things more complicated we run them on a few different types of clouds - our own [Mesos](http://mesos.apache.org/)-based as well as private and public [k8s](https://kubernetes.io/)-based ones.
Therefore in order for all of it to work consistently and smoothly we created a number of supporting libraries and at the same time we defined a kind of
contract for all services. This way, if there is ever a need or will to create a service with a new shiny technology, it should be feasible with as little
work as possible. You can read more about this approach in [a great article by Piotr Betkier](https://blog.allegro.tech/2020/07/common-code-approach.html).

## (You Gotta) Fight for Your Right (To Party!)
In order to be up to date with current technologies, at Allegro we run hackathons where we try out the "trendy" solutions. Over a year ago
we decided to taste Micronaut. The framework represents one of the new approaches to some of the inherent problems of existing solutions:
it steers clear of using Java Reflection and does as much as it can at compile or rather build time. Major things achieved this way are:
* lower memory usage - Java Reflection in most current JDK implementations is a memory hog; Micronaut has its own implementation of Java Reflection-like API
  which doesn’t suffer from that problem,
* faster startup - Java Reflection is also not a speed daemon; doing things ahead of time means less has to be done at runtime,
* ability to create native apps - [GraalVM](https://www.graalvm.org), another new kid on the block, allows creating native binaries out of a JVM-based application; however, there
  are some caveats and one of them is... Java Reflection (basically if your application uses it, it has to provide some metadata for the native compiler). Since
  Micronaut has its own implementation, the problem is simply non-existent.

We wanted to see how difficult it is to create a new microservice with Micronaut that would run on our on-premise cloud and do something meaningful. So during
our hackathon we defined the following goals for our simple app:
* it should be possible to deploy the app on our on-premise cloud,
* the app should provide and use basic functionalities, such as:
  * telemetry,
  * configuration management,
  * REST endpoints,
  * ability to call other microservices,
  * ability to send messages to [Hermes](https://github.com/allegro/hermes),
  * database access (we voted for MongoDB),
  * (optionally) ability to be compiled into a native binary with GraalVM.

After a very satisfying hackathon we carried the day. Our microservice had all the above-mentioned functionalities - some of them obviously
in a makeshift form, but that didn’t matter. We achieved all the goals.

## Highway to Hell
The result of the hackathon pushed us forward to make something even bolder. We wanted to have a real Micronaut-based application in our production environment.
To make things harder - we wanted to convert an existing Spring-based system to a Micronaut-based one. Though we reached our destination, the road
was quite bumpy. Let’s see what awaits those who take that path.

### Paranoid
To ease a migration from Spring a special [micronaut-spring](https://micronaut-projects.github.io/micronaut-spring/latest/guide/) project has been created.
It supports a limited selection of Spring annotations and functionality so that in theory one can just replace Spring dependencies with Micronaut ones.
Specifically among the most interesting features are:
* standard inversion of control annotations: `@Component`, `@Service`, `@Repository`,`@Bean`, `@Autowired`, `@Configuration`, `@Primary` and many others
  are converted into their Micronaut counterparts,
* standard Spring interfaces: `@Environment`, `@ApplicationEventPublisher`, `@ApplicationContext`, `@BeanFactory` and their `@*Aware` versions are also
  adapted to their Micronaut counterparts,
* MVC controller annotations: `@RestController`, `@GetMapping`, `@PostMapping` and many others are converted into their Micronaut counterparts.

This makes the whole exercise simpler, but unfortunately it also comes at a price. Not all features are supported (e.g. Spring’s `@PathVariable` is not)
and for those which are, they sometimes have subtle differences. For this reason oftentimes you simply have to revert to the regular manual code
conversion. The problem is that this kind of approach will lead you to a mixed solution - you’ll have both Micronaut and Spring annotations in your code.
And then a question arises: which annotations should I use for the newly created code? Do we stick with the old Spring annotations if there is even
one instance of it in the current codebase? Or maybe treat this old code as a "necessary evil" and always put Micronaut annotations for the added functionality?

We came to the conclusion that we did not want to use _micronaut-spring_ at all. This
of course led to more work, but in the end we think it was worth it. The converted application does not have any Spring dependencies, no "technical debt".

### Sad but True

One of the things not covered at all by _micronaut-spring_ is exception handling in MVC.
In Spring our handlers looked something like this:

```kotlin
import org.springframework.http.HttpStatus.BAD_REQUEST

@ControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class DefaultExceptionHandler {

    @ExceptionHandler(SomeException::class)
    @ResponseBody
    fun handleSomeException(e: SomeException): ResponseEntity<*> = ResponseEntity(ApiError(e.message), BAD_REQUEST)
}
```

In Micronaut exception handling can be done locally (i.e. functions handling exception will only be used for the exceptions thrown by the controller the
functions are defined in) or globally. Since our Spring handlers acted globally, the equivalent Micronaut code is as follows:

```kotlin
import io.micronaut.http.HttpStatus.BAD_REQUEST
import io.micronaut.http.annotation.Error as HttpError

@Controller
class DefaultExceptionHandler {

    @Error(global = true)
    fun handleSomeException(e: SomeException): HttpResponse<*> =
        HttpResponseFactory.INSTANCE.status(BAD_REQUEST, ApiError(e.message))
}
```

### Dirty Deeds Done Dirt Cheap

At Allegro we use many different types of databases. The application of this exercise used MongoDB. As it turned out we couldn’t have chosen worse. Don’t get me
wrong - Micronaut supports most of the databases out there, but not all are treated equally well.

Since our system used [Spring Data](https://spring.io/projects/spring-data), we tried to find something similar from the Micronaut world. [Micronaut Data](https://micronaut-projects.github.io/micronaut-data/latest/guide/)
is - as its authors say - "inspired by _GORM_ and _Spring Data_". Unfortunately the inspiration doesn’t go too far. And in case of MongoDB it actually [doesn’t even
take a step](https://github.com/micronaut-projects/micronaut-data/issues/220). Instead, we used [Micronaut MongoDB](https://micronaut-projects.github.io/micronaut-mongodb/latest/guide/) library. This simple project will provide
your services only with either a [blocking MongoClient](https://mongodb.github.io/mongo-java-driver/4.3/apidocs/mongodb-driver-legacy/com/mongodb/MongoClient.html) or a
[reactive MongoClient](https://mongodb.github.io/mongo-java-driver/4.3/apidocs/mongodb-driver-reactivestreams/com/mongodb/reactivestreams/client/MongoClient.html)
along with some healthchecks. Not enough even for a modest application.

Fortunately some good people created [kmongo](https://litote.org/kmongo/) - a little library that helped us a lot in converting the database access part of our app.
At the end of the day, however, we had to create some support code to ease the migration.

The original application database access code was in the form of reactive repositories:

```kotlin
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document

@Document(collection = "users")
data class User(
    @Id val id: String,
    val name: String,
    val type: String
)

class UserRepository: ReactiveMongoRepository<User, String> {
    fun findFirstByTypeOrderByNameDesc(type: String): Mono<User>
}
```

We wanted to preserve the interface and as much code as possible. Here is what we had to do to get this effect.

First we decided that our components would use `MongoDatabase` rather than `MongoClient` offered by _Micronaut MongoDB_.
We had only one database so that was an obvious choice.

```kotlin
@Factory
class MongoConfig {
    @Singleton
    fun mongoDatabase(mongoClient: MongoClient, configuration: DefaultMongoConfiguration): MongoDatabase =
        mongoClient.getDatabase(configuration.connectionString.get().database)
}
```

Then there was the question of configuring _kmongo_. It wasn’t as straightforward as we’d thought it would be. Let’s take a look at the
final code.

```kotlin
@Factory
class KMongoFactory {

    @Singleton
    fun kCodecRegistry(): CodecRegistry {
        ObjectMappingConfiguration.addCustomCodec(JodaDateSerializationCodec) // 1 - custom Joda DateTime coded
        KMongoConfiguration.registerBsonModule(JodaModule())                  // 2 - register default Joda module
        KMongoConfiguration.registerBsonModule(JodaDateSerializationModule)   // 3 - register custom Joda module
        with(KMongoConfiguration.bsonMapper.factory as BsonFactory) {         // 4 - change BigDecimal handling
            disable(BsonGenerator.Feature.WRITE_BIGDECIMALS_AS_DECIMAL128)
            enable(BsonGenerator.Feature.WRITE_BIGDECIMALS_AS_STRINGS)
        }
        return ClassMappingType.codecRegistry(MongoClientSettings.getDefaultCodecRegistry())
    }
}
```

`MongoDB` driver expects a `CodecRegistry` which defines how to encode a Java object into Mongo `BSON`, so that it can be persisted in a database. By default
_kmongo_ supports a simple, [Jackson](https://github.com/FasterXML/jackson) based converter. However, there were a few issues in
our application which forced us to create some customizations:

* [Joda](https://www.joda.org/joda-time/) date types in entity classes - our app has a long history and it still uses _Joda_ date types.
  Unfortunately they do not work with _kmongo_, so we had to teach it how to handle them. It required a few steps.
  * (1) _kmongo_ had to know how to serialize a _Joda_ date type to a `MongoDB` date type:

    ```kotlin
    object JodaDateSerializationCodec : Codec<DateTime> {
        override fun encode(writer: BsonWriter, value: DateTime?, encoderContext: EncoderContext?) {
            if (value == null) {
                writer.writeNull()
            } else {
                writer.writeDateTime(value.millis)
            }
        }

        override fun getEncoderClass(): Class<DateTime> {
            return DateTime::class.java
        }

        override fun decode(reader: BsonReader, decoderContext: DecoderContext?): DateTime {
            return DateTime(reader.readDateTime())
        }
    }
    ```

  * (2) _Jackson_ used by _kmongo_ also had to know how to handle _Joda_ date types,
  * (3) to make things harder sometimes we stored a datetime as a long value, therefore we had to add support for that as well:

    ```kotlin
    object JodaDateSerializationModule : SimpleModule() {
        init {
            addSerializer(DateTime::class.java, JodaDateSerializer())
            addDeserializer(DateTime::class.java, JodaDateDeserializer())
        }
    }

    class JodaDateSerializer : JsonSerializer<DateTime>() {
        override fun serialize(value: DateTime, gen: JsonGenerator, serializers: SerializerProvider?) {
            gen.writeObject(value.toDate())
        }
    }

    class JodaDateDeserializer : JsonDeserializer<DateTime>() {
        override fun deserialize(parser: JsonParser, ctxt: DeserializationContext?): DateTime =
            when (parser.currentToken) {
                JsonToken.VALUE_NUMBER_INT -> parser.readValueAs(Long::class.java).let(::DateTime)
                else -> parser.readValueAs(Date::class.java).let(::DateTime)
            }
    }
    ```

  * (4) finally we stored `BigDecimal` values as plain `String`, which is not a default behaviour of _kmongo_, so we had to change it.

As you can see some of the problems we had to face came from using either old technologies or not using them properly. It turned out there were more issues.

For our entity IDs we usually used an artificial `String` value. `MongoDB` has special support for it in a form of [`ObjectId`](https://docs.mongodb.com/manual/reference/method/ObjectId/)
type, which we gladly used in our application. But, here a new issue came up - in order to make our integration tests easier to read and write we used `String`-type IDs
not conformant to `ObjectId` restrictions (so for example our user IDs were `user-1`, `user-2`, etc.).
_Spring Data_ handles this transparently, but here we had to introduce one more customization. Our entity classes now
had to contain a special annotation indicating what serializer to use for our ID fields:

```kotlin
import org.bson.codecs.pojo.annotations.BsonId

data class User(
    @BsonId @JsonSerialize(using = CustomIdJsonSerializer::class) val id: String,
    val name: String,
    val type: String
)

class CustomIdJsonSerializer : StdScalarSerializer<String>(String::class.java, false) {
    override fun serialize(value: String?, gen: JsonGenerator, serializers: SerializerProvider?) =
        if (value != null && ObjectId.isValid(value)) { gen.writeObjectId(ObjectId(value)) }
        else { gen.writeString(value) }

    override fun serializeWithType(value: String?, gen: JsonGenerator, serializers: SerializerProvider?, typeSer: TypeSerializer?) =
        serialize(value, gen, serializers)

    override fun isEmpty(value: String): Boolean = value.isEmpty()

    override fun acceptJsonFormatVisitor(visitor: JsonFormatVisitorWrapper?, typeHint: JavaType?) = visitStringFormat(visitor, typeHint)
}
```

With the basics set up we could now focus on how to make the `*Repository` classes work with as little effort as possible. We decided to create a base `BaseRepository`
class letting us write concrete `*Repository` classes easier:

```kotlin
abstract class BaseRepository<T>(
    private val mongoDatabase: MongoDatabase,
    private val collectionName: String,
    private val clazz: Class<T>
) {
    open fun findById(id: String): Mono<T> = findOne(eq("_id", id.maybeObjectId()))

    fun findOne(filter: Bson): Mono<T> = withCollection {
        find(filter).toMono()
    }

    fun <R> withCollection(fn: MongoCollection<T>.() -> R): R =
                mongoDatabase
                    .getCollection(collectionName, clazz)
                    .let(fn)
}
```

Finally we wrote the `*Repository` classes. A rewritten version of the `UserRepository` mentioned at the beginning of this section looked like this:

```kotlin
@Context
class UserRepository(
    mongoDatabase: MongoDatabase
): BaseRepository<User>(mongoDatabase, "users", User::class.java) {

    fun findFirstByTypeOrderByNameDesc(type: String): Mono<User> =
        withCollection {
            find(and(eq("type", type)))
                .sort(descending("name"))
                .limit(1)
                .toMono()
        }
}
```

### Fear of the Dark

[Spock](https://spockframework.org/spock/docs/2.0/index.html) is our framework of choice for writing tests. We still tend to use it even in `Kotlin` applications,
although sometimes the resulting code is not as clear as it'd be if not for `Groovy` (`coroutines!). So how does
_Micronaut_ work with _Spock_? Actually, quite well.

For testing there is a [micronaut-test](https://github.com/micronaut-projects/micronaut-test) project, which provides testing extensions for _Spock_
and many other testing libraries. [The general approach to writing test cases with Spring](https://docs.spring.io/spring-framework/docs/current/reference/html/testing.html) which we were familiar with,
is very similar in _micronaut-test_. Let’s have a look at a simple test case:

```groovy
@MicronautTest // 1
class SimpleIntSpec extends Specification {
    @Inject // 2
    UserService userService

    def "should persist a user"() {
        given:
        userService.createUser("user-1", "John", "Doe")

        when:
        def user = userService.getUser("user-1")

        then:
        user.firstName == "John"
        user.lastName == "Doe"
    }
}
```

There are two interesting things in this test case:
* (1) `@MicronautTest` is an annotation you have to put in your test classes to start _Micronaut_ application,
* (2) `@Inject` is [Micronaut](https://micronaut.io/)’s version of `@Autowired` (or... `@Inject`, which is also supported by `Spring`). Be aware that since
  _Micronaut_ `3.0.0` you should use `@jakarta.inject.Inject` annotation instead of the former `@javax.inject.Inject`.

If your tests make API calls to your application via REST endpoints, and you run your web container on a random port (which is common), then the way to retrieve it
is through the use of the injected `EmbeddedServer`:

```groovy
@MicronautTest
class ApiIntSpec extends Specification {
    @Inject
    EmbeddedServer server

    def "should create a user using API call"() {
        given:
        def url = "http://localhost:{$server.port}/users"

        when:
        // here goes your test...
    }
}
```

## Money

As a side effect, an additional benefit you get when you use _Micronaut_ is a faster development cycle. As stated at the
beginning of this post, one of the main features of this framework is faster startup. Therefore, when writing test cases and then running tests,
their execution time is lower than their Spring equivalent. This may not be significant if your tests are few, but sooner or later
their number will grow and then the speed will become more visible and important. For large codebases time savings can be really impressive.

## Should I stay or should I go

The experience we gained during migration to _Micronaut_ gave us more courage and assurance. So when the time came to decide what technology
to use for a quite large greenfield project, we didn’t hesitate (well, we actually did, but not for long).
Six months later with the system running in the production environment we’re happy we started that long journey. And if you're considering
_Micronaut_ for one of your projects, I can wholeheartedly recommend: go for it.
