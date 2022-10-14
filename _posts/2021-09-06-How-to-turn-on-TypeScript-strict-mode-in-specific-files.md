---
layout: post
title: How to turn on TypeScript strict mode in specific files
tags: [typescript, scrict mode, typescript plugin, code quality]
author: [kamil.krysiak, jaroslaw.glegola]
---

Imagine you have to migrate your JavaScript project to TypeScript. It’s fairly simple to convert one file from JS to TS, but if
you want to take type checking to the next level (going for TypeScript’s strict mode) it is not that easy. The only solution you
have is turning on strict mode for the whole project which may result in thousands of errors. For most projects that are not strict yet,
it would take quite a bit of time and effort to fix all the strict errors at once.

## Turning strict-mode on in development only?

You could think of turning on strict mode during development, catching strict errors that way, and then turning it off before
pushing your changes, but this approach has a few downsides.

1. You’ve got to remember to change `tsconfig.json` every time you make changes — without automation, this could get tedious.
2. It won’t work in your CI pipeline
3. It will show errors in files you don’t want to make strict yet

Ok, so what can we do to improve this workflow?

## Introducing typescript-strict-plugin

[typescript-strict-plugin](https://github.com/allegro/typescript-strict-plugin) eliminates all the above problems by allowing you to specify exactly what files you want to be strictly
checked. By default, the plugin will check all files with strict mode - that's step one.
Now every member of your team will have strict errors shown to them in the editor of their choosing (yes, this plugin works with
webstorm, vscode, vim, and more). But if you have any files that are not strict compliant
you can simply put a single comment at the top of the file and our plugin will make typescript not check it with strict mode.

If you are now thinking something like "Hmmm... does it mean that I will have to put this comment in every file is not TS strict compliant"?
The answer is yes - be we've automated it. Plugin package does export command line tool that adds this comment to every file with strict
mode errors!

Thanks to this approach every new file will be strictly checked out of the box - you don't need to do anything. On the other hand
if you want to change file to be strict you will just remove a comment on top of the file and that's it - file will be strictly checked.
Simple as that.

Unfortunately, typescript plugins do not work at compilation time, they work only in IDEs. Another nice feature that comes in the
package is a compile-time tool that allows you to connect the strict plugin to your CI pipeline, or a pre-commit hook. It checks
marked files with strict mode and prints to the console all strict errors found. If a single strict error is found, the tool
exits with an error, so you can be sure that all specified files are really strict (strict, strict, strict... ahh).

## How to use it?

### Install the `typescript-strict-plugin` package

with npm:

```bash
npm i -D typescript-strict-plugin
```

or yarn:

```bash
yarn add -D typescript-strict-plugin
```

### Add the plugin to your `tsconfig.json`

```json
{
  "compilerOptions": {
    //...
    "strict": false,
    "plugins": [
      {
        "name": "typescript-strict-plugin"
      }
    ]
  }
}
```

### Run script from the command line to update all files with comment

Before (every file is not strictly checked):

```typescript
const name: string = null; // TS2322: Type ‘null’ is not assignable to type ‘string’.
```

Run (this script will add comment to every file that has TS strict errors):

```bash
npx update-strict-comments
```


After:

```typescript
// @ts-strict-ignore
...
const name: string = null; // no error here
```

Now files that were already strict do not have this comment on top and those that need some work have.

You can also directly specify directories you want to be strict. In the following example, every file in `src` and `test`
directories will be strictly checked.

```json
{
  "compilerOptions": {
    //...
    "strict": false,
    "plugins": [
      {
        "name": "typescript-strict-plugin",
        "path": ["./src", "./test"]
      }
    ]
  }
}
```

### Add `tsc-strict` to your type checking package.json scripts

```json
// package.json
{
  "scripts": {
    "typecheck": "tsc && tsc-strict"
  }
}
```

Otherwise, the plugin will not work outside your IDE.

**Note:** `tsc-strict` script uses TypeScript’s `tsc` under the hood, so the full type checking time in this scenario would double.

## Conclusion

`typescript-strict-plugin` can improve your app’s reliability and type safety. And all that without any disadvantages except for
compilation time and a few comments.

If you’re interested in how this works under the hood, we are working on a separate post on making your own TS plugin, so stay
tuned!
