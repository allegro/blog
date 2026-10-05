Modify the script so that when it renames the image directory or updates image links, it matches the old
directory based only on the date portion regardless of the slug. Should multiple directories with the same
date part exist, only then use the slug to select the right one.

Ambiguous matches should terminate the script with an error message.
Do refactor the shared logic so it's in a single place in the code.
