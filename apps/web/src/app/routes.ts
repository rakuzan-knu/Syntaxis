import { LEGAL_SLUGS, legalPath, type LegalSlug } from '@/shared/config';
import type { PrerenderRoute } from '@/shared/config/seo';
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from '@/shared/i18n';

export const PRERENDER_ROUTES: readonly PrerenderRoute[] = [
  { path: '/', locale: 'uk', file: 'index.html', indexable: true },
  { path: '/en', locale: 'en', file: 'en.html', indexable: true },
  ...LOCALES.flatMap((locale) =>
    LEGAL_SLUGS.map((slug) => {
      const path = legalPath(locale, slug);
      return { path, locale, slug, file: `${path.slice(1)}.html`, indexable: true };
    }),
  ),
  { path: '/404', locale: 'uk', file: '404.html', indexable: false },
];

type ResolvedRoute =
  | { page: 'home'; locale: Locale }
  | { page: 'legal'; locale: Locale; slug: LegalSlug }
  | { page: 'not-found'; locale: Locale };

function normalize(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function resolveRoute(path: string): ResolvedRoute {
  const normalized = normalize(path);
  for (const locale of LOCALES) {
    if (localePath(locale) === normalized) return { page: 'home', locale };
    const slug = LEGAL_SLUGS.find((item) => legalPath(locale, item) === normalized);
    if (slug) return { page: 'legal', locale, slug };
  }
  return { page: 'not-found', locale: DEFAULT_LOCALE };
}

function canonicalPath(path: string): string {
  const route = resolveRoute(path);
  if (route.page === 'home') return localePath(route.locale);
  if (route.page === 'legal') return legalPath(route.locale, route.slug);
  return '/404';
}

export function isSameRoute(a: string, b: string): boolean {
  return canonicalPath(a) === canonicalPath(b);
}
