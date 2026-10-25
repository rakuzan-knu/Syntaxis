# Syntaxis design language

## Idea

Show the work, don't describe it. Every service is presented as the tool an engineer actually uses,
rendered faithfully enough that a developer recognises it and interactive enough that a client can
try it: an IDE with a live preview, a design tool, an API client, a deployment dashboard, browser
DevTools, a Lighthouse report, a pull request and a Telegram chat.

Realism comes from the small details of working software: file trees, tab strips, status bars, git
gutter markers, terminal logs with real timestamps, response sizes, diff line numbers, check
durations. The windows sit on a “desktop” with a painted wallpaper and sometimes overlap, like apps
on a real screen.

Clarity for non-technical visitors comes from three layers on top: hint hotspots that point at the
first thing to try, an “Explain” mode with numbered callouts and a plain-language legend, and a
“What you get” line under every window.

## Windows

| Section     | Tool it reproduces         | What the visitor can do                                                                                                                                                                                                                                                                                                  |
| :---------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero        | IDE + browser window       | A working editor (activity bar, file tree, tabs, breadcrumbs, Problems/Output/Terminal panel, lint, commit flow) next to a real browser: tabs, editable address bar, back/forward/reload, new-tab page; the Zerno store has home, catalog, product options, cart, checkout with validation, order confirmation and a 404 |
| Design      | Design tool                | Two pages, layers with rename, hide and lock, hand tool and zoom, double-click text editing, a per-layer inspector, undo/redo, Prototype links with Present mode, Inspect with copyable CSS and a collaborator cursor during autoplay                                                                                    |
| API         | API client                 | Run four endpoints, switch Production/Staging, try “all good”, “out of stock” and “card declined”; a phone shows what the customer sees for every response                                                                                                                                                               |
| Deploy      | Deployment dashboard       | Redeploy or ship a broken commit (tests stop it, production stays on the old version), browse site versions and roll back instantly; the live preview follows production                                                                                                                                                 |
| Security    | Browser DevTools + scanner | Toggle security headers, switch Network/Console/Application/Security tabs and run four attacks against a visitor’s screen: blocked or not                                                                                                                                                                                |
| Performance | Lighthouse report          | Apply or revert optimisations, switch network and device, click a metric for a plain explanation, race the page before and after                                                                                                                                                                                         |
| Outstaff    | Pull request page          | Comment on a diff line or request changes; the engineer replies, pushes a fix and checks rerun; approve, merge and see deployment start                                                                                                                                                                                  |
| Brief       | Telegram chat              | Build the message in three steps, see a typing indicator and a sample reply, then open Telegram with the text (nothing is sent automatically)                                                                                                                                                                            |

Rules for windows:

- Built from `shared/ui/Window` (`tone="dark"` or `tone="light"`; tone swaps the `win-*` and
  `syn-*` variables, so every window component works in both).
- Business logic lives in pure, tested `model/` functions: `createOrder`, `respond`, `buildTimeline`,
  `consoleMessages`, `networkRows`, `gradeFor`, `computeMetrics`, `frameStage`, `diffStats`,
  `hmrLine`, `searchFiles`, `detectProblems`, `runCommand`, `composeBrief`, `highlight`, store
  routes and cart (`parseStorePath`, `addToCart`, `cartTotals`), browser history (`push`, `back`,
  `resolveAddress`), the design document (`updateNode`, `toggleHidden`, `rename`), undo history
  (`commit` with coalescing keys, `undo`, `redo`) and `cssFor`.
- Every showcase has a “In plain words” caption that narrates the last action without jargon, and a
  glossary row of tappable terms (`PlainCaption`, `Glossary` in `shared/ui`).
- Client guidance follows the task, not the tool: the store points to the next step (add to cart,
  open the cart, check out, place the order), the design tool to “select a layer” and “present”.
- Autoplay runs through `useAutoplay`: once per page view, only in view, and never after the visitor
  has touched the window. `prefers-reduced-motion` jumps to the final state.
- Tool chrome stays in English, as in the real tools. Everything a client must understand (hints,
  callouts, benefits, attack status) is localised.
- No third-party logos. Demo content is labelled; the coffee store “Zerno” is fictional.
- Floating secondary windows are overlays: they never push layout, so they cause no layout shift.

## Shared pieces

| Component   | Role                                                          |
| :---------- | :------------------------------------------------------------ |
| `Showcase`  | Section heading, Explain toggle, desktop, legend, benefit     |
| `Desktop`   | Wallpaper stage (sky, sun, three hills; light and night)      |
| `Hotspot`   | Pulsing hint with a label, hidden after the first interaction |
| `Callout`   | Numbered marker shown in Explain mode                         |
| `CodeBlock` | Highlighted code with line numbers, active line, git markers  |
| `ScoreRing` | Lighthouse-style gauge                                        |

## Tokens

Defined once in `apps/web/src/app/styles/index.css`, with a dark counterpart.

| Token                    | Light     | Dark      | Role                                  |
| :----------------------- | :-------- | :-------- | :------------------------------------ |
| `bg`                     | `#f2f3f6` | `#0b0d11` | Page                                  |
| `surface`                | `#ffffff` | `#12151b` | Cards and tables                      |
| `ink`                    | `#0e1116` | `#eceef3` | Text                                  |
| `muted`                  | `#5b6271` | `#9aa1b0` | Secondary text                        |
| `faint`                  | `#676e7c` | `#7d8494` | Tertiary text, meta (≥ 4.5:1)         |
| `line`                   | `#dde0e7` | `#232731` | Borders                               |
| `accent`                 | `#2f3bff` | `#7b84ff` | Actions, focus, highlights            |
| `win-*`                  |           |           | Window surfaces; light tone overrides |
| `syn-*`                  |           |           | Syntax colours; light tone overrides  |
| `sky-*`, `sun`, `hill-*` |           |           | Wallpaper, with a night palette       |

Typefaces: Geologica Variable for everything outside code, JetBrains Mono Variable inside code and
numeric readouts. Both are self-hosted with Latin and Cyrillic subsets.

## Motion

- Windows demonstrate once; everything else answers the visitor.
- Transitions use `--ease-out`; logs, rings, grades and metrics animate between real values.
- Sections below the fold use `content-visibility: auto` to keep the main thread light.

## Quality bar

Lighthouse mobile on the production build: Performance 84–88 (varies with machine load), Accessibility
100, Best Practices 100, SEO 100, CLS 0, in both themes. Client JavaScript about 143 KB gzip on first
load, including only the current language's dictionary (`loadDictionary`, preloaded per page by the
prerender; `getDictionary` in `shared/i18n/server` is for prerendering and tests only). IDE side
panels, store pages beyond home, Figma Prototype/Inspect panels and Present mode load on demand. No horizontal page scroll from 360 px up.
