import { describe, expect, it } from 'vitest';
import { cssFor } from '../model/css';
import { createDoc } from '../model/document';
import { subscriptionSvg } from '../model/svg';
import { modeCss, modeStyle, tokenValue } from '../model/variables';

const texts = {
  title: 'Club',
  badge: 'New',
  text: 'Fresh beans',
  primary: 'Join',
  secondary: 'Later',
};

describe('color variables', () => {
  it('switches every token between modes', () => {
    expect(tokenValue('--surface-background', 'light')).toBe('#FFFFFF');
    expect(tokenValue('--surface-background', 'dark')).toBe('#17191F');
    expect(tokenValue('--missing', 'dark')).toBe('');
    expect(modeStyle('dark')).toMatchObject({ '--text-primary': '#F2F3F5' });
    expect(modeCss('light')).toContain('  --border-default: #D9DBE0;');
  });

  it('references variables in Dev Mode CSS', () => {
    expect(cssFor(createDoc('#2F3BFF'), 'card')).toContain(
      '  background: var(--surface-background);',
    );
  });

  it('exports the SVG in the current mode', () => {
    const dark = { ...createDoc('#2F3BFF'), mode: 'dark' as const };
    expect(subscriptionSvg(dark, texts)).toContain('fill="#17191F"');
    expect(subscriptionSvg(createDoc('#2F3BFF'), texts)).toContain('fill="#FFFFFF"');
  });
});
