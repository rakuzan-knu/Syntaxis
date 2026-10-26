import { describe, expect, it } from 'vitest';
import { BASE_KB, BUDGET_KB, NO_CHOICES, checkBudget } from '../model/budget';

describe('bundle budget', () => {
  it('passes with the current bundle', () => {
    expect(checkBudget(NO_CHOICES)).toMatchObject({ total: BASE_KB, delta: 0, pass: true });
  });

  it('fails when a heavy package blows the budget and names it', () => {
    const result = checkBudget({ ...NO_CHOICES, dates: 'heavy' });
    expect(result.total).toBe(BASE_KB + 72);
    expect(result.pass).toBe(false);
    expect(result.offenders).toEqual(['dates']);
    expect(result.lcp).toBeGreaterThan(checkBudget(NO_CHOICES).lcp);
  });

  it('passes with light alternatives for every need', () => {
    const result = checkBudget({ dates: 'light', utils: 'light', charts: 'light' });
    expect(result.pass).toBe(true);
    expect(result.total).toBeLessThanOrEqual(BUDGET_KB);
  });
});
