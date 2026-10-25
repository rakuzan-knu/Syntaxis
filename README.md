# Syntaxis

Website of Syntaxis, a studio building custom websites and web applications.

Ukrainian at `/`, English at `/en`. Contact: [Telegram @gmblesssed](https://t.me/gmblesssed).

## Stack

- React 19, TypeScript (strict), Vite 8, Tailwind CSS 4
- Feature-Sliced Design, enforced by `eslint-plugin-boundaries`
- Build-time prerendering of every route to static HTML (SEO, instant first paint)
- pnpm workspace + Nx, Vitest, ESLint, Prettier, Husky, commitlint
- Deployed as static files on Vercel

## Getting started

```bash
pnpm install
pnpm dev
```

| Command          | What it does                                          |
| :--------------- | :---------------------------------------------------- |
| `pnpm dev`       | Dev server on http://localhost:5173                   |
| `pnpm build`     | Type-check, build, SSR-prerender `/`, `/en` and `404` |
| `pnpm preview`   | Serve the production build                            |
| `pnpm typecheck` | TypeScript project build                              |
| `pnpm lint`      | ESLint, including FSD layer boundaries                |
| `pnpm test`      | Vitest                                                |
| `pnpm validate`  | Everything above plus Prettier check                  |

## Repository layout

```
apps/web/
  index.html            HTML template with <!--app-head--> and <!--app-html--> slots
  scripts/prerender.ts  Renders every route to dist/*.html, writes sitemap.xml and robots.txt
  src/
    main.tsx            Client entry: hydrates prerendered HTML
    entry-server.tsx    Server entry used only by the prerender step
    app/                Routes, providers, global styles and design tokens
    pages/              home, not-found
    widgets/            Hero, interactive demo windows (design, api, deploy, security, performance, outstaff) and page sections
    features/           compose-brief, switch-locale
    entities/           service
    shared/             config (site, SEO), i18n (dictionaries), lib (highlight, useAutoplay), ui (Window, CodeBlock)
docs/                   Architecture notes and ADRs
```

## Editing content

All copy lives in two typed dictionaries:

- `apps/web/src/shared/i18n/dictionaries/uk.ts`
- `apps/web/src/shared/i18n/dictionaries/en.ts`

Both implement the `Dictionary` type, so a missing or extra field fails the type check. A test also
verifies that both locales have the same structure and the same brief options.

The Telegram handle and site URL are in `apps/web/src/shared/config/site.ts`.

## Deploying to Vercel

1. Import `rakuzan-knu/Syntaxis` in Vercel. Settings come from `vercel.json`.
2. Add environment variables:
   - `ENABLE_EXPERIMENTAL_COREPACK=1`, so Vercel uses the pnpm version pinned in `package.json`.
   - `VITE_SITE_URL=https://your-domain`, used for canonical URLs, hreflang, Open Graph and the
     sitemap. Defaults to `https://syntaxis-dev.vercel.app`.
3. Deploy. Security headers (CSP, HSTS, frame and permissions policies) and immutable caching for
   hashed assets are configured in `vercel.json`.

## Design

See [DESIGN.md](DESIGN.md).

## License

Proprietary. All rights reserved. See [LICENSE.md](LICENSE.md).
