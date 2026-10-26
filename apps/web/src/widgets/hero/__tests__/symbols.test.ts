import { describe, expect, it } from 'vitest';
import { HERO_PATH, sourcesFor } from '../model/fileSystem';
import { countMatches, definitionLine, quickOpen, replaceAll, symbolsFor } from '../model/symbols';

const hero = { headline: 'Кава, обсмажена цього тижня', cta: 'Обрати каву', accent: '#2F3BFF' };
const sources = sourcesFor(hero);

describe('symbols', () => {
  it('points Button to its declaration in Button.tsx', () => {
    const button = symbolsFor(sources, hero.accent).Button;
    expect(button?.definition).toEqual({ path: 'src/shared/ui/Button.tsx', line: 7 });
  });

  it('shows the live accent value in the signature', () => {
    expect(symbolsFor(sources, '#0F8A5F').accent?.signature).toBe('const accent: "#0F8A5F"');
  });

  it('finds the line where a name is declared', () => {
    expect(definitionLine(sources[HERO_PATH] ?? '', 'Hero')).toBe(5);
    expect(definitionLine('nothing here', 'Hero')).toBe(1);
  });
});

describe('find and replace', () => {
  it('counts matches case-insensitively', () => {
    expect(countMatches('Кава і кава, КАВА', 'кава')).toBe(3);
    expect(countMatches('text', '')).toBe(0);
  });

  it('replaces all occurrences and escapes special characters', () => {
    expect(replaceAll('Кава і кава', 'кава', 'чай')).toBe('чай і чай');
    expect(replaceAll('a+b a+b', 'a+b', 'c')).toBe('c c');
  });
});

describe('quick open', () => {
  it('ranks file names that start with the query first', () => {
    const paths = ['src/main.tsx', 'src/shared/ui/Button.tsx', 'src/widgets/hero/Hero.tsx'];
    expect(quickOpen(paths, 'he')).toEqual(['src/widgets/hero/Hero.tsx']);
    expect(quickOpen(paths, 'ui')[0]).toBe('src/shared/ui/Button.tsx');
    expect(quickOpen(paths, '')).toHaveLength(3);
  });
});
