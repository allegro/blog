---
layout: post
title: "Migrating Selenium to Playwright in Java - evolution, not revolution"
author: [ patrycja.husarska ]
tags: [ tech, testing, selenium, java, playwright, ui-testing ]
---

Are you, as a test automation engineer, tired of Selenium's flakiness? Are you seeking a better tool to automate your end-to-end tests? Have you heard of
Playwright? Perhaps you've encountered opinions that it is only worth using within a Node.js environment. I have. And as a tester, I decided to verify if
this is true. If you're interested in the results, I encourage you to read the following article.

## How Selenium to Playwright migration could be an evolution, not revolution?

Anyone interested in test automation has likely heard of [Playwright](https://playwright.dev/java/). It appeared relatively recently in a world of test
automation (Playwright for Java was
released in March 2021, for Node.js slightly earlier — in January 2020) and is becoming more and more popular among testers. This is mainly because it is
modern, simple and intuitive to use. From my perspective the key reason for Playwright's growing popularity is that many test framework features, which
previously had to be implemented manually, are available out of the box with Playwright. For example: Test retry mechanisms? Absolutely. Test report
generation? You bet. Parallel execution? Of course.

But there's a catch. These features are primarily prepared for the Node.js environment. Playwright for the JVM environment is being developed as a secondary
priority and does not offer its own powerful runner and such fancy functionalities, at least for now, require manual implementation.

So, is it worth switching from Selenium to Playwright in a JVM environment? Absolutely! This is true as long as your existing framework includes the necessary features mentioned earlier and adheres to the Page Object Model (POM) principles. Later in the article, I will explain why.

What is POM all about? POM's main advantage is that the test code is separated from the code responsible for interacting with the pages. POM is
based on representing the structure of the tested web page in the form of classes/objects. Such an object then contains methods that represent the actions a
user can perform on the page. By separating the test logic from the implementation details, when changes occur in the application, only the relevant Page Object
needs to be updated. Applying this pattern allows for avoiding code redundancy. This increases its maintainability and makes writing tests easier. Following
diagram presents the idea of Page Object Model implementation.

![Page Object Model](/assets/img/articles/2024-08-05-selenium-playwright-migration/pom.png)

In the Allegro Merchant Finance team, the technology stack for automated acceptance tests included:

- Java,
- [Selenium](https://www.selenium.dev/) testing library,
- [TestNG](https://testng.org/) testing framework,
- [RestAssured](https://rest-assured.io/) for executing necessary API requests,
- [Allure](https://allurereport.org/) for test execution reporting,
- [AssertJ](https://github.com/assertj/assertj) for test assertions,
- [Awaitility](https://www.awaitility.org/) for supporting waits,
- [GitHub Actions](https://docs.github.com/en/actions) to run on CI.

Since all of our test framework features were already implemented with separation of concerns in mind, the testing library migration process has been a
piece of cake.

The backend part of the team also develops software in the JVM environment and uses test repository to generate test data needed for daily basis
development. This was an additional reason not to switch into different programming language.

## And now, one by one: how to conduct such a migration?

Since I approached the migration as a POC, I first created a separate `v2` folder on a separate branch, where whole code that would eventually replace Selenium
was to be placed. I wanted to conduct this migration without conflicts, so that at one point, there could be two functioning libraries, and then gradually phase
out one of them - Selenium. This was a good and safe approach because it allowed for controlled implementation of the new solution. Let's go through the
steps I have taken.

### Adding Playwright dependency to `pom.xml` file

```xml
<dependency>
    <groupId>com.microsoft.playwright</groupId>
    <artifactId>playwright</artifactId>
    <version>1.42.0</version>
</dependency>
```

### Change in the `BaseTest.class`

```java
public class BaseTest {
    public Playwright playwright;
    public Browser browser;
    public BrowserContext browserContext;
    public Page page;
    public MainPage mainPage;

    @SneakyThrows
    @BeforeClass(alwaysRun = true)
    public void beforeTest() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
        browserContext = browser.newContext(new Browser.NewContextOptions().setIgnoreHTTPSErrors(true));
        page = browserContext.newPage();
        mainPage = new MainPage(page);
    }

    @AfterClass(alwaysRun = true)
    public void afterTest() {
        browser.close();
        playwright.close();
    }
}
```

### Change in page classes: abstract `BasePage.class` and its descendants

```java
public abstract class BasePage {
    public final Page page;

    public BasePage(Page page) {
        this.page = page;
    }
}
```

```java
public class LandingPage extends BasePage {
    public LandingPage(Page page) {
        super(page);
    }
}
```

### Refactor of methods and functions necessary to execute tests

This refactor went smoothly, efficiently and pleasantly. This was for Playwright numerous advantages over Selenium. One of them is that Playwright
ensures that elements are ready for interaction before executing actions. This reduces necessity for artificial timeouts, which are a common cause of unstable
tests. Moreover, Playwright has its own assertions that are designed for the dynamic nature of the web. Checks in assertions are automatically retried until the
required conditions are satisfied. If the necessary checks are not successful within the allotted `timeout`, the action fails with a `TimeoutError`.

One of the simplest possible examples, which at the same time clearly shows the difference in necessary workarounds between Selenium and Playwright, is typing
text into an input field. Let's assume I want to type the value of credit into an input field. The input is located on the landing page of Allegro Merchant
Finance's core service – business loan.

So, first, I had to prepare a function that effectively waits for and grabs the input element.

```java
public class Wait {
    private static WebDriverWait getWebDriverWait(WebDriver driver) {
        return new WebDriverWait(driver, ofSeconds(20));
    }

    public static WebElement waitForElementToBeVisibleAndGet(WebDriver driver, By locator) {
        getWebDriverWait(driver).until(ExpectedConditions.presenceOfAllElementsLocatedBy(locator));
        return driver.findElement(locator);
    }
}
```

Then I had to implement a scrolling mechanism as input is at the bottom part of page.

```java
public class Scroll {
    private static JavascriptExecutor getJavascriptExecutor(WebDriver driver) {
        return (JavascriptExecutor) driver;
    }

    public static void scrollToElementLowerThanAllegroBar(WebDriver driver, WebElement element) {
        JavascriptExecutor javascriptExecutor = getJavascriptExecutor(driver);
        javascriptExecutor.executeScript("arguments[0].scrollIntoView(true);", element);
        javascriptExecutor.executeScript("window.scrollBy(0,-100)", "");
    }
}
```

Next step is to clear the input and assure that input is ready to retrieve value. Unfortunately Selenium's method `clear()` was flaky and I was forced to
implement something more stable. To achieve that I used JavascriptExecutor.

```java
private void clearCreditValueInput() {
    JavascriptExecutor js = (JavascriptExecutor) driver;
    js.executeScript("document.querySelector('input[placeholder=\"Jaką kwotę z odnawialnego limitu chcesz wypłacić?\"]').value=''");
}
```

Finally, I was able to write down the exact function to set the value of credit in input.

```java
@Step("Set value of credit for {value}")
public LandingPage setValueOfCredit(Integer value) {
    WebElement input = waitForElementToBeVisibleAndGet(driver, VALUE_OF_CREDIT_INPUT);
    scrollToElementLowerThanAllegroBar(driver, input);
    clearCreditValueInput();
    input.sendKeys(value.toString());
    input.sendKeys(Keys.ENTER);
    return this;
}
```

A lot of work, isn't it? At the same time Playwright does an exact action within only two lines of code. The action of typing text into an input is simple
and the corresponding implementation in Playwright is also simple:

```java
@Step("Set value of credit for {value}")
public LandingPage setValueOfCredit(Integer value) {
    page.getByTestId(VALUE_OF_CREDIT_INPUT).clear();
    page.getByTestId(VALUE_OF_CREDIT_INPUT).fill(value.toString());
    return this;
}
```

Out of sheer curiosity, I decided to compare the execution times of a test using Selenium and Playwright. To do this, I migrated a single scenario — the happy
path of our team's core process. I ran this test locally 10 times for both Playwright and Selenium, and the results were as follows:

| Execution number | Selenium [s] | Playwright [s] |
|------------------|--------------|----------------|
| 1                | 23,234       | 18,762         |
| 2                | 20,377       | 16,121         |
| 3                | 20,530       | 16,133         |
| 4                | 20,000       | 15,990         |
| 5                | 19,997       | 15,816         |
| 6                | 19,855       | 15,890         |
| 7                | 19,730       | 16,256         |
| 8                | 19,634       | 17,471         |
| 9                | Error        | 15,995         |
| 10               | Error        | 16,730         |
| **Average**      | **20,420**   | **16,516**     |

#### Summary

|                        | Selenium | Playwright |
|------------------------|----------|-----------|
| Total Executions       | 10       | 10        |
| Successful Executions  | 8        | 10        |
| Average Execution Time | 20,420 s | 16,516 s  |

#### Conclusion of the test

Playwright demonstrates a more consistent and faster average execution time compared to Selenium. Selenium encountered errors in 2 out of 10 runs, which were
excluded from the average calculation. Performing such a quick and simple check gave me confirmation that I was going in the right direction. I continued to
migrate other scenarios.

### Change in existing workflow to run tests with Playwright on CI (GitHub Actions) and create Allure report of the results

In order to execute tests on CI I needed to add two steps: one installing Playwright and second running tests.

```yaml
  -   name: Install Playwright
      run: ./mvnw exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="install --with-deps"

  -   name: Build and Test
      if: always()
      run: ./mvnw clean test -Dsurefire.suiteXmlFiles=src/test/resources/playwright_mf_acceptance_tests_business_loan.xml
      env:
          MVN_EIC_USERNAME: ${{ secrets.EIC_USERNAME }}
          MVN_EIC_PASSWORD: ${{ secrets.EIC_PASSWORD }}
```

Disclaimer: You can always use dedicated Playwright container and run your tests in it. This is beneficial for avoiding dependency contamination in the host
environment and for maintaining a consistent environment for tasks such as screenshots across various operating systems. In that case you don't have to
install Playwright dependencies, because its official Docker image has it all. An example usage would look like this:

```yaml
jobs:
  playwright:
    name: 'Playwright Tests'
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright/java:v1.45.0-jammy
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Build & Install
        run: mvn -B install -D skipTests --no-transfer-progress
      - name: Run tests
        run: mvn test
        env:
          HOME: /root
```
However, just to show the easiest way to transform into Playwright from Selenium, we will stick to previous version of executing tests on CI.

My workflow also contains a step for creating a report after execution, which is conducted by Allure library within those few steps:

```yaml
  -   name: Get Allure history
      uses: actions/checkout@v2
      if: always()
      continue-on-error: true
      with:
          ref: gh-pages
          path: gh-pages

  -   name: Allure Report action from marketplace
      uses: simple-elf/allure-report-action@v1
      if: always()
      id: allure-report
      with:
          allure_results: target/allure-results
          gh_pages: gh-pages
          allure_report: allure-report
          allure_history: allure-history
          subfolder: playwright-mf-business-loan-acceptance-tests

  -   name: Deploy report to Github Pages
      if: always()
      uses: peaceiris/actions-gh-pages@v3
      continue-on-error: true
      with:
          PERSONAL_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PUBLISH_BRANCH: gh-pages
          PUBLISH_DIR: allure-history
```

Test Execution Report Using Allure Reporting Tool looks as follows:

![Allure Test Report](/assets/img/articles/2024-08-05-selenium-playwright-migration/report.png)

An expanded list of steps executed during test run:

![Allure Test Report Expanded Features](/assets/img/articles/2024-08-05-selenium-playwright-migration/report-expanded-features.png)

## Advantages of Playwright over Selenium for which we chose it

* Playwright natively supports modern web features such as Single Page Applications (SPAs), Shadow DOM and Web Components. It seamlessly handles these
  technologies, unlike Selenium, which often requires additional configurations and workarounds.
* Playwright provides native support for Chromium, Firefox, and WebKit from the outset. Selenium, in contrast, requires separate drivers for each browser.
* Playwright offers built-in support for asynchronous operations and events, crucial for JavaScript-heavy websites where elements load asynchronously.
  Selenium often needs explicit waits and polling mechanisms to manage such scenarios.
* Playwright can execute tests faster than Selenium, thanks to its efficient handling of browser sessions and network interactions. It also supports headless
  mode by default, speeding up test execution times.
* Playwright includes features like auto-wait or network stubbing. This simplifies test scenarios and enhances testing capabilities. For example, mocking API
  responses in Playwright is straightforward, whereas in Selenium, it requires extensive configuration and is only available with Selenium version 4 and above.
* Playwright allows tests to run on Continuous Integration (CI) systems without needing external virtual machines like Selenium Grid.

I believe that as we continue to work with Playwright, further advantages of using this tool will become apparent.

## Next steps — what are we planning to do in the foreseeable future

* Migrate tests of the rest of products in Allegro Merchant Finance.
* Migrate backend requests from RestAssured library to Playwright.
* Expand test cases to include scenarios that require request manipulation, such as headers and response statuses manipulation.
* Possibly migrate test execution reporting into Playwright reporting.

## Final conclusion

Migrating from Selenium to Playwright is a manual process that necessitates a thorough understanding of the differences between the two frameworks. This process
involves mapping equivalent commands and adapting to Playwright's distinct method of handling browser interactions. Although it can be a bit time-consuming at
the beginning, the advantages of Playwright's modern architecture and advanced features can justify the investment for numerous projects.
