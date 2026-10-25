import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

interface PrerenderRoute {
  path: string;
  locale: 'uk' | 'en';
  file: string;
  indexable: boolean;
  slug?: string;
}

type LocaleAssets = Readonly<Partial<Record<'uk' | 'en', string>>>;

interface HeadAssets {
  fonts: readonly string[];
  dictionaries: LocaleAssets;
  legal: LocaleAssets;
}

interface ServerEntry {
  render: (url: string) => Promise<string>;
  buildHead: (route: PrerenderRoute, assets: HeadAssets) => string;
  buildSitemap: (routes: readonly PrerenderRoute[], lastModified: string) => string;
  buildRobots: () => string;
  buildSecurityTxt: () => string;
  prerenderRoutes: readonly PrerenderRoute[];
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const PRELOADED_FONTS = [
  /geologica-latin-wght-normal-.*\.woff2$/,
  /geologica-cyrillic-wght-normal-.*\.woff2$/,
];

async function findFonts(): Promise<string[]> {
  const files = await readdir(path.join(distDir, 'assets'));
  return PRELOADED_FONTS.flatMap((pattern) =>
    files.filter((file) => pattern.test(file)).map((file) => `/assets/${file}`),
  );
}

async function findLocaleChunks(prefix: string): Promise<LocaleAssets> {
  const files = await readdir(path.join(distDir, 'assets'));
  const find = (locale: 'uk' | 'en') => {
    const file = files.find(
      (name) => name.startsWith(`${prefix}${locale}-`) && name.endsWith('.js'),
    );
    return file ? `/assets/${file}` : undefined;
  };
  const uk = find('uk');
  const en = find('en');
  return { ...(uk ? { uk } : {}), ...(en ? { en } : {}) };
}

async function main(): Promise<void> {
  const entry = (await import(
    pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
  )) as ServerEntry;
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
  const assets: HeadAssets = {
    fonts: await findFonts(),
    dictionaries: await findLocaleChunks(''),
    legal: await findLocaleChunks('legal-'),
  };

  for (const route of entry.prerenderRoutes) {
    const markup = await entry.render(route.path);
    const html = template
      .replace('<html lang="uk">', `<html lang="${route.locale}">`)
      .replace('<div id="root"><!--app-html-->', () => {
        return `<div id="root" data-route="${route.path}">${markup}`;
      })
      .replace('<!--app-head-->', () => entry.buildHead(route, assets));
    const target = path.join(distDir, route.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    console.log(`prerendered ${route.path} -> ${route.file}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    path.join(distDir, 'sitemap.xml'),
    entry.buildSitemap(entry.prerenderRoutes, today),
    'utf8',
  );
  await writeFile(path.join(distDir, 'robots.txt'), entry.buildRobots(), 'utf8');
  await mkdir(path.join(distDir, '.well-known'), { recursive: true });
  await writeFile(
    path.join(distDir, '.well-known', 'security.txt'),
    entry.buildSecurityTxt(),
    'utf8',
  );
  await rm(ssrDir, { recursive: true, force: true });
}

await main();
