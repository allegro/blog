# Contributing to the blog

Instructions in this file are for prospective authors who would like to publish on the blog.
Please also have a look at [README.md](README.md) for a general introduction to what the blog is about and contact information.

# Before you begin

* If in doubt whether your idea for a post is right for the blog, [get in touch with the editors on Slack](README.md#where-to-get-help)
* All texts should be in English. Editors will be happy to help with grammar and spelling. In special cases, we can arrange for our company professional
  translators to help with translating the whole text.
* Read a few recent posts in order to get familiar with subjects and style.
* The post should be comprehensible for:
    * an engineer from outside Allegro IT
    * an engineer who does not use Allegro
    * an engineer from outside Poland who has never heard of Allegro
* Keep it simple, keep it short: this is a blog rather than a very formal place.
* Nonetheless, make sure the text’s content is correct and its form reasonably clear. We want the blog to be high-quality.
* Read the [guidelines](#review-guidelines) in this document for a quicker code review.
* Check your post with a Markdown viewer. Markdown preview in IntelliJ is a good start. You can also [test-render the page on your local machine](#how-to-test-render-your-post).

# Editorial process

0. Editors do their best to use common sense over hard and fast rules whenever possible. The process is in place only in order to make everyone’s lives easier.
0. Preferably, find two reviewers who know your post’s subject matter well (for example, your teammates, or anyone within the company you see fit).
0. For first time reviewers, let them read the [review guidelines](#review-guidelines) below.
0. Blog editors also conduct a review. It focuses mostly on language and style, but we try to have a look at the content as well.
0. Standard discussion regarding any comments from the reviews follows.
0. With two approvals, the PR is (almost) ready for publication.
0. Editors will find a suitable publication time depending on the number of posts in review queue, when previous posts were published, etc.
   Do let us know in case you care for a particular publication date, e.g. when your post talks about a very current topic, is related to a recent conference
   or software release, etc.
0. One of the editors updates the publication date and publishes the post by merging the PR.
0. HR team promotes posts on social media (Twitter and Facebook) on our behalf. Authors and editors suggest the best hashtags to use. We encourage authors to
   retweet and also to promote posts via their own social media accounts. If you frequent reddit, hackernews or any other place you see fit, do not hesitate to
   share links to your posts there.

# Review guidelines

## For the author

* Treat review comments as feedback. They are probably worth applying but if you disagree with something, let’s discuss it.
* If the discussion starts getting long, get in touch with the commenter in person.
* In the end, the post will be signed with your name, so we won’t force you to apply all comments. However, the post will also be published on a page bearing
  the Allegro brand name, so editors have to also represent the company’s interests and may (in extreme cases) ban a post from publication.
* There is no need to confirm each comment you agree with. A single summary comment is enough.

## For the reviewer (and the author as well)

* Keep in mind the common-sense rules outlined in [Before you begin](#before-you-begin) section.
* Preferably, skim over the whole text before you start commenting to get a general understanding of what the text is about.
* If you have lots of comments, consider marking them on a paper printout of the text: this may be quicker than commenting on GitHub and will avoid generating
  tons of e-mails. In certain cases, Google Docs may also be useful, for example if the are lots of non-controversial language fixes which you can just enter in
  “suggest mode” and the author can then easily accept.
* The first paragraph of the text will be used as the post’s summary. Consider:
    * whether it says what the text is about, who the target audience is, and what they can gain from reading it;
    * does it encourage the user to read the whole text?
* Does the post have a plot? Does it read well?
* Is the text structured? Is it divided into sections?
* Are sentences too long or unnecessarily complex?
* Avoid numbered section headers.
* If you cannot understand something (whether the content or in terms of language), probably neither can the reader.
* We are not native speakers, but we try to avoid mistakes in grammar and spelling. In particular, we try to avoid common pitfalls of “local English” such as:
    * missing articles (_a_/_the_)
    * _a_ used instead of _an_ (e.g. _a HTTP request_ is a common error)
    * using wrong tenses or getting the sequence of tenses wrong
    * literally translating idioms
    * invalid use of commas, for example always using a comma before _which_
* Check Markdown syntax: while we have a script which catches most formatting errors, some may still slip through (invalid links, bulleted lists partially
  merging with following paragraphs, etc.).
* Preferably, check your post with a Markdown viewer.
* Check if links are not broken and if the first use of project or framework names (e.g. [Mockito](https://github.com/mockito/mockito)) is a link if it makes sense.
* If the post contains code snippets, check if they are correct and formatted as code. Is the code long enough to drive the point home but short enough to
  not make the post hard to read?
* Does the post contain any internal information which could cause the company trouble if revealed? We can openly talk about the technologies we use, but
  sometimes some details have to be left out. Especially sensitive areas include:
    * Security (e.g. any information which might create a security vulnerability, enable a DDoS attack, etc.)
    * Business plans which have not yet been publicly announced (e.g. writing that you work on a service which allows us to provide free shipping en masse before
      we announced Allegro Smart).
    * Any information which has not been officially released by the company but makes it possible to deduce something about our financials (e.g. the exact number
      of transactions or their value). However, order-of-magnitude values such as _hundreds of rps_ or _a few terabytes of data_ are usually OK. This is especially
      important since we became a public company.
      When in doubt, consult the IT Security Team.
* If there are any images in the post, make sure they are either our own work or we are allowed to use them (by permission from the author, the image being
  in the public domain, or otherwise being licensed in a way which allows us to use it). By default, images are copyrighted and can’t be reused without permission.
  If in doubt, get in touch with the editors.
* We want the posts to have a nice, consistent look, so please check our [typographic rules](#typography). Obviously, they apply to the text, not to code snippets.
  In particular:
    * Use curly quotes `“”` rather than straight quotes `""`.
    * Use the em-dash `—` rather than the minus sign `-` where appropriate.
    * Consistently use capital letters where appropriate: it’s _HTTP_, not _http_, same goes for _ID_
      (unless your post is about [psychoanalysis](https://en.wikipedia.org/wiki/Id,_ego_and_super-ego#Id)).

# How to write your text and start the review process — technicalities

## Repo permissions

The repository for blog authors is at https://github.com/allegro-internal/blog/ (the project at allegro/blog is only
technical, used for publishing the blog outside the organization, and actually contains a copy of
allegro-internal/blog but without full commit and review history).

You need to add yourself to the `blog-authors` AD group in [SIM](https://sim.allegrogroup.com/) in order to gain write
permissions to allegro-internal/blog repository.

## What goes into your PR

* A new file in `_posts` with a name matching the template `YYYY-MM-dd-simplified-post-title.md` should hold your text.
    * The `YYYY-MM-dd` part will be updated just before publication anyway, so it doesn’t matter much: you can use the date on which you started writing.
    * Formatting is done using Markdown, specifically the [github-flavored-markdown](https://github.github.com/gfm/) dialect.
      At the top, you should have the so-called [front-matter](#front-matter) which is a piece of YAML that contains metadata such as post title and author info.
      You can use [merged PRs](https://github.com/allegro/blog/pulls?q=is%3Apr+is%3Aclosed) as examples for the file structure.
* If this is your first post, also add following information:
    * Your short bio in `_data/members.yml`. Your ID should match the template `firstname.lastname`. You will also use it in following steps.
    * A file called `authors/firstname.lastname/index.md`, with contents adapted from some other author’s file.
    * A file called `img/authors/firstname.lastname.jpg` which should be your picture in square format (face only).
* Create the PR. Apart from the notifications GitHub will send them, you can also let the editors know on Slack.

## Front matter

We use Jekyll Front Matter for metadata. You should put the following header in your article:

    ---
    layout: post
    title: My awesome post
    author: firstname.lastname
    tags: [tech, java, testing, rest, mockito, junit, assertj]
    ---

## Special tags

There are two special tags: `tech` and `agile`.

Choose `tech` if you want to publish on Tech Blog.

Choose `agile` if you want your to publish on Agile Blog.

## Line breaks
Text lines should not be longer than **160 characters**, for the same reason as lines in the source code.

## Code formatting

Inlined code fragments such as `user_id` should be wrapped  with backtick quotes (`).

Code blocks should be formatted with syntax highlighting,
using GitHub style syntax -  <code>```language</code>

    ```java
    public class User {
    //...
    ```

## Links
Avoid raw links such as: [https://guava.dev/releases/snapshot-jre/api/docs/com/google/common/base/Preconditions.html](https://guava.dev/releases/snapshot-jre/api/docs/com/google/common/base/Preconditions.html).

Instead, use meaningful names for links, such as: [Preconditions](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/base/Preconditions.html).

Avoid enigmatic names for links, such as: _see it [here](https://www.youtube.com/watch?v=TUHgGK-tImY)_.

When you mention some technology, library or project such as [Mockito](https://github.com/mockito/mockito), link it at least the first time when it appears in the text.

## Headers
If you use only one level of headers, use ### (h3).

If you want to distinguish between section headers and subsection headers,
use ## (h2) for section headers ### (h3) for subsection headers.

Never use # (h1) as it’s reserved for the title. Don’t repeat the title in the first header (Jekyll takes care of rendering the title of your post).

## How to test-render your post
Write your article in Markdown, save it to `_posts` folder.
If this is your first post, prepare your Bio (see above for details).

If you're Mac user and you haven't installed Ruby yourself, then you could perform following steps:
* `brew install ruby`
* add `export PATH="/usr/local/opt/ruby/bin:$PATH"` into your `.bashrc`/`.zshrc`


Install needed gems:

```bash
make install
`````

Launch the site using [Jekyll](https://help.github.com/articles/using-jekyll-with-pages),

```bash
make serve
````

Is your article rendered correctly?

Check if there are any obvious errors by running the linter:

```bash
make lint
```

You can also run linter with `-f` parameter against specific file (or files), eg:

```bash
./lint.sh -f _posts/2020-01-01-file-to-check.md -f _posts/2020-01-02-another-file-to-check.md
```


Create a Pull Request and get some feedback.

## Typography

### Don’t confuse hyphens and dashes
In English, we use hyphens (-) for hyphenation and phrases like *4-10 points*, *so-so*.

For separating two parts of a sentence we always use **em dash** character (—).

For example:
*I pay the bills — she has all the fun*

For keyboard shortcuts, refer to the table below or just copy-paste
a special character from this page.

### Straight and curly quotes
In good typography, straight quotes should be **avoided.**.

Instead of using straight single quote (') and the straight double quote ("), use curly quotes:

* opening single quote (‘),
* closing single quote (’),
* opening double quote (“),
* and closing double quote (”).

Why? Compare:

<font size="5">
"That's a 'magic' sock."</font>	// wrong <br/>
<font size="5">
“That’s a ‘magic’ sock.”</font> //right


Most **frequently you will use the closing single quote** (’) for contractions such as: don’t, it’s.

### Special characters: keyboard shortcuts
<table >
    <tr>
        <th>char</th>
        <th>name</th>
        <th>Windows</th>
        <th>Mac</th>
        <th>Linux</th>
        <th>HTML</th>
    </tr>
    <tr>
        <td>—</td>
        <td>em dash</td>
        <td>alt 0151</td>
        <td>Alt + Shift + hyphen</td>
        <td>Compose, -, -, -</td>
        <td>&amp;mdash;<br/></td>
    </tr>
    <tr>
        <td>‘</td>
        <td>opening single quote</td>
        <td>alt 0145</td>
        <td>Alt + ]</td>
        <td>Compose, ', &lt;</td>
        <td>&amp;lsquo;</td>
    </tr>
    <tr>
        <td>’</td>
        <td>closing single quote</td>
        <td>alt 0146</td>
        <td>Alt + Shift + ]</td>
        <td>Compose, ', &gt;</td>
        <td>&amp;rsquo;</td>
    </tr>
    <tr>
        <td>“</td>
        <td>opening double quote</td>
        <td>alt 0147</td>
        <td>Alt + [</td>
        <td>RightAlt + v</td>
        <td>&amp;ldquo;</td>
    </tr>
    <tr>
        <td>”</td>
        <td>closing double quote</td>
        <td>alt 0148</td>
        <td>Alt + Shift + [</td>
        <td>RightAlt + b</td>
        <td>&amp;rdquo;</td>
    </tr>
</table>

source: [practicaltypography.com](https://practicaltypography.com)

You can visit [fsymbols](http://fsymbols.com/keyboard/linux/compose/) for information about configuring and using Compose key on Linux.
On Windows, you can install [WinCompose](http://wincompose.info/) to get similar functionality.
You can also [enter any Unicode character based on its hex code](http://fsymbols.com/keyboard/linux/unicode/).

## Avoiding image optimization
By default, a github action (defined in `.github/workflows/calibreapp-image-actions.yml`) optimizes all images added
to the PR. Sometimes it overdoes its job: in particular, it may break animated WebP files by removing the animation
and keeping only the first frame. You can avoid this by giving your branch a name that ends with `-no-img-opt`:
such a name will prevent the action from running.
