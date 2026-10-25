# Frontend architecture

React 19 + TypeScript, built with Vite and organised by Feature-Sliced Design, following the
structure of the Eternal project.

## Layers

| Layer       | Contents                                            | May import                          |
| :---------- | :-------------------------------------------------- | :---------------------------------- |
| `app/`      | `App`, route resolution, `LocaleLayout`, global CSS | everything below                    |
| `pages/`    | `home`, `not-found`                                 | widgets, features, entities, shared |
| `widgets/`  | Page sections and interactive demo windows          | features, entities, shared          |
| `features/` | `compose-brief`, `switch-locale`                    | entities, shared                    |
| `entities/` | `service`                                           | shared                              |
| `shared/`   | `config`, `i18n`, `lib`, `ui` (Window, CodeBlock…)  | shared                              |

Rules, enforced by ESLint:

- `boundaries/dependencies` rejects imports that go up or sideways between slices.
- `no-restricted-imports` rejects deep imports. Every slice is consumed through its `index.ts`.

## Rendering

1. `vite build` produces the client bundle and `dist/index.html` with two slots.
2. `vite build --ssr src/entry-server.tsx` produces a Node bundle of the same React tree.
3. `scripts/prerender.ts` renders each route in `app/routes.ts`, fills the slots with markup and
   per-locale `<head>` tags (`shared/config/seo.ts`), marks the root with `data-route`, and writes
   `sitemap.xml` and `robots.txt`.
4. In the browser, `main.tsx` hydrates when the prerendered route matches the URL and renders from
   scratch otherwise.

Routing is a single `resolveRoute(path)` function. Each locale is its own HTML file, so switching
language is a normal link.

## State

There is no global store. Locale comes from the URL through `I18nProvider`. Interactive state
(demo windows, brief selection) is local component state. Window autoplay goes through
`useAutoplay`, which runs once in view and stops for good after the first interaction.

## i18n

`shared/i18n/types.ts` defines `Dictionary`; `uk.ts` and `en.ts` implement it. Content structures
(demo window copy, services, corrections, steps, brief options) are typed
there, so UI components never hold copy.
