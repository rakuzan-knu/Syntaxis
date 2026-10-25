import { describe, expect, it } from 'vitest';
import { LOCALES, loadDictionary } from '../locales';
import { getDictionary } from '../server';

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return 'array';
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, shape(nested)]),
    );
  }
  return typeof value;
}

describe('dictionaries', () => {
  it('share the same structure across locales', () => {
    const [base, ...rest] = LOCALES.map((locale) => shape(getDictionary(locale)));
    for (const other of rest) expect(other).toEqual(base);
  });

  it('keep matching choice values for the brief in every locale', () => {
    const values = LOCALES.map((locale) => {
      const brief = getDictionary(locale).brief;
      return [brief.projects, brief.focuses, brief.timelines, brief.budgets].map((list) =>
        list.map((choice) => choice.value),
      );
    });
    for (const other of values.slice(1)) expect(other).toEqual(values[0]);
  });

  it('contain no empty strings', () => {
    for (const locale of LOCALES) {
      const strings = JSON.stringify(getDictionary(locale));
      expect(strings).not.toContain('""');
    }
  });

  it('loads the same dictionary on demand', async () => {
    for (const locale of LOCALES) {
      expect(await loadDictionary(locale)).toBe(getDictionary(locale));
    }
  });
});
