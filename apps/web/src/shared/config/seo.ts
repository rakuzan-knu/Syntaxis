import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from '@/shared/i18n';
import { getDictionary, getLegal } from '@/shared/i18n/server';
import { pagePath, type LegalSlug } from './legal';
import { BRAND, SITE_URL, TELEGRAM_URL } from './site';

export interface PrerenderRoute {
  path: string;
  locale: Locale;
  file: string;
  indexable: boolean;
  slug?: LegalSlug;
}

export interface HeadAssets {
  fonts: readonly string[];
  dictionaries: Readonly<Partial<Record<Locale, string>>>;
  legal: Readonly<Partial<Record<Locale, string>>>;
}

interface PageMeta {
  title: string;
  description: string;
}

const OG_IMAGES: Record<Locale, string> = { uk: '/og.png', en: '/og-en.png' };

const SECURITY_TXT_EXPIRES = '2027-10-25T00:00:00.000Z';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function jsonLd(data: unknown): string {
  const json = JSON.stringify(data).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function absolute(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function structuredData(locale: Locale): unknown[] {
  const t = getDictionary(locale);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND,
      url: absolute(localePath(locale)),
      description: t.meta.description,
      image: `${SITE_URL}${OG_IMAGES[locale]}`,
      logo: `${SITE_URL}/icon-512.png`,
      areaServed: [{ '@type': 'Country', name: 'Ukraine' }, 'Worldwide'],
      availableLanguage: ['uk', 'en'],
      sameAs: [TELEGRAM_URL],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        url: TELEGRAM_URL,
        availableLanguage: ['Ukrainian', 'English'],
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: t.services.title,
        itemListElement: t.services.items.map((item) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: item.title, description: item.summary },
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: BRAND,
      url: `${SITE_URL}/`,
      inLanguage: locale,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: t.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];
}

function legalStructuredData(locale: Locale, slug: LegalSlug): unknown[] {
  const t = getDictionary(locale);
  const document = getLegal(locale)[slug];
  const url = absolute(pagePath(locale, slug));
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: document.title,
      description: document.description,
      url,
      inLanguage: locale,
      dateModified: document.updated,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: t.legal.home,
          item: absolute(localePath(locale)),
        },
        { '@type': 'ListItem', position: 2, name: t.legal.titles[slug], item: url },
      ],
    },
  ];
}

function pageMeta(route: PrerenderRoute): PageMeta {
  const t = getDictionary(route.locale);
  if (!route.indexable) {
    return { title: `${t.notFound.title} — ${BRAND}`, description: t.meta.description };
  }
  if (route.slug) {
    const document = getLegal(route.locale)[route.slug];
    return { title: `${document.title} — ${BRAND}`, description: document.description };
  }
  return { title: t.meta.title, description: t.meta.description };
}

function alternateLinks(slug?: LegalSlug): string[] {
  return [
    ...LOCALES.map(
      (locale) =>
        `<link rel="alternate" hreflang="${locale}" href="${absolute(pagePath(locale, slug))}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${absolute(pagePath(DEFAULT_LOCALE, slug))}" />`,
  ];
}

export function buildHead(route: PrerenderRoute, assets: HeadAssets): string {
  const t = getDictionary(route.locale);
  const { title, description } = pageMeta(route);
  const canonical = absolute(route.path);
  const tags: string[] = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    ...assets.fonts.map(
      (href) => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`,
    ),
  ];
  const dictionary = assets.dictionaries[route.locale];
  if (dictionary) tags.push(`<link rel="modulepreload" crossorigin href="${dictionary}" />`);
  const legal = route.slug ? assets.legal[route.locale] : undefined;
  if (legal) tags.push(`<link rel="modulepreload" crossorigin href="${legal}" />`);

  if (!route.indexable) {
    tags.push('<meta name="robots" content="noindex" />');
    return tags.join('\n    ');
  }

  const otherLocales = LOCALES.filter((locale) => locale !== route.locale);

  tags.push(
    `<link rel="canonical" href="${canonical}" />`,
    ...alternateLinks(route.slug),
    `<meta property="og:type" content="${route.slug ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:locale" content="${t.meta.ogLocale}" />`,
    ...otherLocales.map(
      (locale) =>
        `<meta property="og:locale:alternate" content="${getDictionary(locale).meta.ogLocale}" />`,
    ),
    `<meta property="og:image" content="${SITE_URL}${OG_IMAGES[route.locale]}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(t.meta.ogImageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}${OG_IMAGES[route.locale]}" />`,
  );

  if (route.slug) {
    tags.push(
      `<meta property="article:modified_time" content="${getLegal(route.locale)[route.slug].updated}" />`,
      ...legalStructuredData(route.locale, route.slug).map(jsonLd),
    );
  } else {
    tags.push(...structuredData(route.locale).map(jsonLd));
  }

  return tags.join('\n    ');
}

export function buildSitemap(routes: readonly PrerenderRoute[], lastModified: string): string {
  const entries = routes
    .filter((route) => route.indexable)
    .map((route) => {
      const alternates = alternateLinks(route.slug)
        .map((link) => `    ${link.replace('<link', '<xhtml:link')}`)
        .join('\n');
      const modified = route.slug ? getLegal(route.locale)[route.slug].updated : lastModified;
      return `  <url>\n    <loc>${absolute(route.path)}</loc>\n    <lastmod>${modified}</lastmod>\n${alternates}\n  </url>`;
    })
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildRobots(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

export function buildSecurityTxt(): string {
  return [
    `Contact: ${TELEGRAM_URL}`,
    `Expires: ${SECURITY_TXT_EXPIRES}`,
    'Preferred-Languages: uk, en',
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${absolute(pagePath('en', 'security'))}`,
    '',
  ].join('\n');
}
