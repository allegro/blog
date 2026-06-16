# Project scope and goals

- This project contains blog posts that are published on the blog of Allegro, a high-tech company based in Poland. If the post mentions Allegro, the first
  use of the Allegro name should be in the form of the following link: `[Allegro](https://allegro.tech)`.
- Blog posts are intended for technical audiences, such as software engineers, testers, UI designers, etc. Each reader may specialize in a different area, but
  general technical knowledge is expected.
- The audience is international and may not be familiar with the Allegro brand or with Polish culture in general. If references to Allegro or other entities
  well known in Poland but not abroad appear, they should be explained.

# Specific operations

## Checking a blog post

- When asked to "check" the document, "review" it, or to perform other similar actions, you must always follow the rules listed in this document and
  must include the following steps:
  - Check spelling and grammar
  - Check formatting
  - Check the content for compliance with the rules listed
  - Check the images (including image contents) for compliance with the rules listed
- When checking the document, make the output as long as necessary to list all issues found.
- Preserve word wrapping and line breaks in the original document.
- Clearly mention when any of your hints are due to a specific rule listed in this document. For example if you suggest changing the spelling `colour` to
  `color`, mention that it is due to the rule about preferring American English.

## Writing social media posts

- When asked to write or suggest a social media post, follow these instructions exactly.
- The blog post must pertain to a single blog post. If it is not clear which blog post you should work on, ask the user.
- Follow these guidelines:
  - The input is a Jekyll page, consisting of front matter and markdown-formatted text.
  - Use the title of the blog post, taken from the front matter
  - Follow the title with the post's production URL in parentheses. It will be the same as the URL used to view the post locally, but with
    `https://blog.allegro.tech` as the base URL.
  - Avoid any markdown formatting, but you can use emojis sparingly where appropriate
  - The audience is programmer, testers, and other people working in IT. Assume basic understanding of IT and software engineering concepts.
  - Make it inviting to read the text
  - Use style which will be convincing to programmers and other geeks; avoid marketing style
  - Keep it direct and concise. Be factual and avoid exaggerations or excessive excitement.
  - Add up to a few hashtags matching the subject - use them either when using the appropriate word in the text or add them at the end if they don't fit the
    natural flow of the text
- First, print an l1 heading saying "Social media post suggestions". Follow with a paragraph saying "These are only suggestions. Treat them as raw drafts.
  Review them carefully, and adapt contents and style to match the post's contents and your personal taste.". Then:
  - Create a short tweet suitable for Tweeter/X based on the blog post:
    - Precede it with an l2 heading saying "Tweet suggestion"
    - Stay within the length limit of 240 characters
  - Create a somewhat longer text suitable for Facebook or Instagram based on the blog post:
    - Precede it with an l2 heading saying "FB post suggestion"
    - Stay within the length limit of 2000 characters

## Preparing a blog post for publication

- When asked to prepare a post for publication, you must perform the following actions and only those actions (including smaller steps necessary to achieve
  these goals). Do not run any other checks or modifications unless explicitly told to:
  - Make sure you are working on a single blog post provided in your context. If it is not clear which blog post you should work on, suggest the latest blog
    post by date.
  - Run `scripts/prepare_publication/prepare_publication.py` with the blog post as the argument. Stop if the script ends with an error.
  - Run `bundle exec jekyll build` to ensure the blog post builds correctly. If it does not, print the error message and stop any further actions.
  - Ask the user if they want to view the blog post rendered after the modification. Print the question with a large, well-visible font.
    If they confirm, run `bundle exec jekyll serve` and inform the user about the URL where they can view the blog post. The base URL will be in the output
    of the command, printed before the command finishes - you have to capture the partial output. The URL path uses the <yyyy>/<MM>/<title>.html format.
  - Suggest social media posts for the blog post.

# Project structure

- The blog uses Jekyll, a static site generator. It is deployed to Github Pages, so only the subset of Jekyll that works in Github Pages should be used.
- Blog posts are stored in separate Markdown files in the `_posts` directory. The file naming convention is `yyyy-MM-dd-title.md`, where `yyyy-MM-dd` is the
  date of publication and `title` is a slug (short, hyphen-separated version of the blog post title).
- Images used in a single blog post named `yyyy-MM-dd-title.md` should be stored in the directory `assets/img/articles/yyyy-MM-dd-title/`.
- Each author needs to be added to the [_data/members.yml](/_data/members.yml) file, with their identifier (usually `firstname.lastname`), full name, a
  short bio, and optional links to their social media profiles.
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
- Blog posts should use typographic quotes: `“”` and `‘’`, typographic apostrophes `’`, as well as em-dashes (`—`) where appropriate. Em-dashes should be
  surrounded by spaces on both sides.
- The language should be clear and concise, but each author may use their own style.

## Formatting

- Lines should not be longer than the length mentioned in [.editorconfig](/.editorconfig) (`max_line_length` key), except for lines that contain long URLs,
  tables, or code blocks.
- Blog posts may contain images. Use Markdown syntax for images without captions. If an image needs a caption, insert it as HTML following this template:
  <figure>
  <img alt="Alt text" src="/assets/img/articles/yyyy-MM-dd-title/short-image-name.jpg" />
  <figcaption>
  Image caption, usually the same as alt text
  </figcaption>
  </figure>
- The first paragraph of a blog post should not be preceded by any headers.
- Headers should start at level 2.
- When linking to other blog posts, only use relative links and the syntax `[Link text]({% post_url YYYY-MM-dd-title-slug %})`.

## Content

- Blog posts may not reveal any confidential information about Allegro or its customers. Examples of confidential information include, but are not limited to:
  - Earnings, income, or any kind of financial information
  - Internal processes and tools
  - Technical information which makes it possible to infer confidential information. For example, the number of requests to a service may be confidential if
    it allows inferring the number of sales Allegro is making.
- If any kind of confidential information appears in the post, print a clear warning that such information may probably not be published and advise the
  author to ask for help on #allegro-tech-blog Slack channel.

## Images

- If the blog post contains any images, their contents as well as alt-text and captions must conform to rules listed below:
  - Ask the author explicitly if they have permission to use for all images. Either the images must be created by the author, the auther must have been given
    explicit permission to use them, or they must be in the public domain or under a license that allows free use (ensure proper attribution in such case).
  - Analyze the content of the images and if it contains faces of any individuals (unless they are just small parts of a larger crowd), explicitly ask the
    author if they have permission to publish these faces. Suggest blurring out the faces if such permission is not present.
  - Print a warning if the image seems to be a diagram or a line drawing and has transparent background which may cause it to become hard to understand in dark
    mode.

## Other

Apply any other rules mentioned in [CONTRIBUTING.md](/CONTRIBUTING.md) that are relevant to the task you are executing.
