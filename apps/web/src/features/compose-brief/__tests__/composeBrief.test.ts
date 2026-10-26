import { describe, expect, it } from 'vitest';
import { getDictionary } from '@/shared/i18n/server';
import { composeBrief, defaultSelection, estimateWeeks, toggleFocus } from '../model/composeBrief';

describe('composeBrief', () => {
  it('builds a Ukrainian message from the default selection', () => {
    const copy = getDictionary('uk').brief;
    expect(composeBrief(defaultSelection(copy), copy, 'uk')).toBe(
      'Привіт! Нам потрібен корпоративний сайт. Для нас важливі дизайн і SEO. Запуск — за 1–2 місяці, бюджет — обговоримо.',
    );
  });

  it('omits the focus sentence when nothing is selected', () => {
    const copy = getDictionary('en').brief;
    const selection = { ...defaultSelection(copy), focuses: [] };
    expect(composeBrief(selection, copy, 'en')).toBe(
      'Hi! We need a company website. Launch within 1–2 months, budget open to discussion.',
    );
  });

  it('keeps focus order stable regardless of toggle order', () => {
    const copy = getDictionary('en').brief;
    const base = { ...defaultSelection(copy), focuses: [] };
    const selection = toggleFocus(toggleFocus(toggleFocus(base, 'security'), 'design'), 'speed');
    expect(composeBrief(selection, copy, 'en')).toContain(
      'What matters most to us: design, speed, and security.',
    );
  });

  it('removes a focus when toggled twice', () => {
    const copy = getDictionary('uk').brief;
    const selection = toggleFocus(toggleFocus(defaultSelection(copy), 'speed'), 'speed');
    expect(selection.focuses).toEqual(['design', 'seo']);
  });
});

describe('estimateWeeks', () => {
  const base = { project: 'store', focuses: ['design', 'seo'], timeline: 'months', budget: 'open' };

  it('gives a range per project type', () => {
    expect(estimateWeeks(base)).toEqual({ min: 5, max: 8 });
  });

  it('adds time for every extra focus', () => {
    expect(estimateWeeks({ ...base, focuses: ['design', 'seo', 'speed', 'security'] })).toEqual({
      min: 5,
      max: 9,
    });
  });

  it('has no estimate for hiring a developer', () => {
    expect(estimateWeeks({ ...base, project: 'developer' })).toBeNull();
  });
});
