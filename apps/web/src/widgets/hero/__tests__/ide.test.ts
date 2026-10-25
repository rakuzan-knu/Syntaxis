import { describe, expect, it } from 'vitest';
import {
  HERO_PATH,
  ancestors,
  badgeOf,
  childrenOf,
  findNode,
  languageOf,
  searchFiles,
  sourcesFor,
} from '../model/fileSystem';
import { countBySeverity, detectProblems } from '../model/problems';
import { runCommand } from '../model/shell';

const hero = { headline: 'Кава, обсмажена цього тижня', cta: 'Обрати каву', accent: '#2F3BFF' };

describe('file system', () => {
  it('finds files and their ancestor folders', () => {
    expect(findNode(HERO_PATH)?.kind).toBe('file');
    expect(ancestors(HERO_PATH)).toEqual(['src', 'src/widgets', 'src/widgets/hero']);
    expect(childrenOf('src/widgets/hero').map((node) => node.name)).toEqual([
      'Hero.tsx',
      'index.ts',
    ]);
  });

  it('has source for every file in the tree', () => {
    const sources = sourcesFor(hero);
    const files: string[] = [];
    const walk = (path: string) => {
      for (const node of childrenOf(path)) {
        if (node.kind === 'file') files.push(node.path);
        else walk(node.path);
      }
    };
    walk('');
    expect(files.every((path) => typeof sources[path] === 'string')).toBe(true);
  });

  it('picks a language and badge by extension', () => {
    expect(languageOf('package.json')).toBe('json');
    expect(languageOf(HERO_PATH)).toBe('tsx');
    expect(badgeOf('Hero.tsx').label).toBe('TSX');
  });

  it('searches every file and reports the line', () => {
    const results = searchFiles('accent', sourcesFor(hero));
    const heroResult = results.find((result) => result.path === HERO_PATH);
    expect(heroResult?.matches.map((match) => match.line)).toEqual([3, 10]);
    expect(searchFiles('a', sourcesFor(hero))).toEqual([]);
  });
});

describe('problems', () => {
  it('reports nothing for valid content', () => {
    expect(detectProblems(hero)).toEqual([]);
  });

  it('flags an empty headline and an empty button', () => {
    const problems = detectProblems({ ...hero, headline: ' ', cta: '' });
    expect(countBySeverity(problems)).toEqual({ errors: 1, warnings: 1 });
    expect(problems.map((problem) => problem.line)).toEqual([11, 8]);
  });

  it('warns about a long headline', () => {
    expect(detectProblems({ ...hero, headline: 'x'.repeat(45) })[0]?.source).toBe(
      'syntaxis(headline-length)',
    );
  });
});

describe('shell', () => {
  const context = { modified: true, errors: 0, warnings: 0 };

  it('reports git status from the editor state', () => {
    const result = runCommand('git   status', context);
    expect(result.clear).toBe(false);
    expect(!result.clear && result.output.at(-1)).toContain(HERO_PATH);
  });

  it('fails the build when there are lint errors', () => {
    const result = runCommand('pnpm build', { ...context, errors: 1 });
    expect(!result.clear && result.output.at(-1)).toContain('Build failed');
  });

  it('clears and rejects unknown commands', () => {
    expect(runCommand('clear', context)).toEqual({ clear: true });
    const unknown = runCommand('rm -rf /', context);
    expect(!unknown.clear && unknown.output[0]).toContain('command not found');
  });
});
