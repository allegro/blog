---
layout: post
title: Finite-state machines made easy
author: [tymon.felski]
tags: [tech, dotnet, state_machine, allegro_pay]
---

Coordinating complex processes, both business and technical, can be a challenging issue in a distributed system.
Especially when the complications associated with them, such as concurrency, idempotency, scalability and hindered
testability, come into play — possibly all at once.
This is definitely something that can keep many programmers awake at night.

While this may sound dramatic, in reality there are many different solutions to this problem.
One group of such solutions extensively uses finite-state machines also known as finite-state automata.
As this article is meant for everyone, let’s start with some background information about what they are and how
they work.

## What are finite-state machines

For the sake of readability, I will sometimes be referring to finite-state machines as to “just” state machines.
If you’re already familiar with their formal definition, you may skip to the next section.

Formally speaking, a finite-state machine is a mathematical model of computation that describes an abstract system
having a finite number of permissible states. At any given point in time, the system is in exactly one of these
states.

In practical terms such a machine is described by:

- an initial (start) state,
- a set of possible states,
- a sequence of possible inputs (events),
- a transition function which based on the last observed input and the machine’s current state, determines the next
state,
- and a set of terminal (end) states — optionally.

The machine starts off in the initial state and inspects all inputs in sequence.
Upon observing each input, it uses the transition function to change its state.
The processing ends once all inputs have been observed.
If the machine’s state at the end of processing is one of the terminal states, it is said that the machine accepts the
given input, and rejects it otherwise.

As a side note, the description provided above uses the deterministic model of a finite-state automaton.
There are also alternative, non-deterministic machines, but I won’t be delving into them too much, as they can be
converted to deterministic ones anyway.

If you’ve read this far, hopefully the rest of this post will be easier on the mind!
Despite the intimidating formal definition, finite-state machines are more widespread than you might imagine.
Upon closer inspection you might be able to spot them in your everyday life under the hood of things such as vending
machines, traffic lights and elevators.
In .NET they are used in the implementation of `async`/`await` or `yield` syntax.
Try decompiling your code and see how the language authors implemented those features.
You have probably already used some sort of state machine in your code without even realising it!

## A simple example of a basic state machine implementation

Let’s take a closer look at the following piece of code:

```csharp
public enum Button
{
    Play,
    Stop
}

public enum State
{
    Playing,
    NotPlaying
}

public class Player
{
    public State CurrentState { get; private set; } = State.NotPlaying;

    public void HandleClick(Button button)
    {
        if (button == Button.Play)
        {
            CurrentState = State.Playing;
        }
        else if (button == Button.Stop)
        {
            CurrentState = State.NotPlaying;
        }
    }
}
```

This is an example of a very simple state machine with two states and two events.
The player can be either playing or not playing music.
Pressing the Play button will start or keep playing music, while pressing the Stop button will stop the music or keep
it stopped.

The code is manageable at this point, since the example is quite straightforward.
However, I hope you can imagine how adding more media controls that are usually present in music players will quickly
result in complex code that will not be easily maintainable anymore.
For instance, consider a feature request to have the Previous button change to the previous track if the player is less
than 3 seconds into the current track, or stay at the current track but rewind it to the beginning otherwise.

That being said, in many cases this kind of state machine implementation would be more than enough.
You don’t always have to use a state-of-the-art, bleeding-edge solution to achieve desired goals.
However, this is not something I would recommend to someone who is trying to tackle coordination of asynchronous
operations within a distributed system.

## A more maintainable approach

Let me share our approach to this problem.
We have come up with a framework for building state machines in .NET with very little code that is maintainable and
testable.
State machines built with this framework serve a purpose of orchestrating a wide range of business and technical
processes in our microservice-based distributed architecture.
The framework is equipped with various features dictated by paradigms of distributed systems, which extend the
standard state machine definition.

Before I move on to an example of its real-life application, I want to break down the state machine’s API, so that you
know what you’re looking at later on.
To keep things short, I will be showing you only snippets of simplified code, as implementation details can be
expanded upon in follow-up posts.

The state machine is defined as follows:

```csharp
public class StateMachine<TStateBase, TEventBase>
{
    public StateMachine(TStateBase initialState)
    {
        // ...
    }
}
```

It is a generic class that requires a definition of base types for all states (`TStateBase`) and for all transition
triggers (`TEventBase`).
The constructor accepts an initial state from which the state machine will start its operation.

We can create the state machine like so:

```csharp
var stateMachine = new StateMachine<StateBase, EventBase>(new InitialState());
```

Having created this object, we may start defining transitions.
Each transtion consists of three required elements:

- the state from which the transition can be triggered,
- the transition trigger (an event),
- the state to which the transition leads.

Optionally, a transition can have side effects, called simply commands.
A command (or a set of commands) will be run after a successful transition.
Those can be pretty much anything from sending a message to another state machine to calling a specific service and
delegating a task to it.
Commands allow a seamless integration of the state machine with external components.
There is a drawback, however.
Command execution may fail, what requires an idempotent retry policy to be employed.

Transitions and commands can be conditional, meaning that a logical expression can be guarding and preventing the
execution of the whole transition, or just a command in some cases.

A builder pattern which combines all of the aforementioned requirements is used to compose a transition:

```csharp
stateMachine
    .FromState<TStateFrom>()
    .When<TEvent>(/* Expression<Func<TStateFrom, TEvent, bool>> */)
    .ToState<TStateTo>(/* Expression<Func<TStateFrom, TEvent, TStateTo>> */)
    .RunCommand(
        when: /* Expression<Func<TStateFrom, TEvent, TStateTo, bool>> */,
        then: /* Expression<Func<TStateFrom, TEvent, TStateTo, TCommand>> */)
    .RunCommand(/* ... */)
    // ...
    .RunCommand(/* ... */);
```

This structure may be overwhelming at first, but bear with me.
It will all make sense in a bit.
As for now you need to know that:

- if the state machine is in a state of `TStateFrom` type,
- and an event of type `TEvent` occured,
- and the condition (if defined) passed to `When` method is satisfied,

the transition will fire up and the state machine will switch to a new state of type `TStateTo` using the factory method
expression passed to `ToState` method.

The state machine class exposes a method which can be used to trigger a transition with an event:

```csharp
public TransitionResult Apply(TEventBase @event);
```

This method applies the supplied event to the current state by trying to find a matching transition in the transition
mapping and changes the internal state of the machine.
The result contains information about the performed transition, along with commands that should be run.

```csharp
public class TransitionResult
{
    public TStateBase StateFrom { get; }
    public TEventBase Event { get; }
    public TStateBase StateTo { get; }
    public IEnumerable<object> Commands { get; }
    public bool IsValid { get; }
}
```

If no matching transition definition is found given the machine’s current state – or if a transition is found, but its
precondition is not met – the event application will result in an invalid transition.
In that case, the state machine will not react to the event and simply retain its state, possibly logging that an
invalid event was received.

If there are multiple matching transitions, the first one will fire up (in definition order).
We should, however, avoid designing states machines in such way if possible.

As you can see, the representation of the machine is primarily type-based, so we can use polymorphism to our advantage.
By calling `FromState<TStateBase>()` we can have a transition that can be fired up from any state.
Similarily, if we use a type that only some selected states derive from, we will have a transition applicable to these
states only.
It would be equivalent to duplicating that same transition for every one of these states.
This syntax can be particularly useful, when dealing with processes that have an expiration date and have to be
completed within a specific time frame.
Receiving an event about the process’ expiration may have to be handled regardless of the machine’s current state and
result in termination immediately.

## Implementation manifest

Now that I’ve described how a state machine can be defined in a declarative way using our framework, let’s talk a bit
about how that definition actually runs.

In general, we use dependency injection to make the state machine definition work with other services and add-ons,
such as specific command runners.
I promised I would not dive deep into implementation details, but nonetheless I want to give you a little taste of
what sits behind the scenes.

If you don’t care for any of that, you may skip to the next section.

### Storage

The state machine implementation is based on event sourcing.
In summary, this means that we don’t save the state of our application objects, but rather a series of events that
change the object’s state.
These events will give us the current view of the object when aggregated (“replayed”) in the order in which they
occured.
For this purpose we currently use an open-source library,
[SQLStreamStore](https://github.com/SQLStreamStore/SQLStreamStore).

SQLStreamStore offers an atomic and idempotent stream append operation.
Thanks to this, we don’t have to worry about race conditions between multiple instances of the same state machine
handling events in parallel, what is great for scalability.
We can also recognize a situation when the same event is being fed into the state machine again, what can happen
when dealing with retry policies.
That, on the other hand, gives us a pretty good way of achieving deduplication.

### Caching

Replaying all events every single time is an unnecessary overhead that we decided to mitigate by introducing
a lock-free cache for state snapshots.
After each transition a state machine will cache its current state along with the stream version which it
corresponds to.
This gives us the ability to restore the state machine to the state it was in after handling `n-1` events, when we want
to handle the `n`-th event.

It requires, however, that states be immutable, or else we may end up with an unexpected behaviour.
If states were not immutable, we could not be certain that the state object we cached after handling the `n`-th event
is still the same and has not been modified in the meantime.
Moreover, immutability gives us thread safety out of the box.

### Instrumentation

This state machine framework is also equipped with heavy instrumentation.
Every fired up transition and state change is logged, so we can easily track any errors.
This data is also useful for our data analytics team to keep track of business processes.
A lot of different metrics come into play to measure performance of each and every state machine deployed.

Finally, every historical transition is saved in a stream — separate from the event stream — and can be viewed with our
internal back-office tools.

Thanks to the finite nature of the state machines, we can always log the current state and trace what made the system
to be in that state, along with all its previous states.
This is something quite invaluable and helps immensely when diagnosing issues, especially in complex and
inter-dependent business scenarios where a lot of things happen at the same time.

## Real-life example

So finally, the big question: how is this framework used on our platform?
To answer that we don’t need to reach far.

In July of 2020 we launched a new payment method called Allegro Pay, which will eventually be available to every buyer
on Allegro.
This service allows the users to buy items now and pay for them later in a single payment after 30 days, or
in multiple smaller monthly payments, depending on the value of purchased goods.

Repayments can be easily made online using our Allegro Pay dashboard.
Users are even able to pay for multiple purchases at once.

![Allegro Pay dashboard]({% link /img/articles/2021-01-26-state-machines-made-easy-in-dotnet/allegro-pay-dashboard.png %})

For more detailed information, I encourage you to read our
[Allegro Pay FAQ](https://allegro.pl/pomoc/dla-kupujacych/allegro-pay/).

I suspect you already know where I’m going with this — my goal is to show you how our state machine framework is used
to coordinate an actual business process of handling a repayment within Allegro Pay.

### The process specification

Before we create our state machine, we need to have a rough idea of which states and events we want to handle.

The repayment process is started in two different ways, but will end alike in both cases.

1. The user can initialize an immediate online repayment via the Allegro Pay dashboard.
    They are redirected to the payment provider’s website and complete the process there.

2. Alternatively, the user can request to repay their purchase with a traditional wire transfer, what we call an
offline repayment.
    We know nothing about it until the money actually arrives at the target bank account.
    That method may take up to a couple of days.

At this point both repayment paths merge, since from now on we can discard any knowledge about how the money
was received and focus on the fact that we have it.
The money source won’t be useful during the process coordination anymore.

The next step is to register the repayment in our bookkeeping system.
The registration part is important for us, because it will tell us whether the purchase was paid in full or if further
repayments are required.
After receiving information about successful registration, an email is sent to the user confirming that the
repayment was registered.

After repayment is registered, we asynchronously await the feedback from the bookkeeping system on the transaction
being settled and the repayment is to be marked as completed.

### Designing the state machine

I could show you the finished state machine and just paste a wall of text here, describing what it does, but where’s
the fun in that?
Instead, I’d like to show you the step-by-step process I would go through when designing this kind of state machine.

I’ll start off by simply creating a state machine that handles a repayment of a single purchase and then extend it
to work for all cases.
First we need to define the base types for all states and events:

```csharp
public abstract class StateBase
{
    public string UserId { get; init; }
    public string RepaymentId { get; init; }
    public string PaymentId { get; init; }

    public StateBase(StateBase other)
    {
        if (other == null) return;

        UserId = other.UserId;
        RepaymentId = other.RepaymentId;
        PaymentId = other.PaymentId;
    }
}

public abstract class EventBase { }
```

As you can see, I already equipped the base state with all the properties we will need later to orchestrate this
process:

- `UserId` — tells us who is repaying,
- `RepaymentId` — uniquely identifies the repayment process,
- `PaymentId` — identifies the payment made by the user for this repayment.

As for the event base, we don’t need anything special there, so it’s empty.

`StateBase` class features a copy constructor, which rewrites all properties from the previous state when creating
a new one.

None of the states will have any special properties, so there’s no point in painstakingly showing all individual
subclasses representing each state.
Here are just a few sample classes of the initial state (`NotStarted`) and one of the subsequent states:

```csharp
public class NotStarted : StateBase
{
    public NotStarted() : base(null) { }
}

public class Created : StateBase
{
    public Created(StateBase other) : base(other) { }
}
```

All of the remaining states are defined similarly to `Created` state.
Those states are:

- `Paid`,
- `Failed`,
- `Registered`,
- `Completed`.

Once we have our states, we can focus on events and introduce transitions, one by one.

We’ll start by handling an online repayment.
It begins with the user creating a repayment entity by selecting a payment in the Allegro Pay dashboard.
This generates an event, let’s call it `OnlineRepaymentCreated`:

```csharp
public class OnlineRepaymentCreated : EventBase
{
    public string UserId { get; init; }
    public string RepaymentId { get; init; }
    public string PaymentId { get; init; }
}
```

We want this event to trigger a transition from `NotStarted` to `Created` state.

```csharp
// 1. NotStarted : OnlineRepaymentCreated -> Created
stateMachine
    .FromState<NotStarted>()
    .When<OnlineRepaymentCreated>()
    .ToState<Created>((from, @event) => new Created(from)
    {
        UserId = @event.UserId,
        RepaymentId = @event.RepaymentId,
        PaymentId = @event.PaymentId
    });
```

At this point the user sees the repayment form, where they select a payment method.
They are then redirected to the payment provider’s website to finish the repayment.
In most cases it will succeed, but in some it fails due to a multitude of reasons, such as insufficient
funds on the account or the user providing wrong confirmation code.

Therefore, we need two events:

```csharp
public class OnlineRepaymentPaid : EventBase { }

public class OnlineRepaymentFailed : EventBase { }
```

We could go about a single event called `RepaymentResult` with an enum property indicating a success or a failure, but
in my opinion the former approach is cleaner and more open to future changes.
These events will play a role in tranistions no. 2 and 3:

```csharp
// 2. Created : OnlineRepaymentPaid -> Paid
stateMachine
    .FromState<Created>()
    .When<OnlineRepaymentPaid>()
    .ToState<Paid>((from, @event) => new Paid(from))
    .RunCommand((from, @event, to) => new RegisterPaymentCommand(to.PaymentId));

// 3. Created : OnlineRepaymentFailed -> Failed
stateMachine
    .FromState<Created>()
    .When<OnlineRepaymentFailed>()
    .ToState<Failed>((from, @event) => new Failed(from));
```

You might notice that transition no. 2 has a command that I didn’t mention earlier specified.
It’s a simple class wrapping the payment identifier, which is interpreted by the command runner as a request to our
bookkeeping system for registering this payment.

This concludes the online path and we can move on to the offline repayment.
It is significantly easier, since we are simply notified that the money has been transferred to us.
Because of this, we can completely skip the `Created` state and go straight to `Paid`.
We need an event called `OfflineRepaymentPaid` which contains the same properties as `OnlineRepaymentCreated`:

```csharp
public class OfflineRepaymentPaid : EventBase
{
    public string UserId { get; init; }
    public string RepaymentId { get; init; }
    public string PaymentId { get; init; }
}
```

Let’s use it in the fourth transition that will once again call the registration command:

```csharp
// 4. NotStarted : OfflineRepaymentPaid -> Paid
stateMachine
    .FromState<NotStarted>()
    .When<OfflineRepaymentPaid>()
    .ToState<Paid>((from, @event) => new Paid(from)
    {
        UserId = @event.UserId,
        RepaymentId = @event.RepaymentId,
        PaymentId = @event.PaymentId
    })
    .RunCommand((from, @event, to) => new RegisterPaymentCommand(@event.PaymentId));
```

This is where both repayment types merge and we can focus on our bookkeeping system.
As mentioned before, we are mostly interested in registration events published by the bookkeeping system.

```csharp
public class PaymentRegistered : EventBase
{
    public string PaymentId { get; init; }
}
```

Once we know that a payment is registered in our bookkeeping system, we are able to send an email to the user
summarizing what they paid for and follow-up information whether they still have more payments to be made.
This can be done with a transition like this:

```csharp
// 5. Paid : PaymentRegistered -> Registered
stateMachine
    .FromState<Paid>()
    .When<PaymentRegistered>()
    .ToState<Registered>((from, @event) => new Registered(from))
    .RunCommand((from, @event, to) => new SendRepaymentRegisteredEmailCommand(to.UserId, to.RepaymentId));
```

Again, `SendRepaymentRegisteredEmailCommand` is a simple class wrapping two properties that will be interpreted by the
command runner and result in an email sent to the user.

The last step is to wait for the final event `PaymentCompleted`.
Theoretically it could be omitted in this state machine, but it’s useful for auditing purposes.

```csharp
public class PaymentCompleted : EventBase
{
    public string PaymentId { get; init; }
}
```

It’s time to create the final transition:

```csharp
// 6. Registered : PaymentCompleted -> Completed
stateMachine
    .FromState<Registered>()
    .When<PaymentCompleted>()
    .ToState<Completed>((from, @event) => new Completed(from));
```

And we’re done!
Right?
Not really.

As is usually the case with event-sourced systems, the order of incoming events can’t always be relied on.
The bookkeeping system will sometimes — for reasons I don’t want to delve into — publish events `PaymentRegistered` and
`PaymentCompleted` at the same time.
Due to a lack of message ordering guarantees, it’s possible for us to receive `PaymentCompleted` event before
`PaymentRegistered`.
The current definition of the state machine is not prepared for that.

Fortunately, the fix is quite easy, as we can simply introduce two more transitions:

```csharp
// 7. Paid : PaymentCompleted -> Completed
stateMachine
    .FromState<Paid>()
    .When<PaymentCompleted>()
    .ToState<Completed>((from, @event) => new Completed(from));

// 8. Completed : PaymentRegistered -> Completed
stateMachine
    .FromState<Completed>()
    .When<PaymentRegistered>()
    .ToState<Completed>((from, @event) => new Completed(from))
    .RunCommand((from, @event, to) => new SendRepaymentRegisteredEmailCommand(to.UserId, to.RepaymentId));
```

In this scenario we completely skip `Registered` state, but that’s something we just have to deal with.
Events are important from an analytics and diagnostics standpoints, states — not so much.

That wraps up the event flow for this scenario.
It can be visualized with a diagram like this:

![Repayment state machine diagram (V1)]({% link /img/articles/2021-01-26-state-machines-made-easy-in-dotnet/repayment-state-machine-v1.png %})

Our state machine framework is equipped with a pretty useful visualisation extension.
It’s a pretty neat tool that makes it easy to figure out how the state machine works, without having to delve into the
code.
A simple unit test that calls this extension can render a state machine diagram like one above using PlantUML
syntax, which in this case would go as follows:

```
@startuml
hide empty description
[*] --> NotStarted
NotStarted --> Created: <b>OnlineRepaymentCreated</b>
Created --> Paid: <b>OnlineRepaymentPaid</b>\n<i>then:</i> RegisterPaymentCommand
Created --> Failed: <b>OnlineRepaymentFailed</b>
NotStarted --> Paid: <b>OfflineRepaymentPaid</b>\n<i>then:</i> RegisterPaymentCommand
Paid --> Registered: <b>PaymentRegistered</b>\n<i>then:</i> SendRepaymentRegisteredEmailCommand
Registered --> Completed: <b>PaymentCompleted</b>
Paid --> Completed: <b>PaymentCompleted</b>
Completed --> Completed: <b>PaymentRegistered</b>\n<i>then:</i> SendRepaymentRegisteredEmailCommand
@enduml
```

However, recall that this is just a state machine to handle a repayment for a single payment selected by the user.
I promised we would extend it to handle multiple payments.
Let’s do that.
First we’ll extend the base state definition:

```csharp
public abstract class StateBase
{
    public string UserId { get; init; }
    public string RepaymentId { get; init; }
    public HashSet<string> PaymentIds { get; init; }
    public HashSet<string> RegisteredPaymentIds { get; init; }
    public HashSet<string> CompletedPaymentIds { get; init; }

    public StateBase(StateBase other)
    {
        if (other == null) return;

        UserId = other.UserId;
        RepaymentId = other.RepaymentId;
        PaymentIds = new HashSet<string>(other.PaymentIds);
        RegisteredPaymentIds = new HashSet<string>(other.RegisteredPaymentIds);
        CompletedPaymentIds = new HashSet<string>(other.CompletedPaymentIds);
    }
}
```

Three things have changed:

- `PaymentId` changed from a `string` to a `HashSet<string>` and is now called `PaymentIds` to represent multiple
payments selected by the user,
- a `HashSet<string>` called `RegisteredPaymentIds` was added to keep track of registered payments,
- a `HashSet<string>` called `CompletedPaymentIds` was added to keep track of completed payments.

We also have to modify `OnlineRepaymentCreated` event by introducing a collection of payment identifiers, like so:

```csharp
public class OnlineRepaymentCreated : EventBase
{
    public string UserId { get; init; }
    public string RepaymentId { get; init; }
    public IEnumerable<string> PaymentIds { get; init; }
}
```

Because of this, we need to introduce a small change to transition no. 1:

```csharp
// 1'. NotStarted : OnlineRepaymentCreated -> Created
stateMachine
    .FromState<NotStarted>()
    .When<OnlineRepaymentCreated>()
    .ToState<Created>((from, @event) => new Created(from)
    {
        UserId = @event.UserId,
        RepaymentId = @event.RepaymentId,
        PaymentIds = new HashSet<string>(@event.PaymentIds)
    });
```

Transition no. 2 is similarly adjusted to these changes by passing the set of payment identifiers to the
bookkeeping system:

```csharp
(from, @event, to) => new RegisterPaymentsCommand(to.PaymentIds)
```

Now we can move to the remaining transitions.
Transition no. 5 has to be split into two.
We want to stay in the `Paid` state until all registration events are received and only then switch to `Registered`.
This can be achieved with:

```csharp
// 5'. Paid : PaymentRegistered -> Paid
stateMachine
    .FromState<Paid>()
    .When<PaymentRegistered>((from, @event) => !from.PaymentIds.All(
        id => from.RegisteredPaymentIds.Contains(id) || id == @event.PaymentId))
    .ToState<Paid>((from, @event) =>
    {
        var to = new Paid(from);
        to.RegisteredPaymentIds.Add(@event.PaymentId);
        return to;
    });

// 5''. Paid : PaymentRegistered -> Registered
stateMachine
    .FromState<Paid>()
    .When<PaymentRegistered>((from, @event) => from.PaymentIds.All(
        id => from.RegisteredPaymentIds.Contains(id) || id == @event.PaymentId))
    .ToState<Registered>((from, @event) =>
    {
        var to = new Registered(from);
        to.RegisteredPaymentIds.Add(@event.PaymentId);
        return to;
    });
    .RunCommand((from, @event, to) => new SendRepaymentRegisteredEmailCommand(to.UserId, to.RepaymentId));
```

As you can see, the command is now defined only for the second transition that triggers after all payments are
registered.
We have to slightly adjust transition no. 8, which is responsible for sending the email, too:

```csharp
// 8'. Completed : PaymentRegistered -> Completed
stateMachine
    .FromState<Completed>()
    .When<PaymentRegistered>()
    .ToState<Completed>((from, @event) =>
    {
        var to = new Completed(from);
        to.RegisteredPaymentIds.Add(@event.PaymentId);
        return to;
    })
    .RunCommand(
        when: (from, @event, to) => to.PaymentIds.SetEquals(to.RegisteredPaymentIds),
        then: (from, @event, to) => new SendRepaymentRegisteredEmailCommand(to.UserId, to.RepaymentId));
```

This time the transition is not conditional, however the command is.
It will execute only after we handle final registration event and the payment identifier sets `PaymentIds` and
`RegisteredPaymentIds` become equal.

We cannot forget about all transitions that are triggered by `PaymentCompleted` event.
Those will have to be changed like so:

```csharp
// 6'. Registered : PaymentCompleted -> Registered
stateMachine
    .FromState<Registered>()
    .When<PaymentCompleted>((from, @event) => !from.PaymentIds.All(
        id => from.CompletedPaymentIds.Contains(id) || id == @event.PaymentId))
    .ToState<Registered>((from, @event) =>
    {
        var to = new Registered(from);
        to.CompletedPaymentIds.Add(@event.PaymentId);
        return to;
    });

// 6''. Registered : PaymentCompleted -> Completed
stateMachine
    .FromState<Registered>()
    .When<PaymentCompleted>((from, @event) => from.PaymentIds.All(
        id => from.CompletedPaymentIds.Contains(id) || id == @event.PaymentId))
    .ToState<Completed>((from, @event) =>
    {
        var to = new Completed(from);
        to.CompletedPaymentIds.Add(@event.PaymentId);
        return to;
    });

// 7'. Paid : PaymentCompleted -> Paid
stateMachine
    .FromState<Paid>()
    .When<PaymentCompleted>((from, @event) => !from.PaymentIds.All(
        id => from.CompletedPaymentIds.Contains(id) || id == @event.PaymentId))
    .ToState<Completed>((from, @event) =>
    {
        var to = new Completed(from);
        to.CompletedPaymentIds.Add(@event.PaymentId);
        return to;
    });

// 7''. Paid : PaymentCompleted -> Completed
stateMachine
    .FromState<Paid>()
    .When<PaymentCompleted>((from, @event) => from.PaymentIds.All(
        id => from.CompletedPaymentIds.Contains(id) || id == @event.PaymentId))
    .ToState<Completed>((from, @event) =>
    {
        var to = new Completed(from);
        to.CompletedPaymentIds.Add(@event.PaymentId);
        return to;
    });
```

And we’re done!
This time for real.
After all this work we ended up with something that can be visualized with a diagram like this:

![Repayment state machine diagram (V2)]({% link /img/articles/2021-01-26-state-machines-made-easy-in-dotnet/repayment-state-machine-v2.png %})

I mentioned earlier that we have internal back-office tools to view state machines and their transition history.
Here is an example view of a repayment process that was coordinated with the state machine we defined above (sensitive
data was redacted, since this was taken in production):

![Back-office state machine view]({% link /img/articles/2021-01-26-state-machines-made-easy-in-dotnet/back-office-state-machine-view.png %})

### Caveats

You may have noticed some problems here.
What would happen if we received an event with a wrong payment identifier?
Right now the state machine is not ready for that.
However, that can be remedied relatively easily by adding another condition to `When` methods of all transitions for
`PaymentRegistered` and `PaymentCompleted` events, such as:

```csharp
.When((from, @event) => from.PaymentIds.Contains(@event.PaymentId) && /* ... */)
```

This would essentialy ensure that we react only to events with correct identifiers.

And what about retries and duplicated events?
Transition no. 8' is especially susceptible to that, because it may result in the email being sent to the user twice.
And we don’t want that!
Fortunately, achieving deduplication is just as easy — we have to ignore events for payments that are already
registered:

```csharp
.When((from, @event) => !from.RegisteredPaymentIds.Contains(@event.PaymentId) && /* ... */)
```

For the sake of readability I also decided to skip a lot of other validations, which would otherwise have to be there,
such as simple null checks.

### How to test

Testing state machines is important, because, well, ideally all code should be tested.
In this case, apart from the usual assurance that we are able to handle both happy paths and edge cases, we can also
ensure that we keep the transitions backwards compatible.
An event that is once inserted into the stream will stay there forever.

We developed a simple DSL in F# to help us test state machines created with our framework.
This is a perfect solution to test a declarative definition of a state machine like the one we developed in this post.
Here’s an example of a happy path test for our state machine:

```fsharp
[<Fact>]
let ``Online repayment - single payment happy path`` () =
    [
        When(Events.OnlineRepaymentCreated ("paymentId1"))
            |> GoToState<Created>
            |> DoNothing
        When(Events.OnlineRepaymentPaid ())
            |> GoToState<Paid>
            |> Do<RegisterPaymentsCommand>
        When(Events.PaymentRegistered ("paymentId1"))
            |> GoToState<Registered>
            |> Do<SendRepaymentRegisteredEmailCommand>
        When(Events.PaymentCompleted ("paymentId1"))
            |> GoToState<Completed>
            |> DoNothing
    ]
    |> apply
```

A test like this is essentially a list of events with expected side effects that are then aggregated using the `apply`
function that feeds them one by one into the state machine and verifies the outcome.

## Summary

I hope I was able to convince you how a framework like this can make designing complex state machines easy.
It provides numerous advantages, such as declarative syntax, effortless testability, thorough instrumentation and
visualization.

This is precisely why state machines became an integral part of pretty much every business process architecture
in our project.
Having such a robust and scalable solution for asynchronous process orchestration and isolation is crucial in
distributed systems.
The presented code, albeit extremely simplified, is from an actual state machine — one of many used in our
applications.

While the presented solution is a strictly internal framework right now, who knows what the future might bring?
Stay tuned!
