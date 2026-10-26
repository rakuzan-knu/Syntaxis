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

| Section     | Tool it reproduces         | What the visitor can do                                                                                                                                                                                                                                                                                                                                                                                         |
| :---------- | :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero        | IDE + browser window       | VS Code-like editor: hover types, Ctrl+click to definition, context menu, Ctrl+F find and replace, Ctrl+P quick open, Tab inline completion (plain IntelliSense, no AI), terminal and commit flow. The browser has tabs, an address bar, history, F12 DevTools and a multi-page Zerno store with checkout and an AI shop assistant that asks about taste and brewing, recommends coffee and adds it to the cart |
| Design      | Design tool                | Two pages, layers (rename, hide, lock), hand tool and zoom, frame width handle with reflow, button states, color variables with a light/dark mode switch, comment pins with replies, per-layer inspector, undo/redo, Prototype with Present mode, Inspect with copyable CSS and real SVG export                                                                                                                 |
| API         | API client                 | Four endpoints, Production/Staging, scenarios (sold out, card declined, CRM down), Form or raw JSON body with real 400/422 validation, code snippets, a load test with autoscaling, an Integrations tab where a paid order fans out to CRM, Nova Poshta, Telegram and email with retries and backoff, and a phone showing what the customer sees                                                                |
| Deploy      | Deployment dashboard       | Deployments, Analytics, Logs and Settings tabs; redeploy, broken commit stopped by tests, branch preview with Promote, instant rollback, a gradual (canary) release with a live error chart and automatic rollback, build-log filter, runtime log search, masked environment variables                                                                                                                          |
| Security    | Browser DevTools + scanner | Security headers plus server protection; six attacks against a visitor’s screen; an attack log with attacker IPs, the guard that stopped each attack and owner alerts; OWASP Top 10 checklist and vulnerable dependencies with updates                                                                                                                                                                          |
| Performance | Lighthouse report          | Lighthouse report with optimisations, network and device; real Web Vitals of this page; before/after image slider; before/after page race; a CI guard where adding a heavy library fails the bundle budget and blocks the merge until it is replaced                                                                                                                                                            |
| Outstaff    | Pull request page          | A preview deployment of the branch that can be opened and used inside the PR; comment on a diff line or request changes; the engineer replies, pushes a fix and checks rerun; approve, merge and see deployment start; a weekly hours report tab                                                                                                                                                                |
| Brief       | Telegram chat              | Three-step message builder with a ballpark in weeks and “what you get” list, typing indicator and sample reply; opens Telegram with the text (nothing is sent automatically)                                                                                                                                                                                                                                    |

Rules for windows:

- Built from `shared/ui/Window` (`tone="dark"` or `tone="light"`; tone swaps the `win-*` and
  `syn-*` variables, so every window component works in both).
- Business logic lives in pure, tested `model/` functions: `createOrder`, `respond`, `buildTimeline`,
  `consoleMessages`, `networkRows`, `gradeFor`, `computeMetrics`, `frameStage`, `diffStats`,
  `hmrLine`, `searchFiles`, `detectProblems`, `runCommand`, `composeBrief`, `highlight`, store
  routes and cart (`parseStorePath`, `addToCart`, `cartTotals`), browser history (`push`, `back`,
  `resolveAddress`), the design document (`updateNode`, `toggleHidden`, `rename`), undo history
  (`commit` with coalescing keys, `undo`, `redo`), `cssFor`, color variables (`modeStyle`), the
  shop assistant (`readPreferences`, `recommend`), integrations (`fanOut`), canary releases
  (`canaryPoints`, `breachIndex`), the attack log (`recordIncident`) and the bundle budget
  (`checkBudget`).
- Every showcase has a “In plain words” caption that narrates the last action without jargon, and a
  glossary row of tappable terms (`PlainCaption`, `Glossary` in `shared/ui`).
- Client guidance follows the task, not the tool: the store points to the next step (add to cart,
  open the cart, check out, place the order), the design tool to “select a layer” and “present”.
- Autoplay runs through `useAutoplay` on a pausable timeline (`shared/lib/timeline.ts`). A guide
  cursor (“Syntaxis engineer”) moves to elements marked `data-guide` and presses real controls, so
  every demo step goes through the same handlers a visitor uses. `DemoPlayer` under each window
  offers play/pause, chapters and replay; the demo pauses out of view and hands control over on the
  first real click or key press, while processes it started (builds, requests) finish in real time.
  `prefers-reduced-motion` jumps to the final state.
- Desktop windows (`DesktopWindow`) can be dragged by their title bar, focused, minimised to a dock
  and shown alone with the green button; on touch screens and below 1024 px they stay static.
- `Ctrl+K` opens the command palette (`features/command-palette`): jump to a section or run any demo
  chapter via the command bus; `?` lists keyboard shortcuts.
- AI appears only as a feature built for the client’s business (the Zerno shop assistant), never as
  the tool that writes our code. The assistant is a scripted, tested model
  (`entities/demo-store/model/consultant.ts`) and is labelled as a demo.
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

Lighthouse mobile on the production build (local, pessimistic; PageSpeed Insights scores higher):
Performance 70–84 (varies run to run), Accessibility 100, Best Practices 100, SEO 100, CLS 0. Client JavaScript on first
load: about 93 KB gzip main bundle plus the current language's dictionary (`loadDictionary`, preloaded
per page). Demo sections hydrate on approach (`deferred`); IDE side panels, store pages beyond home,
Figma Prototype/Inspect and Present mode load on demand. The scroll tilt of desktops runs only from
1024 px, so tall windows on phones are never shown compressed. No horizontal page scroll from 360 px up.
