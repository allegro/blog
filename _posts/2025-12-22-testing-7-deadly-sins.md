---
layout: post
title: The Seven Deadly Sins of Test Automation
author: malgorzata.kozlowska
tags: [ tech, testing ]
---

I’ve spent a significant part of my career building and maintaining test automation suites, and I’ve learned one thing for certain: a test suite
that isn’t trusted is worse than no test suite at all. We’ve all felt that familiar dread of a CI/CD pipeline that’s constantly red, where the team
spends more time debugging flaky tests than shipping features. If you’re a test automation engineer or a developer feeling the pressure of a complex and
fragile test suite, this post is for you. It’s a confession, a guide, and a collection of hard-won lessons I’ve learned throughout my career on how to pull
our test suites back from the brink.

I’ve come to think of the most common pitfalls not as simple mistakes, but as temptations — shortcuts that feel right at the moment but lead to long-term chaos.
I call them “The Seven Deadly Sins of Test Automation”. These aren’t just minor coding errors; they are fundamental flaws in approach that turn a source of
confidence into a source of frustration. They transform our carefully built safety nets into tangled messes of technical debt.

In this post, I’ll walk you through each of these seven sins, using real-world examples from my work with [Cypress](https://www.cypress.io/) and
[Appium](http://appium.io/). More importantly, I’ll share the path to redemption for each one — practical, battle-tested advice that
we use to build automation that is resilient, reliable, and something our development teams can truly depend on.

## The Sin of Sloth — Relying on Fixed Waits

### The Temptation

I confess, I’ve done this more times than I’d like to admit, especially early in my career. I’d write a test, run it, and it would fail.
A button I wanted to click wasn’t visible yet, or a piece of data from an API call hadn’t loaded. The application was in an intermediate state,
and my test was simply too fast.

I needed to make the test wait. What’s the quickest, most direct path to a green build?

It’s this. The alluringly simple `sleep`.

```typescript
// A moment of weakness in Cypress
cy.get('[data-testid="submit-button"]').click();
cy.wait(2000); // Let’s just wait 2 seconds for the dashboard to load...
cy.get('[data-testid="welcome-header"]').should('be.visible');
```

Its cousin in the mobile world, just as tempting, is:

```kotlin
// A familiar shortcut in Appium/Kotlin
driver.findElement(MobileBy.AccessibilityId("submit_button")).click()
Thread.sleep(3000) // 3 seconds should be enough for the next screen to pop up...
val welcomeHeader = driver.findElement(MobileBy.AccessibilityId("welcome_header"))
assert(welcomeHeader.isDisplayed)
```

It feels so easy. It feels so right. I’d run the test again, and it would pass. Problem solved — or so I thought. I had given in to the temptation of the easy
fix, choosing the path of least resistance instead of taking the time to understand the application’s asynchronous behavior. It’s the automation equivalent of
hitting the snooze button in the morning; a moment of blissful ignorance before the real trouble begins.

### The Consequence

This single act of sloth plants a seed of chaos in my test suite. By using a fixed wait, I’ve created a **race condition** — my test is now in a race against my
application, and I’ve foolishly bet on a specific outcome. This leads to two disastrous results:

1. **Slowness:** On a good day, when our application and network are fast, the dashboard might load in 500 milliseconds. But my test doesn’t care. It will
   obediently sit there and wait for the full two or three seconds, wasting precious time. Multiply this across hundreds of tests, and our CI pipeline runtime
   bloats from minutes to hours.
2. **Flakiness:** On a bad day, the CI server is under heavy load, or a backend service is slow to respond. The dashboard now takes 3.5 seconds to load. My
   test, which only waits for 3 seconds, gives up too early and fails. This is the birth of a flaky test — the kind that “works on my machine” but fails
   unpredictably in the pipeline, destroying my team’s confidence in our entire test suite.

### The Redemption

My redemption, and yours, comes from embracing a single, golden rule: **Never wait for a fixed time; always wait for a specific application state.** My test
shouldn’t be guessing; it should be intelligently polling until the application is verifiably ready for the next step.

#### Redemption in Cypress (TypeScript)

The wonderful thing about Cypress is that it was built to solve this exact problem. Its commands are automatically chained and
retried. My redemption is to trust the framework and use assertions to declare the state I am waiting for.

* **For UI Elements:** Instead of waiting for time, I wait for a spinner to disappear or for the next element to become visible.

  ```typescript
  // BEFORE (The Sin of Sloth):
  cy.wait(2000);
  cy.get('[data-testid="welcome-header"]').should('be.visible');

  // AFTER (The Redemption with state validation):
  // Explicitly wait for the loading state to be gone.
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
  // THEN assert the desired element is visible. Cypress retries until it is.
  cy.get('[data-testid="welcome-header"]').should('be.visible');
  ```

* **For Network Calls:** The most robust method is to wait for the specific API call to complete using `cy.intercept()`.

  ```typescript
  cy.intercept('POST', '/api/login').as('loginRequest');
  cy.get('[data-testid="submit-button"]').click();

  // The Redemption: Don’t guess. Wait for the network call to finish.
  cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

  cy.get('[data-testid="welcome-header"]').should('be.visible');
  ```

#### Redemption in Appium (Kotlin)

The principle is identical in the Appium world. I use `WebDriverWait` to poll for an `ExpectedCondition` instead of putting my test to
sleep.

* **The Right Way:** I create a `WebDriverWait` instance and tell it to wait *until* a specific condition is met, like an element appearing on the next screen.

  ```kotlin
  // BEFORE (The Sin of Sloth):
  Thread.sleep(3000)
  val welcomeHeader = driver.findElement(...)

  // AFTER (The Redemption with fluent waiting):
  val wait = WebDriverWait(driver, Duration.ofSeconds(15)) // Wait a max of 15s

  // This will poll the app until the element is visible,
  // but will proceed the INSTANT it appears.
  val welcomeHeader = wait.until(
      ExpectedConditions.visibilityOfElementLocated(
          MobileBy.AccessibilityId("welcome_header")
      )
  )
  assert(welcomeHeader.isDisplayed)
  ```

By banishing `sleep` and `cy.wait(time)` from your codebase, you transform your tests from slow, flaky liabilities into fast, reliable assets that adapt to your
application’s state.

## The Sin of Gluttony — Excessive End-to-End Testing

### The Temptation

When I first started in test automation, I fell into a trap that felt completely logical. I thought, “If a little testing is good, then a lot of testing must be
great, right?” The ultimate goal is to ensure the application works for our users, so the most tempting approach is to test everything exactly as a user
would — through the UI.

This thinking leads to an over-indulgence, a feast of `end-to-end` tests. I’d write a test for every feature, every edge case, and every validation rule. A form
with five validation rules? That’s five `end-to-end` tests. A new settings toggle? I’d write a test that logs in, navigates through three screens, clicks the
toggle, and then verifies the outcome. It provided an illusion of total safety. I was being thorough, and my test suite was growing. I was committing the sin of
gluttony, convinced that more was always better.

### The Consequence

The bill for this feast of `end-to-end` tests always comes due, and the price is steep. This approach directly inverts
the [Test Automation Pyramid](https://martinfowler.com/bliki/TestPyramid.html), a foundational concept that promotes a healthy balance of tests. Instead of a
solid base of fast unit tests, I ended up with a massive, top-heavy suite teetering on a tiny foundation. The consequences were crippling:

1. **Slow Feedback Loops:** `End-to-end` tests are inherently slow. They have to launch a browser or an app, interact with a full application stack, and wait
   for network responses. Feedback that should take seconds or minutes now takes hours. This makes our entire CI/CD process painful and discourages developers
   from running the tests at all.
2. **High Maintenance Cost:** These tests are incredibly brittle. A minor UI change in a shared component — like a button in our site’s header — can cause
   dozens or even hundreds of tests to fail simultaneously. I’d spend more time fixing tests than validating new functionalities, trapping my team in a cycle
   of maintenance hell.
3. **Debugging Nightmares:** When a broad `end-to-end` test fails, it’s a mystery. Was it a bug in the frontend UI, a regression in a backend API, a problem
   with the database seeding, or just a temporary hiccup in the test environment? Pinpointing the root cause is a time-consuming investigation.

### The Redemption

Redemption from gluttony doesn’t mean starving your test suite; it means adopting a balanced diet. The guiding principle is simple yet powerful: **“Push tests
down to the lowest possible level of the pyramid.”** I test each piece of logic at the fastest, most isolated level that can prove it works.

#### A Balanced Diet — The Healthy Test Pyramid

* **Unit Tests (The Foundation):** This is where I test the vast majority of my application’s logic. Business rules, validation logic, and individual functions
  are tested here in complete isolation. They are lightning-fast and give precise feedback.
* **Integration Tests (The Middle Layer):** Here, I verify that different pieces of my system work together. For the frontend, this often means checking API
  integrations. I can use tools like `cy.request()` in Cypress to test an API response directly or `cy.intercept()` to mock the
  backend, allowing me to verify how my UI handles various API states (success, errors, empty states) without the slowness of a true `end-to-end` run.
* **End-to-End Tests (The Pinnacle):** These are still vital, but I use them sparingly. They are the final check, reserved for validating critical, high-value
  user flows — the “happy paths” that absolutely must work. This includes things like the user registration and login flow, the core checkout process, or the
  main feature of a particular page.

#### A Practical Example

Let’s consider a login form with five validation rules (e.g., empty email, invalid email format, etc.).

* **The Gluttonous Way:** Write five slow `end-to-end` tests that fill out the form in different ways to trigger each validation message. This is slow and
  brittle.
* **The Redeemed Way:**
    1. Write **one** `end-to-end` test for the happy path to ensure a successful login works from start to finish.
    2. Write four fast **component tests** for the login form component itself. Using a tool
       like [Cypress Component Testing](https://docs.cypress.io/guides/component-testing/overview), I can render just the form and test each validation rule in
       complete isolation from the rest of the application.

This redeemed approach doesn’t mean you’re testing less; it means you're testing smarter. Your test suite becomes faster, more stable, and provides far more
precise feedback when something breaks.

## The Sin of Pride — Writing “Clever” and Brittle Locators

### The Temptation

As engineers, we love solving puzzles. There’s a certain satisfaction that comes from cracking a difficult problem, and sometimes that puzzle is finding a
deeply nested element in a complex UI. I’ve felt the temptation to craft what I thought was a masterpiece of a selector — a long, winding XPath or a
hyper-specific CSS selector that perfectly pinpointed the exact element I needed.

It works. I run the test, and it finds the element every single time. There’s a moment of pride in that. I’ve tamed the complexity of the DOM. I’ve written a
“clever” locator that shows my skill. The temptation is to admire my own work, believing that a complex solution to a complex problem is a sign of expertise.
It’s a solution for *today*, built with no thought for the inevitable changes of tomorrow.

### The Consequence

That feeling of pride is always short-lived. By creating a locator based on the UI’s internal structure or styling, I’ve committed a serious sin: I have tightly
**coupled my test to the implementation details of the application**. My test is no longer just verifying application behavior; it’s also verifying that the
HTML structure and CSS class names remain unchanged.

The consequence is inevitable. A developer on another team refactors a component to improve accessibility, a designer changes a CSS class as part of a re-brand,
or a new `div` is added for layout purposes. The application’s functionality is still perfect, but my test fails. My “clever” selector breaks because its
fragile foundation was disturbed. This creates friction and frustration — the test suite becomes a boy who cries wolf, flagging failures that aren’t actual bugs
and slowing down the entire development process.

### The Redemption

The path to redemption is paved with humility. It requires letting go of pride in complex locators and instead taking pride in writing resilient, maintainable
tests. The guiding principle is to **decouple tests from the implementation by using stable, contract-based locators.**

Our goal should be to select elements the same way a user does — by their function or purpose, not by their appearance or location on the page. To achieve this,
we’ve adopted a clear locator strategy.

1. **Dedicated Test IDs (The Holy Grail):** The best practice is to establish a formal contract between developers and testers. We use unique,
   non-presentational attributes on elements solely for testing, such as `data-testid` on the web. These attributes are a promise that they won’t change with
   visual refactors.
2. **User-Facing Attributes (The Next Best):** When a dedicated test ID isn’t available, the next best thing is to use attributes that users rely on. On mobile,
   the `accessibilityId` is perfect for this. On the web, ARIA attributes like `aria-label` can also serve this purpose. These are less likely to change than
   purely stylistic hooks.

Here’s what this looks like in practice:

#### Redemption in Cypress (TypeScript)

```typescript
// BEFORE (The Sin of Pride):
cy.get('div.user-profile > section:nth-child(2) > button.btn--primary')
    .click();

// AFTER (The Redemption with element id usage):
cy.get('[data-testid="user-profile-submit-button"]')
    .click();
```

#### Redemption in Appium (Kotlin)

```kotlin
// BEFORE (The Sin of Pride):
driver.findElement(By.xpath("//android.widget.FrameLayout[1]/android.widget.Button[@text='Submit']"))
    .click()

// AFTER (The Redemption with element id usage):
driver.findElement(MobileBy.AccessibilityId("user_profile_submit_button"))
    .click()
```

When you adopt this strategy, your tests become simpler, more readable, and dramatically more resilient to change. This fosters a better collaboration between
developers and QAs, and that is something to be truly proud of.

## The Sin of Lust — Creating Interdependent Tests

### The Temptation

This sin is born from a misguided desire for efficiency. I’ve often caught myself thinking, “Why should I log in before every single test? The first test
already did that. Why not just pick up where it left off?” It feels like I’m saving precious seconds by avoiding redundant setup steps.

This leads me to write tests as a sequence of events, where each test case implicitly relies on the successful completion of the one before it. The test file
becomes a story: the first test logs in, the second navigates to the user’s profile, the third edits that profile, and so on. It feels clean and fast because
I’m only running one long user journey. The tests have an unhealthy dependency on each other — they “lust” for the state created by their predecessors, unable
to exist on their own.

### The Consequence

This “efficiency” is an illusion. In reality, I’ve built a house of cards. The moment one test in the middle of the chain fails, the entire structure collapses.
The core problem is a complete **loss of atomicity** — my tests are no longer independent, self-contained checks. They have mutated into a single, fragile,
monolithic script. The consequences are severe:

1. **Cascading Failures:** When the second test fails (perhaps the profile link was changed), the third, fourth, and fifth tests all fail immediately because
   they never reached the state they expected. This creates a massive amount of noise in my test reports, making it impossible to see the true scope of the
   problem. One small bug looks like five big ones.
2. **Debugging Hell:** It becomes impossible to debug a single failing test in isolation. To reproduce the failure in the third test, I first have to
   successfully run the first and second tests. This turns a quick debugging session into a slow, frustrating ordeal.
3. **No Parallelization:** These tests cannot be run in parallel. Since they must execute in a specific, rigid order, I lose one of the most powerful tools for
   speeding up my test suite. That micro-optimization of skipping a login step has now cost me the macro-optimization of parallel execution.

### The Redemption

The redemption from this sin is to enforce a strict, non-negotiable rule: **Every test must be atomic and independent, responsible for its own state.** I must
be able to run any test, in any order, a thousand times, and have it produce the same result every time. This is achieved by embracing setup and teardown hooks.

The key is to manage state programmatically, not through the UI. Instead of having a test that logs in via the UI, I set up the application state behind the
scenes before each test begins.

#### Redemption in Cypress (TypeScript)

Cypress provides powerful tools for this. Instead of chaining `it` blocks, I use a `beforeEach` hook to
ensure a clean, authenticated state for every test. The `cy.session()` command is perfect for this, as it caches and restores the session for subsequent tests,
making it both fast and atomic.

```typescript
// BEFORE (The Sin of Lust):
it('logs the user in', () => {
    // ... logs in via UI
});

it('navigates to the user profile', () => {
    // ... assumes user is already logged in
});

// AFTER (The Redemption with beforeEach block):
describe('User Profile', () => {
    beforeEach(() => {
        // This custom command uses cy.session() to log in programmatically
        // It's fast and ensures each test starts fresh and authenticated
        cy.loginAs('testUser');
        // Visit profile page
        profilePage.visit()
    });

    it('should allow a user to view their profile', () => {
        // Test logic for viewing profile
    });

    it('should allow a user to edit their profile', () => {
        // Test logic for editing profile
    });
});
```

#### Redemption in Appium (Kotlin)

The same principle applies to mobile testing with Appium and [JUnit 5](https://junit.org/junit5/). I use the
`@BeforeEach` annotation to prepare the app state for each test. This could involve resetting the app, using a deep link to navigate directly to the correct
screen, or making a background API call to create the necessary test data.

```kotlin
// BEFORE (The Sin of Lust):
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
class UserProfileTests {
    @Test
    @Order(1)
    fun test_1_login() { /* ... */
    }

    @Test
    @Order(2)
    fun test_2_viewProfile() { /* ... assumes logged in */
    }
}

// AFTER (The Redemption with beforeEach block):
class UserProfileTests {
    @BeforeEach
    fun setup() {
        // Execute all required steps to ensure the user is logged in
        loginPage.loginAs('testuser')
        // Visit profile page
        profilePage.visit()
    }

    @Test
    fun shouldAllowUserToViewProfile() { /* ... */
    }

    @Test
    fun shouldAllowUserToEditProfile() { /* ... */
    }
}
```

This approach requires more discipline up-front, but it pays massive dividends. Your tests become stable, your debugging sessions become shorter, and you unlock
the ability to run my entire suite in parallel — a true path to a faster and more reliable automation framework.

Moreover, by encapsulating login logic in dedicated classes your tests become less brittle and more resilient to changes. More on that in the next section.

## The Sin of Greed — Hoarding Logic in Tests

### The Temptation

When I’m focused on validating a new feature under a tight deadline, the fastest way to get a test written is to put everything in one place. I open up a test
file and start writing — the selectors, the clicks, the text input, the assertions, all mixed together in a single, linear script. It’s a straight path from A
to B.

It feels productive. I’m not spending time creating new files, classes, or functions. I’m just writing the steps needed to verify the behavior. The test method
itself becomes “greedy,” hoarding every implementation detail and refusing to abstract them away for reuse. I tell myself, “It’s just a test, it doesn’t need to
be perfect.” This temptation to prioritize immediate speed over long-term software design is incredibly strong.

### The Consequence

What was fast to write becomes agonizingly slow to maintain. This sin violates one of the most fundamental principles of good software design: **DRY (Don’t
Repeat Yourself)**. By hoarding logic, I’ve ensured that the `what` of my test (the user’s goal) is hopelessly tangled with the `how` (the implementation
details). The consequences are inevitable:

1. **Massive Code Duplication:** If ten of my tests need to log in to the application, I find myself with ten near-identical copies of the same five lines of
   `cy.get()`, `.type()`, and `.click()` calls. The same is true for any shared user action, like adding an item to a cart or navigating through a menu.
2. **High Maintenance Burden:** The real pain begins when a shared element in the UI changes. Let’s say a developer changes the `data-testid` for the login
   button. Now, I don’t have a single place to update it. I have to go on a “find and replace” mission through every single test file that contains a login
   flow. This is not only tedious but also extremely error-prone.
3. **Poor Readability:** My tests become nearly impossible for a new team member — or even my future self — to understand. Instead of reading like a clear,
   high-level story of what a user is trying to accomplish, they read like a dense, cryptic list of low-level interactions. This makes them difficult to review,
   debug, and trust.

### The Redemption

The redemption from greed is to practice generosity — to share and reuse code through abstraction. The guiding principle is simple but profound: **“Treat your
test code like production code.”** This means applying good software design patterns to create a clean separation of concerns.

The most common and effective pattern for this is the **Page Object Model (POM)**. In this model, I encapsulate the selectors and interactions for a specific
page or component of the UI into its own dedicated class or object. The test itself then uses this page object to drive the application, without ever needing to
know the underlying implementation details.

#### Redemption in Cypress (TypeScript)

Instead of a long script, I’ll create a `LoginPage.ts` file to handle all login-related interactions. My test then becomes clean and descriptive.

```typescript
// BEFORE (The Sin of Greed):
it('should log in a valid user', () => {
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="welcome-header"]').should('be.visible');
});

// AFTER (The Redemption with a LoginPage object):
import {loginPage} from '../support/page_objects/LoginPage';

it('should log in a valid user', () => {
    loginPage.visit();
    loginPage.loginAs('testuser');
    cy.get('[data-testid="welcome-header"]').should('be.visible');
});
```

#### Redemption in Appium (Kotlin)

The same pattern applies beautifully to mobile testing. I create a `LoginPage.kt` class that contains all the `driver.findElement()` logic. The test itself is
then wonderfully simple.

```kotlin
// BEFORE (The Sin of Greed):
@Test
fun shouldLogInValidUser() {
    driver.findElement(MobileBy.AccessibilityId("username_input")).sendKeys("testuser")
    driver.findElement(MobileBy.AccessibilityId("password_input")).sendKeys("password123")
    driver.findElement(MobileBy.AccessibilityId("login_button")).click()
    val welcomeHeader = driver.findElement(MobileBy.AccessibilityId("welcome_header"))
    assert(welcomeHeader.isDisplayed)
}

// AFTER (The Redemption with a LoginPage class):
@Test
fun shouldLogInValidUser() {
    val loginPage = LoginPage(driver)
    loginPage.loginAs("testuser")
    val welcomeHeader = driver.findElement(MobileBy.AccessibilityId("welcome_header"))
    assert(welcomeHeader.isDisplayed)
}
```

By investing in abstractions like POM, you transform a brittle collection of scripts into a robust, scalable, and maintainable framework. Your tests now serve
as living documentation, clearly describing how a user interacts with our application.

## The Sin of Envy — Polluting Shared State and Environments

### The Temptation

When I’m writing a test, my focus is narrow and specific: make *this* test pass. To do that, I often need to create data — a new user account, a product
listing, a specific item in a shopping cart. The test runs, it creates the data it needs, performs its verification, and passes. My job feels done.

The temptation is to walk away right there. Why would I spend extra time writing code to clean up the data I just created? It feels like unnecessary, tedious
work. My test got the clean environment it needed to run successfully, and I’m ready to move on to the next task. This is the sin of writing a selfish test —
one that enters a clean house, makes a mess, and leaves without tidying up. It’s easy to forget that in a large test suite, our tests are all neighbors living
in a shared world.

### The Consequence

This sin creates some of the most frustrating and difficult-to-debug failures I’ve ever encountered. The core problem is **uncontrolled state and data leakage
between tests**. This breaks the crucial principle of test isolation, not because of a code dependency (like in The Sin of Lust), but because of a hidden
environmental dependency. The consequences are maddening:

1. **Heisenbugs:** This sin is the primary cause of “Heisenbugs” — bugs that seem to disappear or change when you try to observe them. A test to create a user
   with a unique email address passes once, but fails every subsequent run with a “user already exists” error. A search test might pass when run alone but fail
   when run after another test that created extra products matching the search query.
2. **Order Dependency:** My test suite suddenly becomes order-dependent. Test A might pass if it runs before Test B, but fail if it runs after. This makes
   debugging a nightmare because I can’t reproduce the failure by just running the failing test; I have to recreate the exact sequence of events that led to the
   polluted state. This also completely prevents me from running my tests in parallel.
3. **A Polluted Environment:** Over time, our shared test database becomes a junkyard of orphaned, inconsistent data left behind by thousands of test runs. This
   can slow down the application, cause unexpected behavior, and make it impossible to know what a truly “clean” state even looks like. The next test to run
   fails because it “envies” the pristine environment the previous test had before leaving its mess.

### The Redemption

Redemption comes from adopting the “Campsite Rule” of software testing: **“Always leave the test environment cleaner than you found it.”** Every test that
modifies state is a guest in the environment and has a non-negotiable responsibility to clean up after itself before it leaves. The best way to enforce this is
with teardown hooks.

The most robust and efficient way to perform cleanup is programmatically, through background API calls, rather than trying to reverse the actions through the
UI.

#### Redemption in Cypress (TypeScript)

In Cypress, I use an `afterEach` hook to guarantee my cleanup code runs after every test in a block. I make sure to store the ID of
any resource I create so I can precisely target it for deletion.

```typescript
describe('Todo List', () => {
    let createdTodoId;

    it('should allow creating a new todo item', () => {
        // A custom command that makes an API call to create a todo
        // and stores its ID in a variable scoped to the test
        cy.createTodoApi({title: 'Write blog post'}).then((todo) => {
            createdTodoId = todo.id;
            cy.visit(`/todos/${todo.id}`);
            cy.get('[data-testid="todo-title"]').should('contain', 'Write blog post');
        });
    });

    afterEach(() => {
        // If a todo was created in the test, send a DELETE request to clean it up
        if (createdTodoId) {
            cy.request('DELETE', `/api/todos/${createdTodoId}`);
        }
    });
});
```

#### Redemption in Appium (Kotlin)

The same pattern applies to my mobile tests using JUnit 5. I use the `@AfterEach` annotation to run my cleanup logic. This often
involves using an HTTP client library like [OkHttp](https://square.github.io/okhttp/) to make a `DELETE` request to our backend services.

```kotlin
class UserSettingsTests {
    private var testUserId: String? = null

    @Test
    fun shouldUpdateUserPreferences() {
        // API call to create a user for this specific test
        val user = userApiService.createUser("test-user-${System.currentTimeMillis()}")
        testUserId = user.id

        // Appium logic to log in as the new user and update preferences...
    }

    @AfterEach
    fun teardown() {
        // If a user was created, make sure to delete it via the API
        testUserId?.let {
            userApiService.deleteUser(it)
        }
    }
}
```

By enforcing disciplined state management, you ensure that your tests are reliable, reproducible, and good citizens in our shared ecosystem. This practice is a
hallmark of a mature and professional test automation framework.

## The Sin of Wrath — Ignoring and Tolerating Flaky Tests

### The Temptation

There is no greater source of frustration for an engineer than a flaky test. It’s that one test that passes five times in a row locally, but then fails in the
CI/CD pipeline for no discernible reason. My first reaction is often a surge of anger — wrath. “It works on my machine!” I’ll exclaim, blaming the test
environment or a random cosmic ray.

This wrath quickly gives way to temptation. I don’t have time to investigate this ghost in the machine; I just need to get my pull request merged. So I do the
easy thing. I hit the “re-run job” button. And again. And again, until it finally turns green. Or, even worse, I silence the problem by wrapping the test in an
aggressive retry loop, adding an `@ignore` tag with a comment like `// TODO: Fix this later`, or just commenting it out entirely. I’ve made the red build go
away, and I can move on. The temptation is to treat the symptom, not the disease.

### The Consequence

This sin is perhaps the most insidious because it slowly and silently destroys the single most important attribute of your test suite: **trust**. A test suite
is a communication tool. A green build should be a reliable signal that our code is safe to deploy. A red build should be an urgent alarm that a real problem
has been found. Flakiness breaks this sacred contract. The consequences create a slippery slope to disaster:

1. **Alert Fatigue:** When the pipeline is often red for no good reason, developers start to ignore it. A red build is no longer an alarm; it’s just meaningless
   noise. The phrase “oh, just re-run it, that test is always flaky” becomes a common refrain.
2. **Real Bugs Get Missed:** Eventually, a developer will introduce a real regression that the flaky test was designed to catch. The test will fail, but the
   team, conditioned by its unreliability, will assume it’s just “being flaky again.” They’ll re-run the job, get a lucky green build, and merge a critical bug
   into production.
3. **The Death of the Suite:** Ultimately, if no one trusts the results, the test suite becomes worthless. It becomes a drain on resources with no perceived
   value. The massive investment in automation — all the time and effort — is completely wasted as the suite is eventually neglected and abandoned.

### The Redemption

The redemption from wrath requires discipline and a zero-tolerance policy. The guiding principle must be: **“A flaky test is a failing test. There is no middle
ground.”** We must treat instability not as an annoyance, but as a [P0 bug](https://fibery.io/blog/product-management/p0-p1-p2-p3-p4/) in our test code.
To do this, we’ve implemented a systematic process for dealing with flakiness.

1. **Detect and Isolate:** We have custom monitoring in place on our CI/CD pipelines to automatically detect tests with a high failure or re-run rate. The
   moment a test is identified as flaky, our first priority is to protect the integrity of the main branch. We immediately quarantine the test — either by
   moving it to a separate test run or by temporarily disabling it with a linked, high-priority ticket. This unblocks other developers while ensuring the
   problem isn’t forgotten.
2. **Investigate and Categorize:** With the pressure off, we can properly investigate. We dig into the logs, videos, and screenshots captured during the run to
   find the root cause. Common culprits often trace back to other sins: race conditions (Sloth), test data pollution from a previous test (Envy), or
   dependencies on an unstable third-party service. Understanding *why* it’s flaky is half the battle.
3. **Fix with the Right Tools:** The tools we use provide excellent features for debugging these issues. In Cypress,
   the [Time Travel](https://docs.cypress.io/app/core-concepts/open-mode#Time-traveling) feature allows me to step back and see the exact state of the
   application when a command failed. For Appium, it often comes down to meticulously checking for and handling unexpected system pop-ups or ensuring my
   explicit waits are targeting the correct state change.
4. **Implement Flake Budgets:** At [Allegro](https://allegro.tech), we treat stability as a core metric. We've established a Service Level
   Objective (SLO) for our test suites. To
   enforce this, we rely on automated custom health checks. You will receive a warning in your health check list if, over the last 7 days, your build
   times exceed 3 hours, and there is a high ratio of time spent on failing jobs compared to total job time. This makes stability a measurable, shared
   responsibility.

Fighting flakiness is a continuous cultural battle, not a one-time fix. By treating every flaky test as a critical bug, you protect the trust in your automation
suite, ensuring it remains one of the most valuable assets your team possesses.

## Conclusion

We’ve now journeyed through what I consider the seven deadliest sins of test automation — from the lazy allure of a fixed `sleep` to the prideful crafting
of a brittle locator. If some of these felt uncomfortably familiar, don’t worry. I believe every seasoned engineer has committed at least a few of them at
some point in their career. Recognizing the temptation is the first and most critical step toward building better habits.

The path to redemption isn’t about achieving flawless perfection overnight. Instead, it’s about a fundamental shift in mindset. It’s about treating our test
code with the same discipline and respect we give our production code. Our automation suite is a living product that requires thoughtful architecture,
clean patterns, and a commitment to continuous improvement — not just a collection of scripts to be written and forgotten. By focusing on stability,
readability, and independence, we can transform our test suites from a liability that slows us down into a strategic asset that enables us to deliver quality at
speed.

But this list is based on my own experience. What about yours? What’s the “eighth deadly sin” of test automation you’ve encountered in the wild? I’d love to
hear your own war stories and survival tips in the comments below.
