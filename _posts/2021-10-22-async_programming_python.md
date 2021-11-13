---
layout: post
title: "How do coroutines work internally in Python?"
author: [tomasz.szewczyk]
tags: [tech, python, async, coroutines]
---

Most of applications we create are basically loops. An average program waits
for an event, then processes it following some business logic. Afterwards it
begins waiting for another event to arrive.  Java Servlets works this way too. 
Popular frameworks such as Spring allow us to only care about the business logic, 
while the framework takes care of the application main loop.

### The problem with blocking operations
Imagine a very simple web application whose task is to calculate currency
exchange rates. It uses no framework, only operating system API or methods from
your favourite language standard library. It waits for a request with the amount,
base and target currencies and responds with a calculated output. In its simplest
form it could have all the exchange rates hardcoded, so the operation is very
fast and efficient. We can assume that such an application uses all the
available processing power when processing requests.

But in the next iteration we want our app to query another service for current
rates instead of relying on hardcoded values. We will soon discover our app is
spending most of its time waiting for a response from the other service.

Network communication is very slow after all. Let’s assume that a simple request
takes at least 1ms to complete. Modern processors have clock frequencies up to
5GHz and, providing the data and code are already cached, they are capable of
at least one simple operation per cycle. This means we could have done at least
5 * 10e6 simple operations while waiting for the request to complete! What a
waste of resources!

### Classic approach with threads
The most obvious solution to this issue are threads. We could refactor our
application so that when it receives the request it passes it to a separate
thread. This way we don’t have to worry about blocking operations in the
business logic. It is the operating system’s responsibility to allocate CPU to
something meaningful while our thread is blocked waiting for the other service.
This is how most of the applications I have been working on work.

Unfortunately this approach has some drawbacks as well. Threads consume a lot of
resources and you can only create a limited number of them. Very soon you
discover threads are a precious resource on their own and you can hardly afford
them sitting and waiting for a request to complete. You need to consider your
thread pool allocation policy in order not to starve some part of your
application. Add race conditions and other concurrency related issues and it
suddenly gets overcomplicated.

### How about we don't block
Let’s assume you decide threads are too expensive, too cumbersome or they are
simply not available on your platform, because for example you are writing bare
metal applications and there is no operating system. When we decide not to use 
threading we have to keep in mind we cannot afford having any blocking operations 
in our application, because they are wasting our resources. Having no threads
there is no way to use time when something blocks.

The new idea for the programm architecture is as follows:
- Wait for an event to happen.
- If the event is a new request arriving to an endpoint, then we only setup
the request to another service and return.
- If the event is a response from the other service, then
we consume the received data and we setup a response to the original request.

This way we don’t have any blocking operation in our application, hence it is
very efficient.

## Low level async API
Linux and similar operating systems provide us with a convenient API for many
blocking operations. For example, the `accept` system call is used to get an 
incoming TCP connection from a queue of pending connections or wait for one 
to show up. You can read more about `accept` in [the Linux manual](https://man7.org/linux/man-pages/man2/accept.2.html).

Similarly `write` and `read` functions, defined by POSIX standard, are used 
to send and receive data over the created connection. Both can also block 
waiting for the I/O operation to become possible. You can read more about these 
functions in Linux manual: [read](https://man7.org/linux/man-pages/man2/read.2.html), 
[write](https://man7.org/linux/man-pages/man3/write.3p.html).

As you may have already noticed, our asynchronous application only makes sense
when there is only one blocking operation in the whole program. Earlier we
called it “waiting for an event to happen”. In Linux we can achieve such a
behaviour using `select` or `poll` system calls. `poll` is basically a more modern
version of `select`. In practice we can provide them with a set of event
descriptors and they will block until one of expected events occurs. You can 
read more about these calls in Linux manual: [select](https://man7.org/linux/man-pages/man2/select.2.html), 
[poll](https://man7.org/linux/man-pages/man2/poll.2.html).

## Select in Python
This API can be accessed in Python with a convenient wrapper provided by the
Python standard library. It hides some complicated low level aspects of the 
operating system API which is good for this article. Read more about 
`selectors` module in [the Python documentation](https://docs.python.org/3/library/selectors.html#module-selectors).

Basically we can register an event we want to wait for using the `register`
method, then we wait for any registered event to happen using the `select`
method. Python standard library provides us with `DefaultSelector` which is an
alias for the most efficient implementation on the current platform, so that we
don’t have to dive into low level details if we don’t want to.

### Simplest async application
For the sake of simplicity of the examples I won’t use `Selector` and I won’t
try to create an async http client from scratch. There are simply too many
unrelated low level details. Surprisingly, the simplest GET request consists
of numerous blocking operations. Instead, I propose the simplest and most easily
controllable blocking operation there is: waiting for user input.

Let’s replace the complicated `selector` with a simple `input` function and
model events with letters. Here is how such an app could look like:

```python
def process_a():
    print("Processing event A")


def process_b():
    print("Processing event B")


def process_c():
    print("Processing event C")


def app():
    while True:
        event = input("> ").strip()

        if event == "A":
            process_a()
        elif event == "B":
            process_b()
        elif event == "C":
            process_c()


if __name__ == "__main__":
    app()
```

```
$ python manual_async_simple.py
> A
Processing event A
> B
Processing event B
> C
Processing event C
```

As you can see we create an event loop listening for events (user input), 
then it dispatches the event to the relevant handler. Note how the `input`
function inside the event loop is the only blocking operation in the whole 
program.

### More complex flow of execution
As I already mentioned, creating asynchronous applications is easy as long as
there is no blocking operation while processing events. The aforementioned
example was so simple because there weren’t any. When there is some blocking
operation we have to split our processing logic into parts, each one ending
when there is a need for some blocking operation.

For example imagine a `Task` which is triggered with event A, but then it has
to wait for events B and C in order to complete. You need separate chunks of
code to process each event and some way to hold the `Task` state. One could
code it that way:

```python
class Task:
    COUNTER = 0

    def __init__(self):
        self.state = "AWAITING A"
        self.id = Task.COUNTER
        Task.COUNTER += 1

    def process_a(self):
        print(f"{self.id} Processing event A, blocking on B")
        self.state = "AWAITING B"
        return True

    def process_b(self):
        print(f"{self.id} Processing event B, blocking on C")
        self.state = "AWAITING C"
        return True

    def process_c(self):
        print(f"{self.id} Processing event C, task done")
        self.state = "DONE"
        return True

    def process_new_event(self, event):
        if self.state == "AWAITING A" and event == "A":
            return self.process_a()

        if self.state == "AWAITING B" and event == "B":
            return self.process_b()

        if self.state == "AWAITING C" and event == "C":
            return self.process_c()

        return False


def app():
    tasks = []
    while True:
        print(f"Task queue size {len(tasks)}")
        event = input("> ").strip()

        if event == "A":
            tasks.append(Task())

        for task in tasks:
            if task.process_new_event(event):
                if task.state == "DONE":
                    tasks.remove(task)
                break


if __name__ == "__main__":
    app()
```

```
$ python manual_async_with_state.py
Task queue size 0
> A
0 Processing event A, blocking on B
Task queue size 1
> A
1 Processing event A, blocking on B
Task queue size 2
> A
2 Processing event A, blocking on B
Task queue size 3
> B
0 Processing event B, blocking on C
Task queue size 3
> C
0 Processing event C, task done
Task queue size 2
> B
1 Processing event B, blocking on C
Task queue size 2
> C
1 Processing event C, task done
Task queue size 1
> B
2 Processing event B, blocking on C
Task queue size 1
> C
2 Processing event C, task done
Task queue size 0
```

Pay attention to how hard it is to extract the actual flow of the `Task` from
the example. The `Task` is split into three separate methods, each one
responsible for a part of the process. There is also a state persisted through
consecutive events.

The bright side is the code actually works. You can go through a `Task`
triggering events A, B and C, but you can also start a number of *Tasks* in
parallel by sending a lot of A events in a row. You can then advance these
*Tasks* by sending events they are waiting for.

With classic threaded approach it would be most likely easy to saturate thread
pool even by hand. With our asynchronous example you can have a ton of *Tasks*
in progress without any overhead, so the main goal is accomplished.

## Disadvantages of asynchronous approach
We learned that asynchronous approach results in an efficient application, but
also has some drawbacks. For starters, your code does not reflect your program
logic directly. Instead, you have to manually control the flow, maintain state
and pass requests' context around which is cumbersome and error prone.

Your application business logic is hidden under implementation details and the
architecture of your solution is determined by the way you decided to deal with
asynchronous operations. You have to stick to a set of complicated rules when
developing new features.

If only there were functions that could be easily suspended! We then could
create our business logic in a convenient way and achieve asynchronous
behaviour at the same time. Instead of passing context around fragments of our
program, we could just suspend the execution of a function while there is some
blocking operation going on. That would be great, wouldn’t it?

## Generators
According to the glossary of Python official documentation a generator is a
function which contains `yield` expressions. Each `yield` temporarily suspends
processing, remembering the location execution state. When the generator
resumes, it picks up where it left off. It seems generators are indeed
functions that can be easily suspended. That is exactly what we were looking
for!

### A closer look at generators
Let’s take a closer look at generators. How do they work and what is their
purpose? First let’s write a function that prints Fibonacci numbers.

```python
def print_fibonacci(i):
    a, b = 1, 1
    for _ in range(i):
        print(a)
        b, a = a + b, b


if __name__ == "__main__":
    print_fibonacci(5)
```

```
$ python print_fibonnaci.py
1
1
2
3
5
```

Next, replace the call to print function with `yield` expressions and use our
function as an iterable.

```python
def yield_fibonacci(i):
    a, b = 1, 1
    for _ in range(i):
        yield a
        b, a = a + b, b


if __name__ == "__main__":
    for f in yield_fibonacci(5):
        print(f)
```

```
$ python yield_fibonnaci.py
1
1
2
3
5
```

As you can see, the function became a generator when we used `yield` expression
inside it. When the program reaches `yield` expression, the execution is suspended
and a value is used as an output. From the outside, the generator behaves like
an iterable or even like a stream, because the values we iterate over are not
stored in memory. They are generated when needed.

There can be multiple `yield` expressions in the generator. When execution reaches
the end of the generator, the `StopIteration` exception is thrown, just like
with iterators.

### Yield from and return
You can embed one generator inside another with `yield from` expression. In the
following example there is a generator using another generator twice to
generate increasing and decreasing numbers.

```python
def step_generator(start, stop, step):
    i = 0
    while start + step * i != stop:
        yield start + step * i
        i += 1


def wrapper_generator(start, stop):
    yield from step_generator(start, stop, 1)
    yield from step_generator(stop, start, -1)


if __name__ == "__main__":
    for f in wrapper_generator(0, 5):
        print(f)
```

```
$ python yield_twice.py
0
1
2
3
4
5
4
3
2
1
```

What is more, a generator can also have a return statement. The returned value
will be used as a payload to StopIteration exception raised when the iteration
is over or (much more usefully) it can be used as a result of `yield from`
expression.

```python
def step_generator(start, stop, step):
    i = 0
    while start + step * i != stop:
        yield start + step * i
        i += 1
    return i


def wrapper_generator():
    count = yield from step_generator(0, 10, 2)
    print(f"Generated {count} numbers")


if __name__ == "__main__":
    for f in wrapper_generator():
        print(f)
```

```
$ python returning_generator.py
0
2
4
6
8
Generated 5 numbers
```

### Exceptions inside generators
If an exception is raised within the generator it can be caught using the
regular try/except statement in the wrapping generator.

```python
def failing_generator():
    yield 0
    raise Exception("Generator error")
    yield 1


def wrapper_generator():
    try:
        yield from failing_generator()
    except:
        print("Something went wrong")


if __name__ == "__main__":
    for f in wrapper_generator():
        print(f)
```

```
$ python failing_generator.py
0
Something went wrong
```

You can read more about generators in [Python documentation](https://docs.python.org/3/howto/functional.html#generators).

## Async code using generators
So we know that generators superficially behave like a stream of values.
On the inside they look very similar to regular functions. Their execution
flow is easy to understand, because they work just like our standard imperative
code. And we know they can be easily suspended. What if we model asynchronous
operations as generators of events to be waited for? We could `yield` all the
events from generators and still have readable and maintainable logic inside.

Our generators could be kept in a map, connecting the generator to the event it
is waiting for. When the event occurs we can simply take the next event from
the generator and again wait for it to happen.

Inside the generator we can have any amount of logic among `yield` expressions as
long as there are no blocking operations. Basically, we write our logic as if it
was synchronous code but instead of blocking on some operation we *yield* what we 
are waiting for.

Let’s rewrite the example with tasks waiting for user input using the new
approach.

```python
counter = 0


def wait_for_b():
    yield "B"


def wait_for_c():
    yield "C"


def task_generator():
    global counter
    id = counter
    counter += 1

    print(f"{id} Processing event A, blocking on B")
    yield from wait_for_b()
    print(f"{id} Processing event B, blocking on C")
    yield from wait_for_c()
    print(f"{id} Processing event C, task done")


def app():
    tasks = {"A": [], "B": [], "C": []}
    while True:
        print(f"Task queue size {len(tasks['A'] + tasks['B'] + tasks['C'])}")
        event = input("> ").strip()

        if event == "A":
            new_task = task_generator()
            waiting_for = new_task.send(None)
            tasks[waiting_for].append(new_task)

        if len(tasks[event]):
            task = tasks[event][0]
            tasks[event].remove(task)
            try:
                waiting_for = task.send(None)
                tasks[waiting_for].append(task)
            except StopIteration:
                pass


if __name__ == "__main__":
    app()
```

```
$ python yield_based_coroutines.py
Task queue size 0
> A
0 Processing event A, blocking on B
Task queue size 1
> A
1 Processing event A, blocking on B
Task queue size 2
> A
2 Processing event A, blocking on B
Task queue size 3
> B
0 Processing event B, blocking on C
Task queue size 3
> B
1 Processing event B, blocking on C
Task queue size 3
> C
0 Processing event C, task done
Task queue size 2
> C
1 Processing event C, task done
Task queue size 1
> B
2 Processing event B, blocking on C
Task queue size 1
> C
2 Processing event C, task done
Task queue size 0
```

By simply replacing our complicated `Task` class with a short generator
function and queue of tasks with a map of generators and their previously
yielded values we manage to get very convenient, yet still very efficient
asynchronous code. Actually, these are called coroutines!

## Replace yield with await
Do you think I’m stretching reality a little bit by calling generators
coroutines? Let’s see. First replace all `yield from` expressions with `await`.
Next add an `async` keyword to the generator definition. Finally wrap the
events we await into classes with the `__await__` operator method.

```python
counter = 0


class WaitB:
    def __await__(self):
        yield "B"


class WaitC:
    def __await__(self):
        yield "C"


async def coroutine():
    global counter
    id = counter
    counter += 1

    print(f"{id} Processing event A, blocking on B")
    await WaitB()
    print(f"{id} Processing event B, blocking on C")
    await WaitC()
    print(f"{id} Processing event C, task done")


def app():
    tasks = {"A": [], "B": [], "C": []}
    while True:
        print(f"Task queue size {len(tasks['A'] + tasks['B'] + tasks['C'])}")
        event = input("> ").strip()

        if event == "A":
            new_task = coroutine()
            waiting_for = new_task.send(None)
            tasks[waiting_for].append(new_task)

        if len(tasks[event]):
            task = tasks[event][0]
            tasks[event].remove(task)
            try:
                waiting_for = task.send(None)
                tasks[waiting_for].append(task)
            except StopIteration:
                pass


if __name__ == "__main__":
    app()
```

```
$ python yield_based_coroutines.py
Task queue size 0
> A
0 Processing event A, blocking on B
Task queue size 1
> A
1 Processing event A, blocking on B
Task queue size 2
> A
2 Processing event A, blocking on B
Task queue size 3
> B
0 Processing event B, blocking on C
Task queue size 3
> B
1 Processing event B, blocking on C
Task queue size 3
> C
0 Processing event C, task done
Task queue size 2
> C
1 Processing event C, task done
Task queue size 1
> B
2 Processing event B, blocking on C
Task queue size 1
> C
2 Processing event C, task done
Task queue size 0
```

This code still runs OK! We can have a ton of opened tasks and we won’t
saturate any precious resource. What is more, you wouldn’t guess that
we had implemented this ourselves by looking at the actual coroutine.

Now you can just replace `input` with `select` and `yield` descriptors of
actual blocking operations like reading from socket and you can create your own
asynchronous HTTP application.

## Python asyncio
Actually the async/await syntax is present only since Python 3.7. Prior to 3.7
coroutines were actually written as generators with special annotation attached
to them.

Python standard library provides us with a ready to use event loop to run our
coroutines as well as a set of convenient awaitable operations covering all the
lowest level blocking operations we usually deal with. If you want to learn more
about low level async API in Python,
[PEP3156](https://www.python.org/dev/peps/pep-3156/) is a great place to start.

Furthermore, there are a huge number of libraries making use of this low level
API. They implement HTTP clients, web frameworks, database drivers and many
others. My favourite asynchronous libraries in Python are: 
asynchronous HTTP client [aiohttp](https://docs.aiohttp.org/en/stable/), 
web framework [FastAPI](https://fastapi.tiangolo.com/) and 
MongoDB driver [Motor](https://motor.readthedocs.io/en/stable/).

In fact, the Python event loop actually runs on futures, also known as promises
in other languages. Coroutines are implemented with tasks which rely on
futures, so our implementation is actually simplified. You should remember that
when looking into Python sources, so you don’t get confused!

When I first started learning coroutines I had hard times trying to figure out
all the strange behaviours myself. It was only the understanding of how things
work inside that helped me finally feel it. I hope my explanation will help you
not only understand how to use coroutines, but also let you gain
confidence and intuition about how asynchronous programming works.

Happy coding!
