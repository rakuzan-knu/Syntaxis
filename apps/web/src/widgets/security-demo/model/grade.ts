export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

const GRADES: readonly Grade[] = ['F', 'F', 'D', 'C', 'B', 'A', 'A+'];

export function gradeFor(enabled: number, total: number): Grade {
  const normalized = Math.round((Math.max(0, Math.min(enabled, total)) / total) * 6);
  return GRADES[normalized] ?? 'F';
}

export function gradeTone(grade: Grade): string {
  if (grade === 'A+' || grade === 'A') return 'text-ok';
  if (grade === 'B' || grade === 'C') return 'text-warn';
  return 'text-bad';
}

export const HEADER_VALUES: Record<string, string> = {
  csp: "default-src 'self'; script-src 'self'; frame-ancestors 'none'",
  hsts: 'max-age=63072000; includeSubDomains; preload',
  frame: 'DENY',
  nosniff: 'nosniff',
  referrer: 'strict-origin-when-cross-origin',
  permissions: 'camera=(), microphone=(), geolocation=()',
};
