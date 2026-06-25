# PathRouter

A small, type-safe routing layer built on top of `react-router-dom` that adds:

- A **declarative config** for pages and modals (`setPage` / `setModal`).
- A **factory** (`createPathRouter`) that binds your config to fully-typed router pieces — no manual generics on every call site.
- A **single React context** exposing the current page, the current modal and the search params, with imperative helpers (`navigate`, `open`, `close`, `set`, `change`, `delete`, `clear`).
- **URL-driven modals**: a modal is represented as a segment after `/modal/` inside the path, so it survives reloads, deep links and back/forward navigation.
- An optional **`ModalWrapper`** plugin (e.g. an animated popup) that can intercept the close action via a forwarded ref.

---

## File layout

```text
PathRouter/
├── index.ts                 # Public API (factory + builders + types)
├── createPathRouter.tsx     # The factory itself
├── types.ts                 # All public types
├── Container/
│   ├── RouterContainer.tsx  # Renders <Routes> for pages + <ModalsContainer>
│   ├── ModalsContainer.tsx  # Renders the currently open modal
│   └── index.ts
├── Provider/
│   ├── PathProvider.tsx     # BrowserRouter + PathContext provider
│   ├── context.ts           # React context object
│   ├── usePath.ts           # Internal hook (factory wraps it for users)
│   └── index.ts
├── NavLink/
│   ├── NavLink.tsx          # Internal NavLink (factory wraps it for users)
│   └── index.ts
└── utils/
    ├── setters.ts           # setPage / setModal helpers
    ├── createRoute.ts       # Flattens the nested page config
    ├── clearSlash.ts        # Path normalization
    ├── parseSearch.ts       # Search-params merge helper
    └── index.ts
```

---

## Quick start

```ts
// src/config/route.ts
import { setPage, setModal } from "@/modules/PathRouter";
import { HomePage, AddPage, NotFoundPage } from "@/Pages";
import { TestModal } from "@/Modals/Test";

export const route = {
  pages: {
    home:  setPage({ component: HomePage }),
    add:   setPage({ component: AddPage }),
    "*":   setPage({ component: NotFoundPage }),
  },
  modals: {
    test: setModal({ component: TestModal }),
  },
} as const;
```

```ts
// src/containers/Router/PathProvider.tsx
import { route } from "@/config";
import { createPathRouter } from "@/modules/PathRouter";

export const {
  PathProvider,
  PagesContainer,
  usePath,
  NavLink,
  getPath,
  getModal,
} = createPathRouter(route);
```

```tsx
// somewhere near the root
import { PathProvider, PagesContainer } from "@/containers/Router";

<PathProvider>
  <PagesContainer fallback={<Spinner />} />
</PathProvider>;
```

```tsx
// any component
import { usePath, NavLink } from "@/containers/Router";

const Foo = () => {
  const { page, modal } = usePath();   // no <typeof config> generic needed!
  page.navigate("add");                 // ✓ autocompleted
  modal.open("test");                   // ✓ autocompleted
  return <NavLink to="home" modal="test">Open</NavLink>;
};
```

---

## How it works

### 1. Configuration via `setPage` / `setModal`

The config is a plain object with two sections — `pages` and `modals`:

```ts
import { setPage, setModal } from "@/modules/PathRouter";

export const route = {
  pages: {
    "/":   setPage({ component: HomePage }),
    add:   setPage({ component: AddItemPage }),
    users: {
      "/":   setPage({ component: UsersListPage }),
      ":id": setPage({ component: UserPage }),
    },
    modules: {
      ...setPage({ component: ModulesIndexPage }), // page at /modules
      routing: setPage({ component: RoutingPage }), // page at /modules/routing
      "*":     setPage({ component: RoutingPage }), // page at /modules/*
    },
    "*":   setPage({ component: NotFoundPage }),
  },
  modals: {
    test:    setModal({ component: TestModal }),
    confirm: setModal({ component: ConfirmModal }),
  },
} as const;
```

- `setPage` accepts two forms:
  - **Shorthand**: `setPage(MyComponent)` — equivalent to `setPage({ component: MyComponent })`.
  - **Full**: `setPage({ component?, redirect?, ...customKeys })` — use when you need `redirect` or extra metadata fields (e.g. a `title` for a sitemap).
  
  Both forms wrap the value as `{ data: {...} }`. The `data` field marks the node as a renderable page but **does not stop** the route builder from descending — children of the same node are still discovered.
- Pages can be **nested** as plain objects — `parseRouteConfig` walks the tree and produces a flat `[{ pathName, data }]` list (see `utils/createRoute.ts`).
- A node may **simultaneously be a page and a container** for child routes. Spread the result of `setPage` into the node to attach a component at that path while keeping nested keys:

  ```ts
  modules: {
    ...setPage(ModulesIndexPage),             // /modules
    routing: setPage(RoutingPage),            // /modules/routing
    "*":     setPage({ redirect: "modules" }), // /modules/* → redirect
  }
  ```

  This is what enables breadcrumb-style hierarchies where each ancestor segment is itself a page.
- Recursion into a node stops only when the node itself carries `component` or `redirect` at its top level (i.e. it is a bare leaf, not a `setPage(...)` result). `setPage` puts those fields under `data`, so spreading it never blocks descent.
- A page with `redirect` (or no `component`) becomes a `<Navigate to={redirect || "/"} replace />`.
- `setModal` also accepts two forms — `setModal(MyModal)` or `setModal({ component, ...customKeys })`. Unlike `setPage`, modals are stored flat (no `{ data }` wrapper).
- `as const` is **required** — without it TS widens string keys to `string` and you lose autocompletion.

### 2. The `createPathRouter` factory

`createPathRouter(route)` captures your config once and returns everything pre-bound:

```ts
const {
  PathProvider,    // BrowserRouter + context
  PagesContainer,  // renders pages + modals (config injected)
  usePath,         // typed hook  — no <typeof config> needed
  NavLink,         // typed link  — no <typeof config> needed
  getPath,         // identity helper: <P extends PathNamesOf<C>>(p: P) => p
  getModal,        // identity helper: <M extends ModalNamesOf<C>>(m: M) => m
  config,          // the original config, re-exported
} = createPathRouter(route);
```

Why re-exports rather than direct imports?

- TypeScript cannot infer generics from a literal `typeof route` _unless_ you pass it explicitly each time. The factory passes it once for you.
- Every consumer of the returned API gets autocompletion of routes / modal names with **zero ceremony**.
- The package itself stays generic and reusable; the binding lives in your app code.

> `PathProvider`, `PagesContainer`, `usePath`, `NavLink`, `getPath`, `getModal` are **not re-exported** from `@/modules/PathRouter`. The only way to obtain them is via `createPathRouter(config)`.

### 3. Mounting

```tsx
import { PathProvider, PagesContainer } from "@/containers/Router";

<PathProvider>
  <PagesContainer
    ModalWrapper={MyModalWrapper}   // optional
    fallback={<Spinner />}          // optional Suspense fallback
  />
</PathProvider>;
```

- `PathProvider` mounts a `BrowserRouter` and an inner provider that derives the page path, the modal state and the search params from `useLocation()` (`Provider/PathProvider.tsx`). It does **not** depend on the config — the factory re-exports it as-is.
- `PagesContainer` renders the pages inside `<Suspense>` and, if a modal is open, mounts `ModalsContainer` next to the page tree. `config` is already injected by the factory — you only pass `ModalWrapper` / `fallback`.

### 4. URL shape

A URL is split on the literal **`/modal/`** separator:

```text
/users/42/modal/confirm/extra-crumb?tab=info
└── page path ──┘     └─ modal ──┘
```

In `PathProvider`:

```ts
const [rawPagePath, modalPath] = location.pathname.split("/modal/");
const segments = (modalPath || "").split("/").filter(Boolean);
const name        = segments[0];       // "confirm"
const breadCrumbs = segments.slice(1); // ["extra-crumb"]
```

So:

- `page.path` always points to the page route the user is on, regardless of whether a modal is open.
- `modal.name` is the first segment after `/modal/`.
- `modal.breadCrumbs` are additional path segments that the modal can use for its own internal navigation/steps.
- `modal.isOpen` is `true` iff `modal.name` is set.

This means modals are **bookmarkable and shareable** out of the box and the browser back button closes the modal naturally.

### 5. The `usePath` hook (from the factory)

```ts
import { usePath } from "@/containers/Router";

const { page, modal, searchParams } = usePath();   // already typed!

page.path;                 // current page pathname (no /modal/... suffix)
page.navigate("add");      // ✓ typed against config.pages
page.isHavePrevHistory;    // true if history.key !== "default"

modal.isOpen;
modal.name;                // current modal key
modal.breadCrumbs;         // string[] after the modal name
modal.path;                // "<name>/<crumb1>/<crumb2>"
modal.open("confirm", ["step-2"]); // ✓ typed against config.modals
modal.close();

searchParams.params;       // Record<string, string[]>
searchParams.change({ tab: "info" });           // merge (string=set, string[]=append)
searchParams.set({ tab: ["a", "b"] });          // replace per-key
searchParams.delete("tab");
searchParams.clear();
```

### 6. `getPath` / `getModal` — typed identity helpers

When you need a typed path or modal-name literal somewhere outside JSX (e.g. inside a side-effect, a redux thunk, a `redirect` field of another page), use the identity helpers returned by the factory:

```ts
import { getPath, getModal } from "@/containers/Router";

const target = getPath("home");      // type: "home"
const which  = getModal("test");     // type: "test"

// Compile-time error: argument is not assignable to PathNamesOf<typeof route>
const bad = getPath("does-not-exist");
```

These replace the previous `export type PathNames = NestedKeyOf<typeof routes, "data">` pattern that is impossible to express from inside an isolated package.

If you really need the type itself (e.g. as a function parameter), it is still available via `typeof getPath`:

```ts
type PathNames = Parameters<typeof getPath>[0];
type ModalNames = Parameters<typeof getModal>[0];
```

…or use the package-level generics with an explicit config:

```ts
import type { PathNamesOf, ModalNamesOf } from "@/modules/PathRouter";
import type { route } from "@/config";

type PathNames  = PathNamesOf<typeof route>;
type ModalNames = ModalNamesOf<typeof route>;
```

### 7. `NavLink` (from the factory)

```tsx
import { NavLink } from "@/containers/Router";

<NavLink to="home">Home</NavLink>
<NavLink modal="test">Open test modal</NavLink>
<NavLink to="users" modal="confirm" modalBreadCrumbs={["step-2"]}>
  Users + confirm at step 2
</NavLink>
```

- Renders a real `<a href>` (right-click / “open in new tab” / SSR work as expected).
- Intercepts the primary-button click and routes through `page.navigate(...)`.
- Adds `aria-current="page"` and `data-active` when active; you can override the active class via `activeClassName`.

### 8. Page rendering (`RouterContainer.tsx`)

- Calls `parseRouteConfig(config)` once (memoised) to flatten the page tree.
- Renders a single `<Routes>` switch with one `<Route>` per leaf.
- If a leaf has no `component` or has a `redirect`, the element becomes `<Navigate to={redirect || "/"} replace />`.
- The whole switch is wrapped in `<Suspense fallback={fallback}>` so lazy components work transparently.
- Modals are rendered as a **sibling** of `<Routes>`, only when `modal.isOpen` — they overlay the current page rather than replacing it.

### 9. Modal rendering (`ModalsContainer.tsx`)

- Builds a virtual location `"<pagePath>/<modalName>"` (normalized via `clearSlash`) and feeds it to a dedicated `<Routes location={routesLocation}>`. This is what makes the modal aware of the current page path.
- Each modal route is registered at `"<pagePath>/<modalName>"`, so modals can be **page-scoped** if needed.
- If the URL contains a modal name that does not exist in the config (no matching component), the container calls `modal.close()` automatically — broken/stale modal links self-heal.
- If a `ModalWrapper` is provided, it is rendered with `{ modalName, isOpen, onClose, children }` and a forwarded ref. When the user triggers close, the container prefers `ref.current.handleCloseWithAnimation()` (so the wrapper can run an exit animation), and only falls back to the raw `close()` if that method is not exposed.

The `ModalWrapper` contract:

```ts
interface ModalWrapperRef {
  handleCloseWithAnimation: () => void;
}

interface ModalWrapperProps {
  modalName?: string;
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

type ModalWrapperComponent = ForwardRefExoticComponent<
  ModalWrapperProps & RefAttributes<ModalWrapperRef>
>;
```

Modal components themselves receive `ModalProps` (`{ onClose: () => void }`):

```tsx
import type { FC } from "react";
import type { ModalProps } from "@/modules/PathRouter";

export const TestModal: FC<ModalProps> = ({ onClose }) => (
  <button onClick={onClose}>Close</button>
);
```

### 10. Path normalization (`clearSlash`)

All internal `navigate(...)` calls go through `clearSlash`:

- collapses repeated slashes (`a//b` → `a/b`);
- guarantees a single leading slash;
- strips trailing slashes (root `/` stays as `/`).

This keeps the URL canonical regardless of how the caller composed it.

### 11. Search params

`PathProvider` derives `searchParams` from `location.search` and exposes four helpers:

| Method   | Behaviour                                                                 |
| -------- | ------------------------------------------------------------------------- |
| `change` | Merge: `string` value → set the key; `string[]` value → append values.    |
| `set`    | Replace each provided key: deletes existing values, then writes new ones. |
| `delete` | Removes a key entirely.                                                   |
| `clear`  | Removes every search param.                                               |

All mutations preserve `location.hash`.

---

## Public API of `@/modules/PathRouter`

The package exposes only what cannot depend on a concrete config:

### Builders / factory / utilities

- `setPage(Component | { component?, redirect?, ...custom })` — page descriptor builder.
- `setModal(Component | { component, ...custom })` — modal descriptor builder.
- `createPathRouter(config)` — returns `{ PathProvider, PagesContainer, usePath, NavLink, getPath, getModal, config }`.
- `parseRouteConfig(config)` — flattens the nested page tree into `{ pages, modals }` arrays; use for sitemaps or debug.
- `clearSlash(path)` — path normalizer (collapses `//`, ensures leading `/`, strips trailing `/`).

### Types — config-independent

- `RouterConfig`, `PageData`, `ModalData`
- `ModalProps` — props passed to a modal component.
- `ModalState`, `SearchParams`, `SearchParamsState`
- `ModalWrapperComponent`, `ModalWrapperProps`, `ModalWrapperRef`
- `BoundPathRouterContainerProps`, `BoundNavLinkProps<C>`, `PathRouter<C>`

### Types — config-dependent (must be parametrised)

- `PathNamesOf<C>` — must be used as `PathNamesOf<typeof route>`.
- `ModalNamesOf<C>` — must be used as `ModalNamesOf<typeof route>`.

> `PathProvider`, `PagesContainer`, `usePath`, `NavLink`, `getPath`, `getModal` are **deliberately not exported** from the package — obtain them from `createPathRouter(config)`.
> `PathContextType` is also not re-exported; the typed shape is available via the return type of the factory's `usePath`.

---

## Limitations

- **CSR only** — `PathProvider` uses `BrowserRouter`; no HashRouter, no SSR (Next.js / Remix).
- **`/modal/` is reserved** — page paths must not contain this segment; it is used as a URL splitter.
- **Flat modals, one at a time** — the `modals` config is a flat dict; nested or simultaneous modals are not supported. Use `modalBreadCrumbs` for intra-modal navigation.
- **No built-in animation** — modals appear/disappear instantly without a `ModalWrapper`.
- **TS recursion depth** — `PageEntries` is capped at 8 nesting levels; deeper trees compile but may lose path autocompletion.

---

## Minimal end-to-end example

```tsx
import { setPage, setModal, createPathRouter } from "@/modules/PathRouter";

const route = {
  pages: {
    "/":  setPage(HomePage),                  // shorthand
    add:  setPage(AddItemPage),
    "*":  setPage({ redirect: "/" }),          // redirect form
  },
  modals: {
    confirm: setModal(ConfirmModal),           // shorthand
  },
} as const;

export const {
  PathProvider,
  PagesContainer,
  usePath,
  NavLink,
  getPath,
  getModal,
} = createPathRouter(route);

export const App = () => (
  <PathProvider>
    <PagesContainer fallback={<Spinner />} />
  </PathProvider>
);

const SomeButton = () => {
  const { page, modal } = usePath();
  return (
    <button onClick={() => modal.open("confirm")}>
      Open confirm (current page stays: {page.path})
    </button>
  );
};
```
