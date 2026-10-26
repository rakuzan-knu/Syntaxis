import { describe, expect, it } from 'vitest';
import { addShift, shortName, totalSize, waterfall } from '../model/realVitals';

const entry = (name: string, startTime: number, size: number) => ({
  name,
  initiatorType: 'script',
  startTime,
  duration: 12.4,
  transferSize: size,
  encodedBodySize: size,
});

describe('real vitals helpers', () => {
  it('orders resources by start time and shortens names', () => {
    const rows = waterfall([
      entry('https://site.example/assets/b.js', 40, 100),
      entry('https://site.example/assets/a.css', 10, 50),
    ]);
    expect(rows.map((row) => row.name)).toEqual(['a.css', 'b.js']);
    expect(rows[0]?.duration).toBe(12);
  });

  it('shortens long file names in the middle', () => {
    expect(
      shortName('https://x.example/assets/geologica-cyrillic-wght-normal-abc123.woff2'),
    ).toContain('…');
  });

  it('sums transfer sizes', () => {
    expect(totalSize([entry('a', 0, 100), entry('b', 0, 250)])).toBe(350);
  });

  it('ignores layout shifts right after input', () => {
    expect(addShift(0.01, 0.05, true)).toBe(0.01);
    expect(addShift(0.01, 0.05, false)).toBeCloseTo(0.06);
  });
});
