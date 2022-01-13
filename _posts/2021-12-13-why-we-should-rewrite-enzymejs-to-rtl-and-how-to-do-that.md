---
layout: post
title: "Why should we rewrite enzyme.js to react-testing-library and how to do that?"
author: [magdalena.mazur]
tags: [tech, frontend, javascript, jest, enzyme, react-testing-library, rtl, react]
---

Everyone repeats like a mantra that tests are an indispensable element of development work. Is there anything to it?
 Well, I need to admit that as a developer, I rather often want to skip the test writing stage. I assume I’m not the
  only one. I’m aware that it’s a mistake, even with testers on board. Effective and efficient testing of your own
   code can help with catching bugs in new functionalities, as well as in changes to already existing ones. It cannot
    be questioned. Sometimes tests also help to understand how some long—unused functionality or component works. And
     that’s a small bonus too. **Can a large project cope without testing? Probably so. But the number of errors and
      their severity will probably be much higher.** That’s why in Allegro Ads we pay attention to writing tests.

## Frameworks
We have a fairly large number of frameworks that are used to write tests in JavaScript. We can list tools like:
 [MochaJS](https://mochajs.org/), [Jest](https://jestjs.io/), [Karma](https://karma-runner.github.io),
  [Jasmine](https://jasmine.github.io/), [Cypress](https://www.cypress.io/). However, in this article, we will pay
   special attention and compare two testing javascript libraries: [Enzyme.js](https://enzymejs.github.io/enzyme/)
    and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (often called RTL).

![npm trends screen](/img/articles/2021-12-13-why-we-should-rewrite-enzymejs-to-rtl-and-how-to-do-that/01.png)
*Source [npm trends](https://www.npmtrends.com/@testing-library/react-vs-enzyme)*

## EnzymeJS
From the Enzyme documentation we can read a short description:

> Enzyme is a JavaScript Testing utility for React that makes it easier to test your React Components' output.
> You can also manipulate, traverse, and in some ways simulate runtime given the output.

Enzyme was released in **2015 by AirBnB**. And let’s face it, Enzyme has gained a lot of popularity. Last year, the
 library was moved from AirBnB space to external github space as a separate independent organization. This step was
  intended to encourage the community to further develop the library.

![commit diffrences](/img/articles/2021-12-13-why-we-should-rewrite-enzymejs-to-rtl-and-how-to-do-that/02.png)

![commit diffrences](/img/articles/2021-12-13-why-we-should-rewrite-enzymejs-to-rtl-and-how-to-do-that/03.png)
*Source [Enzyme github](https://github.com/enzymejs/enzyme/commit/b06750bb5f6248ceb9c3fae903a71d0747a420d6)*

When it comes to raw data, the latest version of **Enzyme 3.11.0** has a bundle size of **463.2kB minified (127.5 kB
 minified + gzipped)** and was released on **20 December 2019**. Currently is 258
  [open issues](https://github.com/enzymejs/enzyme/issues) and 31 open PR’s.

![bundlephobia Enzyme sreen](/img/articles/2021-12-13-why-we-should-rewrite-enzymejs-to-rtl-and-how-to-do-that/04.png)
*Source [Bundle Phobia](https://bundlephobia.com/package/enzyme@3.11.0)*

Interesting fact:
- There are also Enzyme Adapter Packages for React. So you need to install adapter package and its dependencies
 related to the version of React that you are using. For example, for version 16, it also needs
  *enzyme—adapter—react—16* to be installed. Unfortunately, it does not support all features completely.
   It should be mentioned that there is not offical adapter for React 17 yet, which has been released in
    October 2020 (so it is more than a year!). If you don't want to use community version you are still blocked and you
     cannot use the new React features.

## React Testing Library (often called RTL)
RTL says about itself:

> The React Testing Library is a very light—weight solution for testing React components. It provides light utility
 functions on top of react—dom and react—dom/test—utils, in a way that encourages better testing practices.

Released in **April 2018 by Kent C. Dodds**. The latest stable version **12.1.2** of RTL has a bundle size of **215.8kB
 minified (47.3kB minified + gzipped)** . The RTL repository has 26
  [open issues](https://github.com/enzymejs/enzyme/issues) and 2 open PR’s.

![bundlephobia RTL screen](/img/articles/2021-12-13-why-we-should-rewrite-enzymejs-to-rtl-and-how-to-do-that/05.png)
*Source [Bundle Phobia](https://bundlephobia.com/package/@testing-library/react@12.1.2)*

Interesting facts:
- When you create a project by Create React App, you will get support for React Testing Library right away.
- Jest documentation links to the RTL website in the
[*Testing Web Framework*](https://jestjs.io/docs/testing-frameworks#react) section as well as React documentation in the
 [*Recommended Tools*](https://reactjs.org/docs/testing.html#tools).
- Testing—library allows us to test with the same API not only React but also others frameworks like Vue
 (testing—library/vue), Angular (tesiting—library/angular), Svelte (testing—library/svelte) etc. This could be some
  advantage for people working on several projects in different technologies. There is also *dom-testing-library* which
   allows writing tests without any framework!

## Basic differences

The main differences between the two libraries that I can notice:
1. **Different approaches to testing**

   What distinguishes RTL is that we find elements by their labels or texts, almost like a user would. The point is to
    replicate and simulate the user’s behavior. RTL tries to render components to the DOM and doesn’t give us access
     directly to the internal component. While Enzyme uses shallow rendering (or sometimes deep rendering) and
      encourages us to test the components instance using its state and props. Enzyme also allows full rendering of DOM
       but it is not the basic assumption of the library’s operation.
2. **Age**

   Enzyme is 6 years old, RTL is 3 years old

## Comparison of downloads

Below we can see a comparison of the number of downloads of both libraries in the last 5 years. Between August and
 September 2020, the number of RTL downloads exceeded the number of Enzyme downloads.

![Enzyme and RTL dowloands graph](/img/articles/2021-12-13-why-we-should-rewrite-enzymejs-to-rtl-and-how-to-do-that/06.png)
*Source [npm trends](https://www.npmtrends.com/@testing-library/react-vs-enzyme)*

In the case of RTL, it is clear that the number of downloads is still growing strongly. On the other hand, it can be
 suspected that the highest peak of Enzyme downloads is already behind.

## Reasons to change the testing library

Well, let’s be honest, Enzyme.js is a powerful library which has helped us test our React Components in an easier way
 for a long time. But maybe... too long? The first official release was in December 2015. Do not get me wrong, I don’t
  want to say that everything old is bad. But the frontend world is changing constantly, just as the approach to
   testing it. I know that the Enzyme.js library hasn’t been deprecated yet, but there are a lot of reasons to switch
    your test library right now. **If you haven’t read it I highly recommend you to take a look at this
     [Piotr Staniów article](https://www.piotrstaniow.pl/goodbye-enzyme)** (it takes about 10 minutes to read).

The main reasons for me to think about slowly rewriting your tests and switch to another library from this article are:
- one developer maintaining the entire package,
- not keeping up with React changes.

I think these are big blockers in using this tool.

## Case study of rewriting

Below I will present my own example created for the purposes of this article. It should present the minimal effort to
 rewrite tests from one library to another.

### Component:

```js
import React, { useState } from 'react';

export const Test = ({ defaultCounter = 0, header = 'Default header' }) => {
    const [counter, setCounter] = useState(defaultCounter)
    const increment = () => setCounter(counter + 1)
    const decrement = () => setCounter(counter - 1)

    return (
        <div>
            <h1>{header}</h1>
            <p className='counter'>{counter}</p>
            <button onClick={increment}>Increment counter</button>
            <button onClick={decrement}>Decrement counter</button>
        </div>
    )
};

```

### Enzyme example:

```js
import React from 'react';
import { mount } from 'enzyme';

import { Test } from '../Test';

describe('<Test />', () => {
  it('should render default header', () => {
    // when
    const wrapper = mount(<Test />);

    // then
    expect(wrapper.text()).toContain('Default header');
  });

  it('should render header from props', () => {
    // when
    const wrapper = mount(<Test header="My simple calculator" />);

    // then
    expect(wrapper.text()).toContain('My simple calculator');
    expect(wrapper.text()).not.toContain('Default header');
  });

  it('should render default defaultCounter', () => {
    // when
    const wrapper = mount(<Test />);

    // then
    expect(wrapper.find('.counter').text()).toBe('0');
  });

  it('should render defaultCounter from props', () => {
    // when
    const wrapper = mount(<Test defaultCounter={100} />);

    // then
    expect(wrapper.find('.counter').text()).toBe('100');
  });

  it('should increment counter on click', () => {
    // given
    const wrapper = mount(<Test defaultCounter={100} />);
    const button = wrapper.find('button').at(0);

    // when
    button.simulate('click');

    // then
    expect(wrapper.find('.counter').text()).toBe('101');
  });

  it('should decrement counter on click', () => {
    // given
    const wrapper = mount(<Test defaultCounter={100} />);
    const button = wrapper.find('button').at(1);

    // when
    button.simulate('click');

    // then
    expect(wrapper.find('.counter').text()).toBe('99');
  });
});
```

### What needs to be changed:
- remove **mount** and use **render** instead
- remove **wrapper** variable and use **screen** to get elements
- replace **simulate(’click’)** with **userEvent**

### React testing library example:

```js
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Test } from '../Test';

describe('<Test />', () => {
  it('should render default header', () => {
    // when
    render(<Test />);

    // then
    expect(screen.getByRole('heading', { name: 'Default header' })).toBeInTheDocument();
  });

  it('should render header from props', () => {
    // when
    render(<Test header="My simple calculator" />);

    // then
    expect(screen.getByRole('heading', { name: 'My simple calculator' })).toBeInTheDocument();
    expect(screen.queryByText('Default header')).not.toBeInTheDocument();
  });

  it('should render default defaultCounter', () => {
    // when
    render(<Test />);

    // then
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render defaultCounter from props', () => {
    // when
    render(<Test defaultCounter={100} />);

    // then
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should increment counter on click', () => {
    // given
    render(<Test defaultCounter={100} />);

    const button = screen.getByRole('button', { name: 'Increment counter' });

    // when
    userEvent.click(button);

    // then
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('should decrement counter on click', () => {
    // given
    render(<Test defaultCounter={100} />);

    const button = screen.getByRole('button', { name: 'Decrement counter' });

    // when
    userEvent.click(button);

    // then
    expect(screen.getByText('99')).toBeInTheDocument();
  });
});

```

## Enzyme and RTL in Allegro Ads

My team is currently working on the development of [Allegro Ads](https://allegro.pl/ads), which is an advertising tool
 for our ecommerce platform sellers. It is a whole panel for viewing statistics, displaying advertising campaigns. We
  provide sponsored offers for our Allegro site, Facebook, Google and recently even the partner websites. Our sellers
   pay us for the opportunity to advertise their products, and at the same time we strive to ensure that these ads
    accurately reach people potentially interested in buying, thereby generating profits for sellers.

The main technology stack is standard and still pretty cool. The core of the project is written in React, and
 significant parts have been rewritten to Typescript. For testing purposes, we use Jest. In my opinion this is a very
  good and stable tool, easy to work with. It has quite a low entry threshold, even if someone hasn’t had too much
   experience with tests before. The main advantages of Jest for me are minimal configuration and quite good
    documentation. But for testing react components we currently have two libraries and I’ll explain why in a moment.

The 2.0 version of platform Allegro Ads was released about 6 years ago, with an Enzyme library on a board. A year ago
 the team added a react testing library to package.json. We have both packages so far. **Recently we officially decided
  to slowly rewrite the Enzyme library for good.** We added the rule to our docc (Declaration of Code Convention) that
   the new components are tested just in RTL, the old ones will be rewritten during the development of specific parts.

## Migration effects so far

Currently we have got **592 test files** (counting after the file names with “spec” phrase). In these files we can also
 find **709 of unique “describe”** usage for wrapping a series of tests, and **1796 unique test cases**. Half of tests
  are written only in Jest, but a significant amount of tests for better testing use extra libraries.

React testing library is used in **131 files**, which is around **22% of all test files**.
Enzyme tests are in **137 files** which is around **23%**.

So the Enzyme is still used more often. However, keep in mind that we have been using Enzyme in this project from the
 beginning and RTL for a year. So I’m quite stunned by these numbers. I did not think that the use of RTL would
  increase so significantly in a year. Of course, there is still a long way to completely eliminate Enzyme, especially
   among other project priorities, but now I’m convinced that small steps will be enough to do that.

## Summary

Hopefully this article showed you that switching from one to the other library doesn’t have to be difficult. As
 programmers, we will encounter such situations frequently. I think that the effort put into replacing old libraries
  with newer ones and keeping your code free of technological debt will bring tangible results for developers, project
   and, finally, users.

I hope that I was able to show you why we rewrite the Enzyme tests to RTL, how we do it and what stage we are at.
 Probably it is not the end. What are we going to replace RTL with in the future? We’ll see. :)
