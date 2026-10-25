import { describe, expect, it } from 'vitest';
import { attackLog, isBlocked } from '../model/attacks';

describe('attacks', () => {
  it('is blocked only when its guard header is on', () => {
    expect(isBlocked('xss', ['csp'])).toBe(true);
    expect(isBlocked('xss', ['hsts'])).toBe(false);
    expect(isBlocked('camera', ['permissions', 'frame'])).toBe(true);
  });

  it('logs an error when blocked and a warning when it gets through', () => {
    expect(attackLog('clickjack', true).level).toBe('error');
    expect(attackLog('clickjack', false).level).toBe('warning');
  });
});
