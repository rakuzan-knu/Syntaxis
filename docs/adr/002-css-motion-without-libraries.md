# ADR 002: CSS motion instead of an animation library and a router

## Status

Accepted

## Context

The first build used `framer-motion` and `react-router-dom`, as Eternal does. The client bundle was
134 KB gzip. Of that, the animation library accounted for about 94 KB minified and the router for
about 36 KB minified. The site promises clients PageSpeed 90+ on mobile, so its own page has to
meet the same bar.

## Decision

- Implement all motion with CSS: transitions, keyframes, `grid-template-rows` for disclosures and
  `animation-timeline: view()` for the scroll-linked process line.
- Use a small `useInView` hook on `IntersectionObserver` for draw-on-enter effects.
- Replace the router with `resolveRoute(path)`. Each locale is a separate prerendered file.

## Consequences

- The client bundle dropped to about 87 KB gzip, most of it `react-dom`.
- Browsers without scroll-driven animations show the process line fully drawn.
- If the site grows into many client-side routes, reconsider a router.
