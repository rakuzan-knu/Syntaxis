import { describe, expect, it } from 'vitest';
import { isBlocked } from '../model/attacks';
import { VULNERABLE, owaspReport } from '../model/audit';

const ALL = [
  'csp',
  'hsts',
  'frame',
  'nosniff',
  'referrer',
  'permissions',
  'rateLimit',
  'sqlParams',
];

describe('server attacks', () => {
  it('are blocked by rate limiting and parameterized queries', () => {
    expect(isBlocked('bruteforce', ['rateLimit'])).toBe(true);
    expect(isBlocked('sqli', ['csp'])).toBe(false);
  });
});

describe('owasp report', () => {
  it('passes everything when protected and patched', () => {
    const report = owaspReport(
      ALL,
      6,
      VULNERABLE.map((dependency) => dependency.name),
    );
    expect(report).toHaveLength(10);
    expect(report.every((item) => item.state === 'pass')).toBe(true);
  });

  it('flags injection, auth and outdated components', () => {
    const report = owaspReport(['csp', 'hsts'], 6, []);
    const failing = report.filter((item) => item.state === 'fail').map((item) => item.id);
    expect(failing).toEqual(['A03', 'A05', 'A06', 'A07']);
  });
});
