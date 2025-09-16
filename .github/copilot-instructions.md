# Project scope and goals

- This project contains blog posts that are published on the blog of Allegro, a high-tech company based in Poland. The first use of the Allegro name in a
  blog post should be in the form of the following link: `[Allegro](https://allegro.tech)`.
- Blog posts are intended for technical audiences, such as software engineers, testers, UI designers, etc. Each reader may specialize in a different area, but
  general technical knowledge is expected.
- The audience is international and may not be familiar with the Allegro brand or with Polish culture in general. If references to Allegro or other entities
  well known in Poland but not abroad appear, they should be explained.

# General rules

- Clearly mention when any of your hints are due to a specific rule listed in this document. For example if you suggest changing the spelling `colour` to
  `color`, mention that it is due to the rule about preferring American English.

# Project structure

- The blog uses Jekyll, a static site generator. It is deployed to Github Pages, so only the subset of Jekyll that works in Github Pages should be used.
- Blog posts are stored in separate Markdown files in the `_posts` directory. The file naming convention is `YYYY-MM-DD-title.md`, where `YYYY-MM-DD` is the
  date of publication and `title` is a slug (short, hyphen-separated version of the blog post title).
- Images used in a single blog post named `YYYY-MM-DD-title.md` should be stored in the directory `assets/img/articles/YYYY-MM-DD-title/`.
- Each author needs to be added to the `_data/members.yml` file, with their identifier (usually `firstname.lastname`), full name, a short bio, and
  optional links to their social media profiles.
- For each author in `_data/members.yml`, a corresponding image should be placed in `assets/img/authors/` with the filename matching the author's identifier
  (usually `firstname.lastname.jpg`).
- For each author in `_data/members.yml`, a directory names as the author's identifier (usually `firstname.lastname`) should be created in `authors/`
  directory. This directory should contain an `index.md` file with contents matching the template:
  ---
  layout: author
  author: firstname.lastname
  ---
- A few static elements of the page exist, for example the "About us" page in `about/index.html`.

# Rules for blog post contents

## Language

- All blog posts are written in English. Each blog post should consistently use either American English or British English and not mix the two. Prefer
  American English when in doubt.
- Blog posts should use typographic quotes: `“”` and `‘’`, typographic apostrophes `’`, as well as em-dashes (`—`) where appropriate.
- The language should be clear and concise, but each author may use their own style.

## Formatting

- Blog posts may contain images. Use Markdown syntax for images without captions. If an image needs a caption, insert it as HTML following this template:
  <figure>
  <img alt="Alt text" src="/assets/img/articles/YYYY-MM-DD-title/short-image-name.jpg" />
  <figcaption>
  Image caption, usually the same as alt text
  </figcaption>
  </figure>
- The first paragraph of a blog post should not be preceded by any headers.
- Headers should start at level 2.

## Content

- Blog posts may not reveal any confidential information about Allegro or its customers. Examples of confidential information include, but are not limited to:
  - Earnings, income, or any kind of financial information
  - Internal processes and tools
  - Technical information which makes it possible to infer confidential information. For example, the number of requests to a service may be confidential if
    it allows inferring the number of sales Allegro is making.
- If any kind of confidential information appears in the post, print a clear warning that such information may probably not be published and advise the
  author to ask for help on #allegro-tech-blog Slack channel.
