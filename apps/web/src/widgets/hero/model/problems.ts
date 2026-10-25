import { HERO_PATH, type HeroState } from './fileSystem';

export interface Problem {
  severity: 'error' | 'warning';
  message: string;
  source: string;
  path: string;
  line: number;
  column: number;
}

export const HEADLINE_LIMIT = 40;

export function detectProblems({ headline, cta }: HeroState): Problem[] {
  const problems: Problem[] = [];
  if (!cta.trim()) {
    problems.push({
      severity: 'error',
      message: 'Buttons must have discernible text.',
      source: 'eslint(jsx-a11y/control-has-associated-label)',
      path: HERO_PATH,
      line: 11,
      column: 7,
    });
  }
  if (!headline.trim()) {
    problems.push({
      severity: 'warning',
      message: 'Headings must have content and the content must be accessible.',
      source: 'eslint(jsx-a11y/heading-has-content)',
      path: HERO_PATH,
      line: 8,
      column: 5,
    });
  } else if (headline.length > HEADLINE_LIMIT) {
    problems.push({
      severity: 'warning',
      message: `Headline is ${headline.length} characters long and may wrap to three lines on phones.`,
      source: 'syntaxis(headline-length)',
      path: HERO_PATH,
      line: 8,
      column: 9,
    });
  }
  return problems;
}

export function countBySeverity(problems: readonly Problem[]): {
  errors: number;
  warnings: number;
} {
  return {
    errors: problems.filter((problem) => problem.severity === 'error').length,
    warnings: problems.filter((problem) => problem.severity === 'warning').length,
  };
}
