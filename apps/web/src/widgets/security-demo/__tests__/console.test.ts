import { describe, expect, it } from 'vitest';
import { consoleMessages, networkRows } from '../model/console';

const ALL = ['csp', 'hsts', 'frame', 'nosniff', 'referrer', 'permissions'];

describe('consoleMessages', () => {
  it('reports only the blocked script when every protection is on', () => {
    const messages = consoleMessages(ALL);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.level).toBe('error');
    expect(messages[0]?.text).toContain('Refused to load the script');
  });

  it('warns that the tracker ran when CSP is off', () => {
    const messages = consoleMessages(['nosniff']);
    expect(messages[0]).toMatchObject({ level: 'warning', source: 'tracker.js:1' });
    expect(messages.map((message) => message.level)).toEqual([
      'warning',
      'warning',
      'warning',
      'info',
    ]);
  });
});

describe('networkRows', () => {
  it('marks the tracker as blocked only under CSP', () => {
    expect(networkRows(ALL).find((row) => row.name === 'tracker.js')?.blocked).toBe(true);
    expect(networkRows([]).find((row) => row.name === 'tracker.js')?.status).toBe('200');
  });
});
