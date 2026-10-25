import { describe, expect, it } from 'vitest';
import { LEGAL_SLUGS } from '@/shared/config';
import { LOCALES, loadLegal } from '../locales';
import { getLegal } from '../server';

describe('legal documents', () => {
  it('cover every legal page in every locale', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(getLegal(locale)).sort()).toEqual([...LEGAL_SLUGS].sort());
    }
  });

  it('keep the same sections and update dates across locales', () => {
    const outline = LOCALES.map((locale) =>
      LEGAL_SLUGS.map((slug) => {
        const document = getLegal(locale)[slug];
        return [document.updated, document.sections.map((section) => section.id)];
      }),
    );
    for (const other of outline.slice(1)) expect(other).toEqual(outline[0]);
  });

  it('use unique section ids and ISO dates', () => {
    for (const locale of LOCALES) {
      for (const slug of LEGAL_SLUGS) {
        const document = getLegal(locale)[slug];
        const ids = document.sections.map((section) => section.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(document.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('keep descriptions within search snippet length', () => {
    for (const locale of LOCALES) {
      for (const slug of LEGAL_SLUGS) {
        const { description } = getLegal(locale)[slug];
        expect(description.length).toBeGreaterThanOrEqual(70);
        expect(description.length).toBeLessThanOrEqual(160);
      }
    }
  });

  it('contain no empty strings', () => {
    for (const locale of LOCALES) {
      expect(JSON.stringify(getLegal(locale))).not.toContain('""');
    }
  });

  it('loads the same documents on demand', async () => {
    for (const locale of LOCALES) {
      expect(await loadLegal(locale)).toBe(getLegal(locale));
    }
  });
});
