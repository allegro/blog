Create a script which prepares a blog post for publication.

- Use Python to write the script.
- The input blog post should be a command-line argument.
- Wne renaming files or performing other such actions, use git to reflect the changes in the repository. For example, use
    `git mv old-filename new-filename` to rename a file.
- Get today's date and remember it in yyyy-MM-dd format (year-month-day). This will further be referred to as "current date". Always use this format for dates.
- The blog post's filename starts with a date in yyyy-MM-dd format. Rename the file, replacing this date with the current date (unless it is already the
  current date).
- If a directory in `assets/img/articles/` contains a subdirectory whose name matches `yyyy-MM-dd-title` (where `yyyy-MM-dd` is some date and
  `title` is the slug from the blog post's filename), rename the directory by replacing yyyy-MM-dd with the current date (unless it is alread ythe current
  date).
- If the blog post (now possibly renamed to the new name) contains any images and their links point to `/assets/img/articles/yyyy-MM-dd-title`, replace
  `yyyy-MM-dd` with the current date in all such links. Do this for Markdown images and links as well as images and links written in plain HTML.
