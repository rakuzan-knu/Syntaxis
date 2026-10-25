# ADR 001: Feature-Sliced Design with build-time prerendering

## Status

Accepted

## Context

The site is a marketing page whose job is to be found, load instantly and convert to a Telegram
conversation. It has to match the architecture of the founders' other project, Eternal (Vite,
React, Feature-Sliced Design, strict TypeScript, pnpm + Nx).

## Decision

- Keep Eternal's FSD layers, path alias `@/*`, ESLint boundary rules, commit conventions and tooling.
- Do not add a `packages/` directory. The workspace has a single app in `apps/web`.
- Render every route to static HTML at build time with `react-dom/server`, using a separate SSR
  entry. No server runtime is needed in production.

## Consequences

- Full HTML, metadata and structured data are available to crawlers and link previews.
- First paint does not wait for JavaScript, and Vercel serves plain static files.
- Adding a route means adding it to `PRERENDER_ROUTES` and `resolveRoute`.
