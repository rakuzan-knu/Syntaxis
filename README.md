<img src="https://raw.githubusercontent.com/subvincdebian/subvincdebian/main/assets/repo-Syntaxis.svg" alt="Syntaxis project overview" width="100%" />

# Syntaxis

A bilingual web-studio website with interactive interface demos and a project brief composer. Ukrainian at `/`, English at `/en`.

[Website](https://syntaxis-pi.vercel.app) · [Frontend source](apps/web/src) · [Design](DESIGN.md) · [Architecture](docs/architecture/frontend.md)

## Highlights

- Responsive studio pages, service sections and localized content.
- Interactive demo windows, a command palette and a project brief composer.
- Typed English and Ukrainian dictionaries with matching structures.
- Build-time prerendering of application routes, including localized legal pages, with sitemap and metadata generation.

The storefront, API, payment and deployment widgets are local demonstrations. They illustrate interface behavior and do not establish production integrations or customer results.

**Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Feature-Sliced Design, pnpm workspaces and Nx. Vitest, ESLint and Prettier provide development checks.

## Run locally

Use **Node.js 24.11+** and **pnpm 12.4.2**, as specified in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Type-check, build and prerender the website |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | Check TypeScript projects |
| `pnpm lint` | Check code and architectural boundaries |
| `pnpm test` | Run Vitest |
| `pnpm validate` | Run type, lint, test and formatting checks |

## Source map

| Area | Source |
| --- | --- |
| Routes and providers | [apps/web/src/app](apps/web/src/app/) |
| Home and legal pages | [apps/web/src/pages](apps/web/src/pages/) |
| Brief composer | [features/compose-brief](apps/web/src/features/compose-brief/) |
| Command palette | [features/command-palette](apps/web/src/features/command-palette/) |
| Local demo state | [entities/demo-store](apps/web/src/entities/demo-store/) |
| Static rendering | [apps/web/scripts/prerender.ts](apps/web/scripts/prerender.ts) |

<details>
<summary>Content editing and deployment</summary>

Copy lives in typed [Ukrainian](apps/web/src/shared/i18n/dictionaries/uk.ts) and [English](apps/web/src/shared/i18n/dictionaries/en.ts) dictionaries. Contact details and the default site URL live in [site.ts](apps/web/src/shared/config/site.ts).

Vercel settings are in [vercel.json](vercel.json). Set `VITE_SITE_URL` to the deployment's canonical URL for metadata, language links and the sitemap. The source configuration currently defaults to `https://syntaxis-dev.vercel.app`.

The existing deployment notes use `ENABLE_EXPERIMENTAL_COREPACK=1` to select the pinned pnpm version. Review provider runtime support when configuring a new deployment.

</details>

## License

Proprietary. All rights reserved. See [LICENSE.md](LICENSE.md).
