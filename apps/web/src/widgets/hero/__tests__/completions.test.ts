import { describe, expect, it } from 'vitest';
import { completion } from '../model/completions';

const headline = 'Кава, обсмажена цього тижня';

describe('completion', () => {
  it('suggests the rest of a matching candidate', () => {
    expect(completion('Кава, об', [headline])).toBe('смажена цього тижня');
    expect(completion('кАВА', [headline])).toBe(', обсмажена цього тижня');
  });

  it('stays quiet for short or unknown prefixes', () => {
    expect(completion('К', [headline])).toBe('');
    expect(completion('Чай', [headline])).toBe('');
    expect(completion(headline, [headline])).toBe('');
  });
});
