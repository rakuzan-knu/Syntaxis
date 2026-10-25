# ADR 003: Show the work in interactive windows

## Status

Accepted. Replaces the “syntactic parsing” visual concept.

## Context

The first design used school grammar notation as its visual system. It was distinctive but spoke
about language, not about building software. The founders wanted the page to demonstrate the
service directly, the way product sites let visitors try the product in the page.

## Decision

- Present every service as a working window: editor with live preview, design tokens, API console,
  CI/CD pipeline, security headers, Core Web Vitals, pull request, and a Telegram brief.
- Keep each window a widget slice with local state and a pure, tested `model/`.
- Share behaviour through `shared/ui/Window`, `CodeBlock`, `ScoreRing`, `Switch`, `Segmented` and
  the `useAutoplay` hook.
- Keep the performance budget: no animation, editor or charting libraries. Syntax highlighting is a
  small in-house tokenizer.

## Consequences

- Client JavaScript grew from about 87 KB to about 100 KB gzip, within the 120 KB budget.
  Lighthouse mobile stays at 94 performance and 100 for accessibility, best practices and SEO.
- Each window is server-rendered with its initial state, so the content is indexable.
- New services are added as another window widget plus copy in both dictionaries.
