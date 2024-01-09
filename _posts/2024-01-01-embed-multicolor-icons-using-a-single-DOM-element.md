---
layout: post
title: "Embed multicolor icons using a single DOM element"
author: [pawel.lesiecki, maciej.suszko]
tags: [tech, web, svg, css, html]
---
Hello, fellow Web developers!

Icons are an integral part of most modern UIs.
What is the best way to embed icons nowadays?
This area is full of pitfalls. 
You better proceed with caution when trying to answer that question.

Though there are many possibilities, [some of which are considered harmful](https://twitter.com/_developit/status/1382838799420514317).
Various inline SVG techniques have become more popular over time. Possibly due to the lack of suitable alternatives, although not using the cache is a huge trade-off.
Thankfully, [there are some voices of reason](https://twitter.com/getifyX/status/1720810762409566459) in the community.

At [Allegro](https://allegro.tech/), we’ve been using SVG and CSS filters for quite some time.
However, they have their limits and could be better suited for the challenges of the themeable design system.

Let’s pause for a moment and rethink the approach to icons.
It has to meet several requirements:
- themeable,
- cacheable, 
- easily embeddable.

## Can we do better than we’ve been doing so far?

All the tools needed to perform the trick have been available in major browsers for at least few years.
Is it possible everyone just failed to connect the dots?
It turns out that the platform is capable of dealing with icons more efficiently.

**Let us introduce the SVG+CSS technique. It lets you have a 3-color icon using just one DOM element and one external SVG.**

We have found nothing similar, whether online or with ChatGPT, which makes us want to share this idea with you even more.

Consider the proposed technique if you care about performance.

### Key benefits are:

1. Caching.
2. Works cross-domain.
3. Customizable more than a single color.
4. Icons load after critical resources and content, not bloating the markup.

We will control the colors of 3 different parts with a single DOM element and SVG resource.

Sounds interesting? Then, let’s dive into how we can accomplish this.

## Implementation

SVG and CSS are gifts that keep giving and can do wonders combined.

The proposed technique is a combination of two platform capabilities.
1. [SVG Fragments](https://css-tricks.com/svg-fragment-identifiers-work/)
2. [CSS Masks](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image)

[SVG Fragments aren’t really a new technology](https://caniuse.com/svg-fragment).
About five years ago, we considered using CSS masks, but we still supported IE back then.
At that time, we had not yet thought of combining it with fragments.

As a case study let’s pick one of our icons — ![a-icon](https://a.allegroimg.com/original/34bbe1/2be1acde4b8aa1b2a255d958fd59/illustration-allego-in-circle-big-db0c91e439).

With the following source:

```svg
<svg viewBox="0 0 32 32" fill="none" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
  <path d="..." fill="#B0B8BC"></path>
  <path clip-rule="evenodd" d="..." fill-rule="evenodd" fill="#FF7B33"></path>
  <path d="..." fill="#D9DFE4"></path>
</svg>
```

This particular icon consists of 3 parts, each with a different color.
Now, we’re going to control these colors with the document’s CSS.

It’s time to program in SVG and CSS for a moment.

### Step #1 — SVG Fragments

First, let’s craft our test subject and introduce the fragments.
Each `path` gets a unique Fragment Identifier by setting an `id` attribute.
Next, we add a little CSS to enable rendering fragments in isolation. Think of it as an image sprite.

For the sake of CSS simplicity, we also group all the paths under an extra `g` element with a unique `id`.

As a result, the SVG is supposed to look like this:

```html
<svg viewBox="0 0 32 32" fill="none" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
  <style>
    path:not(:target) {
      display: none;
    }
    g:target path {
      display: inline;
    }
  </style>
  <g id="icon">
    <path id="border" d="..." fill="#B0B8BC"></path>
    <path id="a" clip-rule="evenodd" d="..." fill-rule="evenodd" fill="#FF7B33"></path>
    <path id="shadow" d="..." fill="#D9DFE4"></path>
  </g>
</svg>
```

It produces 4 fragments, one for each of the three paths and the last for the whole icon. Each of them can now be rendered as a separate image:

1. [`#a`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#a) — ![`#a`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#a)
2. [`#border`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#border) — ![`#border`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#border)
3. [`#shadow`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#shadow) — ![`#shadow`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#shadow)
4. [`#icon`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#icon) — ![`#icon`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#icon)

Now, the regular fragment-less URL will display a blank image.
Thus, for the full icon, we’re going to add a [`#icon`](https://a.allegroimg.com/original/34901c/db3b33c5488eb13bc5244e215953/illustration-allego-in-circle-big-ab3336c0b3#icon) fragment to the URL.

We won’t use the `#a` fragment, but let’s keep its identifier.

### Step #2 — CSS Masks

With SVG Fragment Identifiers up and ready, we can use CSS Masks.

The base class `.icon` stacks three layers on top of each other, ready for a mask.

```css
.icon {
  position: relative;
  width: 32px;
  height: 32px;
  mask-repeat: no-repeat;
  background-color: currentColor;
}
.icon::before,
.icon::after {
  content: '';
  position: absolute;
  width: inherit;
  height: inherit;
  background-color: inherit;
}
```

The last CSS class is for our specific icon.

```css
.icon--a {
  mask-image: url('./a.svg#icon'); /* full icon’s shape */
  color: #FF7B33;
}
.icon--a::before {
  mask-image: url('./a.svg#shadow'); /* shadow’s shape */
  color: #D9DFE4;
}
.icon--a::after {
  mask-image: url('./a.svg#border'); /* border’s shape */
  color: #B0B8BC;
}
```

The critical part is that we picked the whole icon, not any fragment, as the parent’s mask, so we have the entire icon visible. 
That’s because the parent layer masks its children.

We selected the orange color of the `a` for the parent layer.
Then, we put the two remaining layers on top of it.
The second and third layers are for shadow and border parts, respectively.

**We can describe this as the whole icon in single color covered by one or more shapes in different colors.**

When an icon has intersecting parts, there’s one thing to keep in mind. 
Backgrounds render on top of each other in a particular order:
1. the parent’s background,
2. the `::before` pseudo-element’s background,
3. the `::after`’s background at the end.

As a result, we can embed the icon by a single element.

```html
<div class="icon icon--a" aria-hidden="true"></div>
```

Let’s also consider accessibility.
Usually, icons are [purely decorative content](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden#description).
That’s why we remove them from the accessibility tree by `aria-hidden="true"`.

The result is supposed to look like the original icon from the start —![the original icon from the beginning](https://a.allegroimg.com/original/34bbe1/2be1acde4b8aa1b2a255d958fd59/illustration-allego-in-circle-big-db0c91e439).

Now, the single element gives us control over up to three parts of our icon.
Moreover, we can change colors independently and dynamically.

## The demo
Feel free to check the [demo](https://three-colors-one-element-icon.plesiecki.repl.co/).

Pretty neat.

We found this technique practical, and we’re keen to use it in the future.

## More colors
If you need more than 3 colors, switch from pseudo-elements to regular elements. Then, you can stack as many layers as you want. 
Another option is to combine `background-image` with gradients instead of `background-color`.

Enjoy & use the platform ❤️
