import { localePath, type Locale } from '@/shared/i18n';

export const LEGAL_SLUGS = [
  'terms',
  'privacy',
  'cookies',
  'accessibility',
  'legal',
  'security',
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function legalPath(locale: Locale, slug: LegalSlug): string {
  const root = localePath(locale);
  return root === '/' ? `/${slug}` : `${root}/${slug}`;
}

export function pagePath(locale: Locale, slug?: LegalSlug): string {
  return slug ? legalPath(locale, slug) : localePath(locale);
}
