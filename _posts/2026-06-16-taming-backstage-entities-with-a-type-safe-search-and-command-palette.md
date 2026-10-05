---
layout: post
title: "Finding the Needle: Taming 150,000+ Backstage Entities with a Type-Safe Search and Command Palette"
author: jordan.andrzejczak
tags: [ tech, frontend, backstage, search, command palette, type-safe, react, typescript ]
excerpt: >
  This article describes how Allegro built “Commander,” a keyboard-first
  ⌘+K command palette designed to instantly search and manage over 150,000
  entities within Allegro’s developer portal, built on Spotify’s Backstage framework. It highlights the
  tool’s underlying stack-based mini-router architecture, which combines
  advanced TypeScript and Zod for zero-boilerplate type safety alongside
  client-side caching for instant performance.
---

<figure>
<img alt="Commander catalog search view" src="/assets/img/articles/2026-06-16-taming-backstage-entities-with-a-type-safe-search-and-command-palette/catalog-main-page.png" />
<figcaption>
Commander catalog search view
</figcaption>
</figure>

At [Allegro](https://allegro.tech), one of the largest e-commerce platforms
in Europe, our engineering ecosystem is massive. With thousands of
microservices, jobs, sprawling infrastructure, and endless documentation, simply
finding the right service or executing a routine action can quickly become a
frustrating task.

To handle this complexity, we migrated from our internal solution to
[Backstage](https://backstage.io/), Spotify’s open-source framework for building
developer portals. While the adoption wasn’t without its challenges, we found
quick wins in its plugin architecture, software catalog, and scaffolder.
However, one major piece of the puzzle remained unsolved:
**discoverability and search.**

When dealing with hundreds of thousands of entities, a general table view
simply isn’t enough. We tried to rely on Backstage’s built-in search, but it
proved to be clunky, slow, and plagued by false positives results. In a truly unified
developer portal, everyday tasks should feel seamless. Instead, a developer who
wanted to find a service, inspect its API, and ask the AI assistant a question
had to suffer through frustrating context-switches, network requests, and
endless clicks. Poor search experience makes it harder to access all those powerful
aggregations in one place.

To solve this, we built **Commander**. It began as a small side project, but
quickly evolved into a highly powerful `⌘+K` command palette, a keyboard-first
overlay sitting above the entire portal. It gives developers a single,
composable interface to search the catalog instantly, trigger deployments, and
manage tools without ever leaving the page. Read on as we dive into how it came
to be.

In this article, we focus on the architecture and advanced design patterns
that will be a great starting point for anyone looking to build a similar tool.

## Objectives

We designed **Commander** with three critical goals in mind:
- **Quick and Performant:** Because developers will open it constantly,
  navigating between screens, functions, and actions has to feel seamless and fast.
- **Context-Aware and Scalable:** The UI needed to handle growing complexity
  gracefully. A stack-based page architecture was a must, but as pages are
  pushed on top of one another, they also need the ability to share context
  seamlessly.
- **Type-Safe and Easy to Adopt:** We wanted a low barrier to entry for
  internal contributors, ensuring that any team could easily plug in and build
  their own custom features.

## Mounting Point

Under the hood, **Commander** is implemented as a pure frontend Backstage
web-library plugin; there is no backend counterpart. It can be triggered
instantly as a modal dialog via `⌘+K` / `Ctrl+K`, or accessed through a
dedicated search field in the sidebar navigation.

At its core, the tool functions as a stack-based mini-router. Every
interaction: running a search, selecting a result, starting a deployment, or
opening the AI chat either executes a specific function or pushes a new “page”
onto the stack. Hitting `Backspace` in an empty input field simply pops the
user back to the previous page. The result is a fluid experience that feels
less like navigating distinct pages and much more like one continuous flow.

## The Architecture

### A Stack-Based Page Router

The foundational design decision was treating the command palette as a router rather than a big switch statement over UI states.

Early in the design we considered the naive approach: one component with switch
cases rendering different content based on a current `PageType` enum. This
breaks down fast once you have more than a handful of types and try to pass
context between them.

Instead, **Commander** uses a **page stack** — an ordered array of page objects,
each with a `type` string and optional typed `data` payload. The page currently
shown is always the top element of the stack. Pushing a page navigates forward;
popping navigates back.

```ts
// Pages on the stack look close to this at runtime:
[
	{
		"type": "home",
		"data": undefined,
	},
	{
		"type": "search",
		"data": "documentation"
	}
]
```

This maps cleanly to the user mental model of “going into” a flow and pressing `Backspace` to go back.

### Configuration System

Every page is declared as a static `PageDefinition` record in a configuration
file. Adding a new page to **Commander** requires zero changes to the router,
context, or shell, only a new config entry.

```ts
const MyFeaturePage = createLazyComponent(() => import('./MyFeaturePage'));

export const pagesConfiguration = createPagesConfig({
	myFeature: {
		label: 'My Feature',
		placeholder: 'Search...',
		condition: (pages) => !!pages.findLast(p => p.type === 'myFeature'),
		render: MyFeaturePage,
		schema: z.enum(['foo', 'bar']),
	},
	// Other pages...
});
```

The key fields:
- **`label`** — the rendered name of the page,
- **`placeholder`** — dynamically changing placeholder value in the input field,
- **`condition`** — a function (or static boolean) evaluated against the
  current stack. The page renders when its condition is true. This is how
  **Commander** decides what to show without any imperative routing logic,
- **`schema`** — a [zod](https://zod.dev/) schema for the typed `data` payload the page accepts.
  Defining a schema is what causes `page.myFeature.push(data)` to be type-safe
  end-to-end,
- **`implicit`** — marks a page (like `home` or `noResults`) that has no
  push/get/set/delete utilities. TypeScript enforces this through a discriminated
  union: `schema` and `implicit: true` cannot coexist.

### Type-Safe Page Utilities

The most interesting engineering challenge was deriving fully type-safe page
utilities directly from the configuration object at compile time: no manual
type declarations, no type-unsafe string-keyed maps.

The whole system rests on three TypeScript techniques working together:
**conditional types**, **mapped types**, and **zod schema inference**.

#### Discriminated union on `PageDefinition`

In our implementation, `Pages.ts` is the module that defines Commander’s core
page-related types. At the core is a single type constraint that defines which
pages carry typed payloads and which remain implicit:

```ts
export type PageDefinition<TData = unknown> = {
	label: string;
	placeholder: string;
	icon?: ComponentType;
	condition: boolean | ((pages: BasePageData[], ctx: PagesConditionContext) => boolean);
	render: ComponentType;
	implicit?: boolean;
} & (
	| { schema: z.ZodType<TData>; implicit?: false } // has data -> has push/get/set/delete
	| { schema?: never; implicit?: true } // implicit -> no utilities
);
```

This is a TypeScript discriminated union on the intersection. If you write
`implicit: true`, TypeScript disallows `schema` and `push/get/set/delete`
utilities. It’s especially useful for pages like `home` or `noResults` that
should not be allowed as “pushable” pages. If you write
`schema: z.object(...)`, `implicit` must be `false` or absent. This single type
definition is the entire enforcement mechanism, there’s no runtime guard.

#### Extracting the data type from the zod schema

The key helper is `DataFromSchema`:

```ts
export type DataFromSchema<T> = T extends { schema: infer S }
	? S extends z.ZodType<infer D>
		? D
		: never
	: undefined;
```

This uses two levels of conditional type inference:
1. If `T` has a `schema` field, infer its type as `S`.
2. If `S` is a `z.ZodType<D>`, extract `D` — which is the TypeScript type zod will produce at runtime.
3. Otherwise fall back to `undefined` (the implicit/no-schema case).

The distinction between `never` and `undefined` here is important. `undefined`
means a valid, intentional state: this page has no schema, so its `data` is
explicitly “no payload” (for example, `home`). `never`, on the other hand,
signals an impossible or invalid type path: TypeScript found a `schema` field,
but it is not a `z.ZodType`, so no payload type can be derived. In practice,
`never` acts like a compile-time red flag, while `undefined` models a real
runtime value.

This is why you never manually write
`type SearchData = { type: 'documentation'|'services'|'users', entity: ... }`. You write
the zod schema once and the TypeScript type is derived from it automatically.

#### Page stack type is derived from config

`ConfigToPageStack` turns the entire config object into a discriminated union of what a page object on the stack can look like:

```ts
export type ConfigToPageStack<T extends PagesConfigurationRecord> = {
	[K in keyof T]: Omit<T[K], 'schema' | 'condition'> & {
		type: K;
		data: DataFromSchema<T[K]>;
		searchTerm?: string;
	};
}[keyof T][];
```

It maps over every key `K` in the config, producing a variant that:
- strips `schema` and `condition` (those are config-time concepts, not runtime page objects)
- adds `type: K` (a string literal, not just `string`)
- adds `data: DataFromSchema<T[K]>` — typed data for that specific page type

Then `[keyof T][]` collapses the mapped object into a **discriminated union array**. The result is that `pagesStack` is typed as something like:

```ts
(
	| { type: 'home'; data: undefined }
	| { type: 'search'; data: { type: 'documentation'|'services'|'users' } }
	| { type: 'prompt'; data: string }
	| ...
)[]
```

#### Utilities type — `PageUtils` and `UtilsByType`

The utilities are action methods for manipulating the page stack: `push` adds a new page onto the stack, `get` retrieves the current page state from the stack, `set` updates the data of the most recent page on the stack, and `delete` removes the topmost page variant from the stack.

`PageUtils` is the conditional type that decides whether a page gets `push/get/set/delete` utilities or only base properties:

```ts
export type PageUtils<T extends PageDefinition, K extends PropertyKey = PropertyKey> =
	T extends { implicit: true }
		? PageUtilsBase<T, K>
		: PageUtilsWithActions<T, K>;
```

`PageUtilsWithActions` is the interface that includes the action methods, with argument types pulled from `DataFromSchema<T>`:

```ts
export interface PageUtilsWithActions<T extends PageDefinition, K extends PropertyKey> extends PageUtilsBase<T, K> {
	get: () => PageUtilsBase<T, K> | undefined;
	push: (data?: DataFromSchema<T>) => void;
	set: (data?: DataFromSchema<T>) => void;
	delete: () => void;
}
```

And finally `UtilsByType` maps every config key to its specific `PageUtils` variant:

```ts
export type UtilsByType<T extends PagesConfigurationRecord> = {
	[P in keyof T]: PageUtils<T[P], P>;
};
```

So when you write `page.search.push(data)`, TypeScript knows:
- `search` is a key of the config
- `T['search']` has `schema: z.enum(['documentation', 'services', 'users'])`
- `DataFromSchema<T['search']>` resolves to `'documentation'|'services'|'users'`
- Therefore `push` expects exactly that shape, and nothing else

Finally, the set of page-related types looks something like this:

```ts
import { type ComponentType, type Dispatch, type SetStateAction } from 'react';
import type z from 'zod';

// ---------------------------------------------------------------------------
// Configuration — shapes used when defining pages in config slices
// ---------------------------------------------------------------------------

export type PagesConditionContext = {
  term: string;
};

export type PageDefinition<TData = unknown> = {
  label: string;
  placeholder: string;
  icon?: ComponentType;
  condition: boolean | ((pages: BasePageData[], ctx: PagesConditionContext) => boolean);
  render: ComponentType;
  implicit?: boolean;
  chipLabel?: (data: TData) => string;
  chipIcon?: (data: TData) => ComponentType | undefined;
  chipColor?: (data: TData) => string;
  clearTermOnSelect?: boolean;
} & ({ schema: z.ZodType<TData>; implicit?: false } | { schema?: never; implicit?: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PagesConfigurationRecord = Record<string, PageDefinition<any>>;

// ---------------------------------------------------------------------------
// Derived data helpers
// ---------------------------------------------------------------------------

export type DataFromSchema<T> = T extends { schema: infer S }
  ? S extends z.ZodType<infer D>
    ? D
    : never
  : undefined;

// ---------------------------------------------------------------------------
// Runtime page shapes — what lives on the page stack at runtime
// ---------------------------------------------------------------------------

export type BasePageData = {
  type: string;
  label: string;
  placeholder: string;
  icon?: ComponentType;
};

export type ConfigToPageStack<T extends PagesConfigurationRecord> = {
  [K in keyof T]: Omit<T[K], 'schema' | 'condition'> & {
    type: K;
    data: DataFromSchema<T[K]>;
    searchTerm?: string;
  };
}[keyof T][];

export type Page<T extends PagesConfigurationRecord> = ConfigToPageStack<T>[number];

// ---------------------------------------------------------------------------
// Component shape — config entry with resolved `type` key, used for rendering
// ---------------------------------------------------------------------------

export type PagesComponentsForConfig<T extends PagesConfigurationRecord> = {
  [K in keyof T]: T[K] & { type: K };
}[keyof T];

// ---------------------------------------------------------------------------
// Page utilities — per-page action objects returned by usePages
// ---------------------------------------------------------------------------

export type PageUtilsBase<T extends PageDefinition, K extends PropertyKey = PropertyKey> = Pick<
  T,
  'implicit' | 'render' | 'icon' | 'label' | 'placeholder' | 'clearTermOnSelect'
> & {
  type: K;
  data: DataFromSchema<T>;
  chipLabel?: (data: DataFromSchema<T>) => string;
  chipIcon?: (data: DataFromSchema<T>) => ComponentType | undefined;
  chipColor?: (data: DataFromSchema<T>) => string;
};

export interface PageUtilsWithActions<
  T extends PageDefinition,
  K extends PropertyKey = PropertyKey,
> extends PageUtilsBase<T, K> {
  get: () => PageUtilsBase<T, K> | undefined;
  push: (data?: DataFromSchema<T>) => void;
  set: (data?: DataFromSchema<T>) => void;
  delete: () => void;
}

export type PageUtils<T extends PageDefinition, K extends PropertyKey = PropertyKey> = T extends {
  implicit: true;
}
  ? PageUtilsBase<T, K>
  : PageUtilsWithActions<T, K>;

export type UtilsByType<T extends PagesConfigurationRecord> = {
  [P in keyof T]: PageUtils<T[P], P>;
};

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

/**
 * Return type of `usePages`.
 */
export type UsePagesResult<T extends PagesConfigurationRecord> = {
  pagesComponents: PagesComponentsForConfig<T>[];
  page: UtilsByType<T>;
  setPagesStack: Dispatch<SetStateAction<ConfigToPageStack<T>>>;
  pagesStack: ConfigToPageStack<T>;
  popPage: () => Page<T> | undefined;
  pageType: { [K in keyof T]: K };
};

/**
 * Derives all commander runtime types from a pages configuration object.
 */
export type InferCommanderTypes<T extends PagesConfigurationRecord> = {
  page: Page<T>;
  utils: UtilsByType<T>;
  stack: Page<T>[];
  component: PagesComponentsForConfig<T>;
  keys: keyof T;
  types: { [K in keyof T]: K };
};
```

### From types to runtime: `usePages` hook

The `usePages` hook signature uses `const T` — a TypeScript 5.0 feature that
infers the most specific (literal) type from the config argument rather than
widening it. This modifier is crucial, without it, TypeScript would widen string
literals in the config to `string`, losing all the discriminated-union
behaviour. With it, `type: 'search'` stays as the string literal `'search'`
throughout the type system:

```ts
export function usePages<const T extends PagesConfigurationRecord>(config: T, currentSearchTerm?: string, ...): {
	page: UtilsByType<T>;
	pagesStack: ConfigToPageStack<T>;
	pagesComponents: PagesComponentsForConfig<T>[]
	// ...
{
  const page = useMemo(() => { ... })
  const pagesStack = useMemo(() => { ... })
  const pagesComponents = useMemo(() => { ... })

  return {
    page,
    pagesStack,
    pagesComponents
  }
}
```

The logic of `usePages` hook uses a set of functions that build returned utilities. At **runtime**, `createPageUtils` builds the actual utility object per page
type. The logic is simple: it checks `def.implicit` and either returns only
base properties or adds `push/get/set/delete` closures. TypeScript trusts the
return type assertion (`as PageUtils<T[K], K>`) because the type system has
already verified the shape through the conditional types above.

```ts
function createPageUtils<K extends keyof T>(type: K, def: T[K]): PageUtils<T[K], K> {
	// Utils should be updated if the page was added to the stack
	const existingPage = getPage(type);

	const base = { type, label: def.label, data: existingPage?.data, ... };

	if (def.implicit) {
		return base as PageUtils<T[K], K>; // implicit: only base
	}

	return {
		...base,
		push: createPush(type, def),
		set: createSet(type, def),
		get: () => existingPage,
		delete: () => removePage(type),
	} as PageUtils<T[K], K>; // non-implicit: full utils
}
```

Then each entry from the configuration is reduced into a type-safe `page`
utility:

```ts
const entries = (Object.entries(config) as [keyof T, T[keyof T]][]).map(
	([type, def]) => [type, createPageUtils(type, def)] as const
);

return Object.fromEntries(entries) as UtilsByType<T>;
```

All together, the page utility looks like this:

```ts
export function usePages<const T extends PagesConfigurationRecord>(config: T, currentSearchTerm?: string, ...) {
  /**
   * Main state for the current page stack
   */
  const [pagesStack, setPagesStack] = useState<ConfigToPageStack<T>>([]);

  const getPage = useCallback(
    <P extends PageType>(type: P): Page<T> | undefined => {
	  // Get the first page from the stack
      return pagesStack.findLast((p) => p.type === type) as Page<T> | undefined;
    },
    [pagesStack]
  );

  const pushPage = useCallback(
    (newPage: Page<T>): void => {
      setPagesStack((p) => [...p, newPage]);
    },
    [setPagesStack]
  );

  const removePage = useCallback(
    (type: PageType): void => {
      setPagesStack((p) => p.filter((page) => page.type !== type));
    },
    [setPagesStack]
  );

  /**
   * Strips `schema` and `condition` from a definition and builds a page
   * object ready to push onto the stack.
   */
  const buildPage = useCallback(
    <P extends PageType>(type: P, definition: T[P], data: DataFromSchema<T[P]>): Page<T> => {
    // Destructure schema and condition as they are only required for typing
      const {
        schema: _schema,
        condition: _condition,
        ...rest
      } = definition as T[P] & {
        schema: unknown;
        condition: unknown;
      };
      return { type, ...rest, data, searchTerm: searchTermRef.current } as Page<T>;
    },
    []
  );

  const page = useMemo(() => {
	const createSet =
      <P extends PageType>(type: P, definition: T[P]) =>
      (data: DataFromSchema<T[P]>): void => {
        if (getPage(type)) {
          setPagesStack((p) =>
            p.map((_page) => (_page.type === type ? { ..._page, data } : _page))
          );
        }
      };

    const createPush =
      <P extends PageType>(type: P, definition: T[P]) =>
      (data: DataFromSchema<T[P]>): void => {
        if (getPage(type)) return;
        pushPage(buildPage(type, definition, data));
      };

    function createPageUtils<K extends keyof T>(type: K, def: T[K]): PageUtils<T[K], K> {
      const pageFromStack = getPage(type);

      const base = {
        type,
        label: def.label,
        placeholder: def.placeholder,
        render: def.render,
        data: pageFromStack?.data,
      };

      if (def.implicit) {
        return base as PageUtils<T[K], K>;
      }

      return {
        ...base,
        push: createPush(type, def),
        set: createSet(type, def),
        get: () => pageFromStack,
        delete: () => removePage(type),
      } as PageUtils<T[K], K>;
    }

    const entries = (Object.entries(config) as [keyof T, T[keyof T]][]).map(
      ([type, def]) => [type, createPageUtils(type, def)] as const
    );

    return Object.fromEntries(entries) as UtilsByType<T>;
  }, [config, getPage, pushPage, removePage]);

// ...
}
```


The same hook returns a memoized map of matched Components ready to be rendered in React

```ts
function evaluateCondition<T extends PagesConfigurationRecord>(
  condition: T[keyof T]['condition'],
  pages: BasePageData[],
  ctx: PagesConditionContext
): boolean {
  return typeof condition === 'function' ? condition(pages, ctx) : condition;
}

const pagesComponents = useMemo(
    () =>
      (Object.entries(config) as [keyof T, T[keyof T]][])
        .map(([type, def]) => {
          return {
            type,
            ...def,
          } as PagesComponentsForConfig<T>;
        })
        .filter((p) =>
          evaluateCondition(
            p.condition,
            pagesStack.map((page) => ({
              type: page.type as string,
              label: page.label,
              placeholder: page?.placeholder ?? '',
              icon: page.icon,
            })),
            { term: currentSearchTerm ?? '' }
          )
        ),
    [config, currentSearchTerm, pagesStack]
  );
```

### Application Layer — `useCommander` and `CommanderContext`

`usePages` is a generic, configuration-driven hook. It only knows about a
config object and a search term. It could be used to manage any page stack in
any context. That is intentional: it is the reusable primitive.

`CommanderContext` is the application-level layer above it. Its job is to bind
`usePages` to the specific configuration constant, own all the state that is
genuinely global across the entire **Commander UI**, and distribute it down the
tree through a single context value.

That includes:
- **Dialog state**: open/setOpen, so any component in the tree can open or close the overlay without prop-drilling,
- **Search term**: term/setTerm, persisted to sessionStorage so reopening **Commander** restores your last query,
- **Entity context**: the Backstage entity the user was viewing when **Commander** was opened, passed optionally into pages like AI that can use it,
- **Undo history**: a capped array of previous stack snapshots, managed by an
  effect that diffs pagesStack on every change and skips recording when an undo
  itself triggered the change,
- **Selected value** — the currently highlighted cmdk item, exposed both as
  state (for components that need to react to it) and as a ref-backed
  getSelectedValue getter (for components that only need to read it
  imperatively without subscribing)

All this combined gives us an amazing intellisense support in `useCommander` hook:

<figure>
<img alt="Type-safe page utilities IntelliSense" src="/assets/img/articles/2026-06-16-taming-backstage-entities-with-a-type-safe-search-and-command-palette/intellisense.png" />
<figcaption>
Type-safe page utilities IntelliSense
</figcaption>
</figure>

### Presentation Layer

With a rigorously type-safe foundation and a context established, we needed a
way to translate our page stack into a physical UI. Everything starts from the
page renderer.

As mentioned earlier, `usePages` delivers an array of `pagesComponents` based
on the current stack and configuration conditions. We can build a simple
component that serves as the entry point, iterating over these components and
rendering them:

```tsx
import { useMemo, type ReactNode } from 'react';
import { useCommander } from '../context';

export const PagesStack = () => {
  const { pagesComponents } = useCommander();

  const renderedPages: ReactNode[] = useMemo(
    () =>
      pagesComponents.map((page) => {
        const Component = page.render;
        return <Component key={page.type} />;
      }),
    [pagesComponents]
  );

  return <>{renderedPages}</>;
};
```

To keep **Commander** blazing fast, each page is a lazy-loaded component. It is
only pulled into memory when a user actually tries to access that specific
flow. We utilize `<Suspense/>` to render a fallback loading state during the
initial import, and `memo` to ensure that if a user revisits a page during the
same session, it serves instantly from cache.

```tsx
const withSuspense =
  (Component: React.ComponentType): React.ComponentType =>
  () => (
    <Suspense fallback={<LoadingComponent />}>
      <Component />
    </Suspense>
  );

export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType }>
): React.ComponentType => memo(withSuspense(lazy(importFn)));
```

This helper is used in the [Configuration System](#configuration-system)
section, where pages are declared with lazy-loaded render components.

To achieve the native command palette feel, we adopted `cmdk`, a fast,
accessible, headless command menu library built on Radix UI primitives. It
handles the core keyboard navigation and filtering seamlessly.

However, we didn't just drop `cmdk` in raw. We built our own wrapper components around its generic `Items` to inject our specific ecosystem requirements:
- **Permissions:** Wrapped with Backstage’s `PermissionApi` to hide actions users aren’t authorized to perform,
- **Analytics:** Integrated Google Analytics event tracking on item selection,
- **Routing:** A simple `to` property for items that just need to redirect the user, rather than trigger complex logic,
- **Async Loading:** Suspending items while background permission checks or API calls resolve,

At implementation level, this is handled by a custom `Item` wrapper around
`Command.Item` that centralizes selection behavior in one place: closing the
dialog when needed, handling internal/external navigation, and reporting
analytics.

```tsx
const Item = (props: ItemProps) => {
  const navigate = useNavigate();
  const { handleAnalyticsAction, setOpen } = useCommander();
  const { onSelect, closeOnSelect, disableAnalytics, to, ...commandItemProps } = props;

  const handleSelect = useCallback(
    (value: string) => {
      // 1) Optionally close the Commander dialog window
      // 2) Route internally or open an external URL
      // 3) Trigger item-specific callback
      // 4) Send analytics event
    },
    [closeOnSelect, disableAnalytics, handleAnalyticsAction, navigate, onSelect, setOpen, to]
  );

  // Permission/loading wrappers are applied around this primitive in our UI layer.
  return <Command.Item {...commandItemProps} onSelect={handleSelect} />;
};
```

The final piece is connecting the `cmdk` shell to our `PagesStack`. We simply wrap our stack in the `cmdk` dialog variant:

```tsx
import { Command } from 'cmdk';
import { CmndrPagesStack } from '../PagesStack';
import { matchScore } from '../../utils';

export const CommanderDialog = ({ children }: PropsWithChildren) => {
  return (
    <Command.Dialog
      label="Commander"
      filter={matchScore}
    >
      <Command.Input />
      <Command.List>{children}</Command.List>
    </Command.Dialog>
  );
};

export const Commander = () => {
  return (
    <CommanderDialog>
      <CmndrPagesStack />
    </CommanderDialog>
  );
};
```

#### Creating a Feature Component

To see how smoothly the typed state and the presentation layer work together,
let’s look at creating a feature. Assume we have defined our configuration with
two pages: **Home** and **Theme**.

In our `HomePage` component, we use the type-safe utilities exposed by `useCommander` to push a new page onto the stack:

```tsx
const HomePage = () => {
  const { page } = useCommander();

  return (
    <Group heading="Actions">
      <Item
        label="Change Theme"
        keywords={['theme', 'colors']}
        onSelect={() => page.theme.push()} // Type-safe: pushes the theme page onto the stack
      />
      {/* ...other items */}
    </Group>
  );
}

export default HomePage;
```

Executing `page.theme.push()` modifies the stack state. Our configuration
detects that `theme` is now the top page on the stack and renders it based on
this condition:


```tsx
  theme: {
    label: 'Change Theme',
    placeholder: 'Search themes...',
    condition: (pages) => !!pages.findLast(p => p.type === 'theme'),
    render: ThemePage,
  },
```

Inside the newly rendered `ThemePage`, we provide the options. Notice how we
use `page.theme.delete()` to pop the current page off the stack and return to
the home screen:


```tsx
const ThemePage = () => {
  const { page } = useCommander();

  const handleThemeChange = (t: Theme) => {
    // Apply theme logic...
  };

  return (
    <Group heading="Themes">
      <Item
        label="Light theme"
        value='light'
        keywords={['white', 'day mode']}
        onSelect={handleThemeChange}
      />
      <Item
        label="Dark Theme"
        keywords={['dark', 'night mode']}
        value='dark'
        onSelect={handleThemeChange}
      />
      <Item
        label="Go back"
        onSelect={() => page.theme.delete()} // Type-safe: removes this page from the stack
      />
    </Group>
  );
}

export default ThemePage;
```

It is really as easy as that. `Command.Input` automatically handles the filtering, sorting, and reordering of items within a `Group` as the user types.

For more complex, multistep flows like triggering a deployment or querying
specific logs, we can pass payloads directly into the push action (e.g.,
`page.deployment.push({ serviceId: 'auth-api', version: '1.0.0', ... })`). Because of our rigorous
TypeScript configuration, the subsequent page inherits this typed state,
allowing it to render parameterized data entirely safely.

<figure>
<img alt="Commander catalog search in action" src="/assets/img/articles/2026-06-16-taming-backstage-entities-with-a-type-safe-search-and-command-palette/catalog-search.png" />
<figcaption>
Commander catalog search in action
</figcaption>
</figure>

### Integrating the Backstage Software Catalog: Fast Searches at Scale

Having a robust, stack-based command palette is only half the battle. It
ultimately serves as the foundation for our most critical feature: searching
the Backstage Software Catalog.

When you have over 150,000 catalog entities, making API calls to
the catalog on every keystroke is a recipe for a slow UI. **Commander** needed
to feel instantaneous, like a native operating system search. To achieve this
offline-first, lightning-fast feel, we heavily decoupled our search UI from
live network requests.

Instead, we treat the Backstage Software Catalog as a massive, cacheable data source. We
used **[TanStack Query](https://tanstack.com/query/latest)** to manage caching
and data synchronization, but supercharged it with an
**[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
persistor**.

Here is how it works in practice:
- **Heavy Client-Side Caching:** When a user opens **Commander**, the initial catalog state is fetched and immediately persisted to the browser's IndexedDB,
- **Debounced Keystrokes:** As the user types their query, `cmdk` filters
  against this local, IndexedDB-backed cache first. If the query is not found
  in the database, **Commander** fetches new results in the background,
- **Background Syncing:** TanStack Query quietly revalidates and hydrates the
  catalog data in the background, updating the IndexedDB store without
  interrupting the user’s flow.

Because our custom router allows us to pass typed payloads between pages,
developers can seamlessly search the cached catalog on the `home` page, select
an entity, and push its ID into a specialized `service-details` or
`deployment` page. The result is a search experience that easily scales to
hundreds of thousands of entities while maintaining sub-millisecond response
times.

<figure>
<img alt="Entity overview page" src="/assets/img/articles/2026-06-16-taming-backstage-entities-with-a-type-safe-search-and-command-palette/deployment-preview.png" />
<figcaption>
  Entity overview page
</figcaption>
</figure>

## Summary

When dealing with a microservice architecture as vast as Allegro’s, a developer
portal is only useful if developers can actually find what they need and take
action effortlessly. Standard table views and clunky search bars were dragging
down our developer experience, forcing constant context switches and page
reloads.

By building **Commander**, we transformed discoverability into a highly
accessible, keyboard-first experience. By shifting our mindset from a simple
*search bar* to a **stack-based mini-router**, we enabled users to fluidly
navigate deep into specialized flows, whether it’s managing a deployment,
toggling themes, or prompting an AI assistant, all without ever leaving their
current page.

The true triumph of **Commander**, however, lies in its developer experience. By
leveraging advanced TypeScript techniques like discriminated unions and zod
schema inference, we created a purely configuration-driven, 100% type-safe
environment. Adding a new feature to the palette requires zero boilerplate
routing code. Teams simply define a schema, drop in a React component, and let
the types do the heavy lifting. The result is an incredibly fast, extensible
tool that has seamlessly unified how Allegro navigates its ecosystem.

While **Commander** is currently coupled with our internal Allegro
extensions, we wanted to share this architecture to inspire other teams facing
similar scalability challenges in Backstage.
