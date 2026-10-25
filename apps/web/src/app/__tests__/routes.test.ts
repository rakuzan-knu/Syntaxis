import { describe, expect, it } from 'vitest';
import { LEGAL_SLUGS } from '@/shared/config';
import { PRERENDER_ROUTES, isSameRoute, resolveRoute } from '../routes';

describe('resolveRoute', () => {
  it('maps locale roots to the home page', () => {
    expect(resolveRoute('/')).toEqual({ page: 'home', locale: 'uk' });
    expect(resolveRoute('/en')).toEqual({ page: 'home', locale: 'en' });
    expect(resolveRoute('/en/')).toEqual({ page: 'home', locale: 'en' });
  });

  it('maps legal documents in every locale', () => {
    expect(resolveRoute('/privacy')).toEqual({ page: 'legal', locale: 'uk', slug: 'privacy' });
    expect(resolveRoute('/en/terms/')).toEqual({ page: 'legal', locale: 'en', slug: 'terms' });
  });

  it('maps everything else to the not-found page', () => {
    expect(resolveRoute('/pricing')).toEqual({ page: 'not-found', locale: 'uk' });
    expect(resolveRoute('/en/pricing')).toEqual({ page: 'not-found', locale: 'uk' });
    expect(resolveRoute('/uk/privacy')).toEqual({ page: 'not-found', locale: 'uk' });
  });

  it('treats any unknown paths as the prerendered 404 route', () => {
    expect(isSameRoute('/404', '/missing')).toBe(true);
    expect(isSameRoute('/', '/missing')).toBe(false);
    expect(isSameRoute('/', '/en')).toBe(false);
    expect(isSameRoute('/privacy', '/privacy/')).toBe(true);
    expect(isSameRoute('/privacy', '/en/privacy')).toBe(false);
  });
});

describe('PRERENDER_ROUTES', () => {
  it('prerenders every legal document in both locales', () => {
    const legal = PRERENDER_ROUTES.filter((route) => route.slug);
    expect(legal).toHaveLength(LEGAL_SLUGS.length * 2);
    expect(legal.map((route) => route.file)).toContain('en/cookies.html');
    expect(legal.map((route) => route.file)).toContain('cookies.html');
  });

  it('resolves each prerendered path back to its own route', () => {
    for (const route of PRERENDER_ROUTES.filter((item) => item.indexable)) {
      const resolved = resolveRoute(route.path);
      expect(resolved.locale).toBe(route.locale);
      expect(resolved.page).toBe(route.slug ? 'legal' : 'home');
    }
  });
});
