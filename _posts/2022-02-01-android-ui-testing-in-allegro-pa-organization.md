---
layout: post
title: "Android UI testing in Allegro Pay organization"
author: [michal.kwiatek]
tags: [tech, kotlin, android, ui-testing, allegro-pay]
---

Automatic UI tests are designed to check whether the user interface is working properly.
For example they verify if users see an appropriate screen with correct data and don't encounter
an unexpected behavior. These tests, apart from checking the correctness of displayed screen,
should also check whether the user sees the appropriate screen after clicking a button. They allow
allow to check the business process in a controlled manner. At Allegro Pay, we have several critical
processes, such as onboarding a new customer or repayment of liabilities. Until now, these processes
have been tested manually. Automating these tests allows us to save the tester’s time and
eliminates possible human errors.

Tests can run the entire <a href="https://play.google.com/store/apps/details?id=pl.allegro"
target="_blank">application</a> or only a part of it. In our case they run only a part of
the application, namely the Allegro Pay module. This solution is associated with certain changes
that need to be made. The `AllegroPayTestApplication` class has been created inheriting from
the `TestApplication` class. It contains dependencies needed to run our module as a separate
application. Apart from this class, you need to prepare a manifest so that it has references
to all activities available in our module.

```kotlin
class AllegroPayTestApplication : TestApplication() {

   override fun onCreate() {
       super.onCreate()
       initKoin()
   }

   private fun initKoin() {
       loadKoinModules(
           loadNeededModulesHere
       )
   }
}
```

Tools and frameworks used in the process of adding tests are Espresso and Wiremock Stubbing
and the PageObject pattern.
![Espresso and Wiremock logos](/img/articles/2022-02-01-android-ui-testing-in-allegro-pa-organization/espresso_and_wiremock.png)

<a href="https://wiremock.org/" target="_blank">Wiremock</a> is a tool allowing for mocking the response for
a given endpoint with a declared data example.And this is one of the most important functionalities of this tool.
In addition, it can also record requests, map responses, edit response data, and act as a transparent proxy.
This solution supports testing of edge cases and different response statuses that are difficult or impossible
to automatically simulate in a real test environment. Another big reason for using this tool is stability.
Since the test environment to which these tests need to connect doesn't always work, running the test would not
bring any benefits. This would be wasting resources and generating costs. Thanks to Wiremock, it is possible
to obtain the same answer each time. Here is an example stub:

```kotlin
open class Stub(val mappingBuilder: MappingBuilder)

internal object GreetingStub : Stub(
   get(
       urlEqualTo("/allegropay/greeting")
   ).willReturn(
       aResponse()
           .withStatus(200)
           .withBody(GREETING_STUB)
   )
)

// <editor-fold defaultstate=collapsed desc="GreetingStub">

@Language("json")
val GREETING_STUB = """
 {
   "greeting": "hello"
 }
"""

// </editor-fold>
```

The above code shows a stub, that will allow any query to `/allegropay/greeting` to respond with a status
of 200 and data entered in the `GREETING_STUB` field.

Another tool is <a href="https://developer.android.com/training/testing/espresso" target="_blank">Espresso</a>.
It which allows for describing what we want to test in our activity. You can simulate the operation of the
application as if it was used by the customer. This tool provides several simple methods for ensuring
the interaction and assertion of the view state. To prove this thesis, I put a cheat sheet with the most
needed and most used matchers, actions, assertions, etc. below. Espresso provides management of the main
thread, what significantly speeds up and facilitates writing tests. An important consideration when using
this tool is that **_system animations and don’t keep activities function cannot be enabled on the test device_**.
![Espresso cheat sheet](/img/articles/2022-02-01-android-ui-testing-in-allegro-pa-organization/espresso_cheatsheet.png)

The last thing is the <a href="https://martinfowler.com/bliki/PageObject.html" target="_blank">PageObject</a>
pattern which allows you to store the interactions and assertions in one place in the context of each screen.
According to Martin Fowler (if you haven't read his books, you should!):
>The basic rule of thumb for a page object is that it should allow a software client to do anything and
see anything that a human can.

Below is one of the tests written for the Dashboard screen:

```kotlin
@Test
@Stubs(
   Stub1::class,
   Stub2::class,
   Stub3::class,
   Stub4::class,
   Stub5::class
)
fun testUserCanSeeDashboardThenSettingsThenOverpaymentThenGoBackToDashboard() = launchDashboardActivity {
   inDashboard()
       .toolbarPage { toolbar ->
           toolbar.checkName(DASHBOARD_TOOLBAR_NAME_RES_ID)
               .dashboardMenuItemPage { menuItem ->
                   menuItem.tapOnOptionsButton()
               }
       }

   inSettings()
       .toolbarPage { toolbar ->
           toolbar.checkName(SETTINGS_TOOLBAR_NAME_RES_ID)
       }.overpaymentItemPage(position = 1) { item ->
           item.tapOnOverpayment()
       }

   inOverpayment(parseOverpaymentData(OVERPAYMENT_WITHOUT_IBAN_POSITIVE))
       .toolbarPage { toolbar ->
           toolbar.checkName(OVERPAYMENT_TOOLBAR_NAME_RES_ID)
               .tapToolbarBack()
       }

   inSettings()
       .toolbarPage { toolbar ->
           toolbar.checkName(SETTINGS_TOOLBAR_NAME_RES_ID)
               .tapToolbarBack()
       }

   inDashboard()
       .toolbarPage { toolbar ->
           toolbar.checkName(DASHBOARD_TOOLBAR_NAME_RES_ID)
       }
}
```

The above test allows you to check the path followed by the user who wants to see the overpayment screen
from the dashboard and then return. Methods with the `in` prefix contain a page object that provides the
necessary interactions and assertions to check the view. By running this test on the test device, you can
see the start of the application with the dashboard screen, where the title of the toolbar will be checked
and the button that takes you to the options screen will be clicked. In the options screen, the title of
the toolbar will be checked and you will click on the option that will take you to the overpayment screen.
The toolbar title will also be checked in the overpayment screen and the back arrow will be clicked. The
application will return to the options screen, the title of the toolbar will be checked and the back arrow
will be clicked. The last screen that will be checked will be the dashboard screen. And then the test will
pass. The class fragment presented below has the method that was used in the previous test. This method allows
for creates settings page object and run check on toolbar page and overpayment item page. Toolbar page object
allows for check name by string resource defined in `strings.xml` file. Whereas `overpaymentItemPage()` method
searches for item on the first position on the recycler view. After that it clicks on overpayment option on screen.
This means that the methods can be used for other tests without unnecessarily duplicating it.

```kotlin
inSettings()
   .toolbarPage { toolbar ->
       toolbar.checkName(SETTINGS_TOOLBAR_NAME_RES_ID)
   }.overpaymentItemPage(position = 1) { item ->
       item.tapOnOverpayment()
   }
```

Our test team proposed to provide test scenarios that should be implemented in addition to the so-called
happy paths. These are or used to be the most frequently reported problems by our customers regarding the display
of data or switching between screens. However, it should also be noticed that the number of these tests
shouldn’t be too large, because running one test usually takes a few seconds, what may cause queues in the
test environment. Additionally, the tests need to be merged into the main branch. The 10 sample tests took
almost 30 seconds to complete, but the entire procedure took almost a minute.
![10 simple tests](/img/articles/2022-02-01-android-ui-testing-in-allegro-pa-organization/10_tests.png)

The addition of these tests allowed to improve the process of testing changes in the already existing
screens, which resulted in a reduction in the work of a manual tester. It also made it easy to add new
and extend existing test cases. Of course, we still have a lot of work to do in cevering subsequent processes
with tests, such as onboarding a new customer, consolidation or repayment.
