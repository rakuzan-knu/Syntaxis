import { describe, expect, it } from 'vitest';
import {
  begin,
  initialState,
  isBuilding,
  productionOf,
  rollback,
  settle,
} from '../model/deployments';
import { buildTimeline } from '../model/timeline';

const history = [
  { sha: 'aaa', message: 'first' },
  { sha: 'bbb', message: 'second' },
];

describe('deployments', () => {
  it('starts with the newest history entry in production', () => {
    const state = initialState(history);
    expect(productionOf(state)?.sha).toBe('bbb');
    expect(state.deployments.map((item) => item.sha)).toEqual(['bbb', 'aaa']);
  });

  it('promotes a successful build to production', () => {
    let state = begin(initialState(history), { sha: 'ccc', message: 'new' }, 2, 1);
    expect(isBuilding(state)).toBe(true);
    state = settle(state, 'dpl_1', true);
    expect(productionOf(state)?.sha).toBe('ccc');
  });

  it('keeps the previous version live when a build fails', () => {
    let state = begin(initialState(history), { sha: 'bad', message: 'broken' }, 3, 2);
    state = settle(state, 'dpl_2', false);
    expect(productionOf(state)?.sha).toBe('bbb');
    expect(state.deployments[0]?.status).toBe('error');
  });

  it('rolls back only to ready deployments', () => {
    let state = settle(
      begin(initialState(history), { sha: 'bad', message: 'x' }, 3, 3),
      'dpl_3',
      false,
    );
    expect(rollback(state, 'dpl_3')).toBe(state);
    state = rollback(state, 'dpl_h0');
    expect(productionOf(state)?.sha).toBe('aaa');
  });
});

describe('failing timeline', () => {
  it('stops at the failed step', () => {
    const events = buildTimeline(['a', 'b', 'c'], [[], ['x'], []], [100, 100, 100], 1);
    expect(events.at(-1)).toMatchObject({ kind: 'fail', step: 1 });
    expect(events.some((event) => event.step === 2)).toBe(false);
  });
});
