export interface Dependency {
  name: string;
  current: string;
  fixed: string;
  severity: 'critical' | 'high' | 'moderate';
  issue: string;
}

export const VULNERABLE: readonly Dependency[] = [
  {
    name: 'image-resize-lite',
    current: '1.2.0',
    fixed: '1.4.3',
    severity: 'high',
    issue: 'Path traversal in upload handler',
  },
  {
    name: 'markdown-preview-kit',
    current: '0.9.1',
    fixed: '0.9.6',
    severity: 'critical',
    issue: 'Cross-site scripting in rendered links',
  },
  {
    name: 'date-parse-utils',
    current: '2.0.4',
    fixed: '2.1.0',
    severity: 'moderate',
    issue: 'Regular expression denial of service',
  },
];

export type OwaspState = 'pass' | 'fail';

export interface OwaspItem {
  id: string;
  title: string;
  state: OwaspState;
}

const TITLES: readonly (readonly [string, string])[] = [
  ['A01', 'Broken Access Control'],
  ['A02', 'Cryptographic Failures'],
  ['A03', 'Injection'],
  ['A04', 'Insecure Design'],
  ['A05', 'Security Misconfiguration'],
  ['A06', 'Vulnerable and Outdated Components'],
  ['A07', 'Identification and Authentication Failures'],
  ['A08', 'Software and Data Integrity Failures'],
  ['A09', 'Security Logging and Monitoring Failures'],
  ['A10', 'Server-Side Request Forgery'],
];

export function owaspReport(
  enabled: readonly string[],
  headerCount: number,
  fixed: readonly string[],
): OwaspItem[] {
  const on = (id: string) => enabled.includes(id);
  const headersOn = enabled.filter((id) => !['rateLimit', 'sqlParams'].includes(id)).length;
  const failing: Record<string, boolean> = {
    A02: !on('hsts'),
    A03: !on('csp') || !on('sqlParams'),
    A05: headersOn < headerCount,
    A06: VULNERABLE.some((dependency) => !fixed.includes(dependency.name)),
    A07: !on('rateLimit'),
  };
  return TITLES.map(([id, title]) => ({ id, title, state: failing[id] ? 'fail' : 'pass' }));
}
