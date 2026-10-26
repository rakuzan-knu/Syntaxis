import { HERO_PATH } from './fileSystem';

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'const' | 'interface' | 'parameter';
  signature: string;
  doc: string;
  definition: { path: string; line: number } | null;
}

const BUTTON_PATH = 'src/shared/ui/Button.tsx';
const I18N_PATH = 'src/shared/i18n/uk.ts';

export function definitionLine(source: string, name: string): number {
  const lines = source.split('\n');
  const pattern = new RegExp(`\\b(function|const|interface|let)\\s+${name}\\b`);
  const index = lines.findIndex((line) => pattern.test(line));
  return index === -1 ? 1 : index + 1;
}

export function symbolsFor(sources: Readonly<Record<string, string>>, accent: string) {
  const at = (path: string, name: string) => ({
    path,
    line: definitionLine(sources[path] ?? '', name),
  });
  const table: Record<string, SymbolInfo> = {
    Button: {
      name: 'Button',
      kind: 'function',
      signature: 'function Button({ color, ...props }: ButtonProps): JSX.Element',
      doc: 'Design-system button. The fill comes from the brand accent token.',
      definition: at(BUTTON_PATH, 'Button'),
    },
    ButtonProps: {
      name: 'ButtonProps',
      kind: 'interface',
      signature: 'interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>',
      doc: 'Every native button attribute plus a required color.',
      definition: at(BUTTON_PATH, 'ButtonProps'),
    },
    useTranslation: {
      name: 'useTranslation',
      kind: 'function',
      signature: 'function useTranslation(): { t: (key: TranslationKey) => string }',
      doc: 'Returns the translator for the current locale (uk or en).',
      definition: { path: I18N_PATH, line: 1 },
    },
    Hero: {
      name: 'Hero',
      kind: 'function',
      signature: 'function Hero(): JSX.Element',
      doc: 'First screen of the store. Edits here reload instantly through Vite HMR.',
      definition: at(HERO_PATH, 'Hero'),
    },
    accent: {
      name: 'accent',
      kind: 'const',
      signature: `const accent: "${accent}"`,
      doc: 'Brand color shared by the button and links.',
      definition: at(HERO_PATH, 'accent'),
    },
    t: {
      name: 't',
      kind: 'const',
      signature: 'const t: (key: TranslationKey) => string',
      doc: "Translates a key such as 'hero.sub' into the visitor's language.",
      definition: at(HERO_PATH, 't'),
    },
    color: {
      name: 'color',
      kind: 'parameter',
      signature: '(parameter) color: string',
      doc: 'Background color of the button.',
      definition: at(BUTTON_PATH, 'ButtonProps'),
    },
  };
  return table;
}

export function countMatches(source: string, query: string): number {
  if (query === '') return 0;
  const haystack = source.toLowerCase();
  const needle = query.toLowerCase();
  let count = 0;
  for (
    let from = haystack.indexOf(needle);
    from !== -1;
    from = haystack.indexOf(needle, from + needle.length)
  ) {
    count += 1;
  }
  return count;
}

export function replaceAll(value: string, query: string, replacement: string): string {
  if (query === '') return value;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(escaped, 'gi'), replacement);
}

export function quickOpen(paths: readonly string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...paths];
  const score = (path: string) => {
    const name = path.split('/').at(-1)?.toLowerCase() ?? '';
    if (name.startsWith(needle)) return 0;
    if (name.includes(needle)) return 1;
    return path.toLowerCase().includes(needle) ? 2 : 3;
  };
  return paths
    .filter((path) => score(path) < 3)
    .sort((a, b) => score(a) - score(b) || a.localeCompare(b));
}
