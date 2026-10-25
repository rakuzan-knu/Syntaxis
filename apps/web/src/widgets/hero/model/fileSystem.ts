import type { Language } from '@/shared/lib';

export const HERO_PATH = 'src/widgets/hero/Hero.tsx';

export interface FileNode {
  kind: 'file';
  name: string;
  path: string;
}

export interface FolderNode {
  kind: 'folder';
  name: string;
  path: string;
  children: readonly TreeNode[];
}

export type TreeNode = FileNode | FolderNode;

export interface HeroState {
  headline: string;
  cta: string;
  accent: string;
}

function file(path: string): FileNode {
  return { kind: 'file', name: path.split('/').at(-1) ?? path, path };
}

function folder(path: string, children: readonly TreeNode[]): FolderNode {
  return { kind: 'folder', name: path.split('/').at(-1) ?? path, path, children };
}

export const ROOT: FolderNode = {
  kind: 'folder',
  name: 'zerno-coffee',
  path: '',
  children: [
    folder('.vscode', [file('.vscode/settings.json')]),
    folder('public', [file('public/robots.txt')]),
    folder('src', [
      folder('src/app', [file('src/app/App.tsx')]),
      folder('src/entities', [
        folder('src/entities/demo-store', [
          file('src/entities/demo-store/DemoStore.tsx'),
          file('src/entities/demo-store/index.ts'),
        ]),
      ]),
      folder('src/shared', [
        folder('src/shared/i18n', [file('src/shared/i18n/uk.ts')]),
        folder('src/shared/ui', [file('src/shared/ui/Button.tsx'), file('src/shared/ui/index.ts')]),
      ]),
      folder('src/widgets', [
        folder('src/widgets/hero', [file(HERO_PATH), file('src/widgets/hero/index.ts')]),
      ]),
      file('src/main.tsx'),
    ]),
    file('.gitignore'),
    file('index.html'),
    file('package.json'),
    file('tsconfig.json'),
    file('vite.config.ts'),
  ],
};

const STATIC_SOURCES: Record<string, string> = {
  '.vscode/settings.json': `{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}`,
  'public/robots.txt': `User-agent: *
Allow: /
Sitemap: https://zerno.preview.example/sitemap.xml`,
  'src/app/App.tsx': `import { Hero } from '@/widgets/hero';
import { Catalog } from '@/widgets/catalog';

export function App() {
  return (
    <main>
      <Hero />
      <Catalog />
    </main>
  );
}`,
  'src/entities/demo-store/DemoStore.tsx': `import { useState } from 'react';
import type { Product } from './types';

export function DemoStore({ products }: { products: Product[] }) {
  const [cart, setCart] = useState(0);
  return (
    <ul>
      {products.map((product) => (
        <li key={product.sku}>
          {product.name} — {product.price} ₴
          <button onClick={() => setCart(cart + 1)}>Add</button>
        </li>
      ))}
    </ul>
  );
}`,
  'src/entities/demo-store/index.ts': `export { DemoStore } from './DemoStore';`,
  'src/shared/i18n/uk.ts': `export const uk = {
  hero: {
    sub: 'Свіже зерно зі Львова з доставкою Новою поштою за один день.',
  },
  cart: { add: 'У кошик' },
} as const;`,
  'src/shared/ui/Button.tsx': `import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
}

export function Button({ color, ...props }: ButtonProps) {
  return (
    <button
      className="rounded-full px-4 py-2 text-white"
      style={{ backgroundColor: color }}
      {...props}
    />
  );
}`,
  'src/shared/ui/index.ts': `export { Button } from './Button';`,
  'src/widgets/hero/index.ts': `export { Hero } from './Hero';`,
  'src/main.tsx': `import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { App } from '@/app/App';
import './styles.css';

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <App />
  </StrictMode>,
);`,
  '.gitignore': `node_modules
dist
.env
.vercel`,
  'index.html': `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <title>Зерно — кава, обсмажена цього тижня</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  'package.json': `{
  "name": "zerno-coffee",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}`,
  'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
});`,
};

export function heroSource({ headline, cta, accent }: HeroState): string {
  return [
    "import { Button } from '@/shared/ui';",
    "import { useTranslation } from '@/shared/i18n';",
    `const accent = '${accent}';`,
    '',
    'export function Hero() {',
    '  const { t } = useTranslation();',
    '  return (',
    `    <h1>${headline}</h1>`,
    "    <p>{t('hero.sub')}</p>",
    '    <Button color={accent}>',
    `      ${cta}`,
    '    </Button>',
    '  );',
    '}',
  ].join('\n');
}

export function sourcesFor(hero: HeroState): Record<string, string> {
  return { ...STATIC_SOURCES, [HERO_PATH]: heroSource(hero) };
}

export function findNode(path: string, node: TreeNode = ROOT): TreeNode | null {
  if (node.path === path) return node;
  if (node.kind === 'folder') {
    for (const child of node.children) {
      const found = findNode(path, child);
      if (found) return found;
    }
  }
  return null;
}

export function parentPath(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

export function ancestors(path: string): string[] {
  const result: string[] = [];
  let current = parentPath(path);
  while (current) {
    result.unshift(current);
    current = parentPath(current);
  }
  return result;
}

export function childrenOf(path: string): readonly TreeNode[] {
  const node = findNode(path);
  return node?.kind === 'folder' ? node.children : [];
}

export function allFolders(node: TreeNode = ROOT): string[] {
  if (node.kind === 'file') return [];
  return [node.path, ...node.children.flatMap((child) => allFolders(child))].filter(Boolean);
}

export function languageOf(path: string): Language {
  if (path.endsWith('.json')) return 'json';
  if (/\.(tsx?|html)$/.test(path)) return 'tsx';
  return 'bash';
}

export type FileBadge = { label: string; tone: 'ts' | 'json' | 'html' | 'plain' };

export function badgeOf(name: string): FileBadge {
  if (name.endsWith('.tsx')) return { label: 'TSX', tone: 'ts' };
  if (name.endsWith('.ts')) return { label: 'TS', tone: 'ts' };
  if (name.endsWith('.json')) return { label: '{}', tone: 'json' };
  if (name.endsWith('.html')) return { label: '<>', tone: 'html' };
  return { label: '≡', tone: 'plain' };
}

export interface SearchMatch {
  line: number;
  text: string;
  start: number;
}

export interface SearchResult {
  path: string;
  matches: SearchMatch[];
}

export function searchFiles(query: string, sources: Record<string, string>): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const results: SearchResult[] = [];
  for (const [path, source] of Object.entries(sources)) {
    const matches: SearchMatch[] = [];
    source.split('\n').forEach((text, index) => {
      const start = text.toLowerCase().indexOf(needle);
      if (start !== -1) matches.push({ line: index + 1, text, start });
    });
    if (matches.length > 0) results.push({ path, matches });
  }
  return results;
}
