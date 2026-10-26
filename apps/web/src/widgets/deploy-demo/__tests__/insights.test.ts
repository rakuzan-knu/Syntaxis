import { describe, expect, it } from 'vitest';
import { begin, initialState, productionOf, promote, settle } from '../model/deployments';
import { RUNTIME_LOGS, filterLogs, visitsSeries } from '../model/insights';

describe('preview deployments', () => {
  it('keeps production when a preview finishes and switches on promote', () => {
    let state = initialState([{ sha: 'aaa', message: 'live' }]);
    state = settle(
      begin(state, { sha: 'ppp', message: 'preview' }, 4, 1, 'preview'),
      'dpl_1',
      true,
    );
    expect(productionOf(state)?.sha).toBe('aaa');
    state = promote(state, 'dpl_1');
    expect(productionOf(state)?.sha).toBe('ppp');
    expect(state.deployments[0]?.target).toBe('production');
  });
});

describe('insights', () => {
  it('builds two weeks of traffic with busier weekends', () => {
    const series = visitsSeries();
    expect(series).toHaveLength(14);
    expect(series[5]?.visitors ?? 0).toBeGreaterThan(series[4]?.visitors ?? 0);
  });

  it('filters runtime logs by text and problems', () => {
    expect(filterLogs(RUNTIME_LOGS, 'delivery', false)).toHaveLength(2);
    expect(filterLogs(RUNTIME_LOGS, '', true).every((log) => log.level !== 'info')).toBe(true);
    expect(filterLogs(RUNTIME_LOGS, '502', false)[0]?.path).toBe('/api/delivery/quote');
  });
});
