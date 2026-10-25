import { describe, expect, it } from 'vitest';
import { INITIAL_REVIEW, approve, comment, merge, resolve } from '../model/review';

const target = { file: 'a.ts', line: 14, text: 'Handle the timeout' };

describe('review', () => {
  it('moves to fixing on a comment and back to open once resolved', () => {
    let state = comment(INITIAL_REVIEW, target);
    expect(state.stage).toBe('fixing');
    expect(approve(state)).toBe(state);
    state = resolve(state, 1, 'Fixed');
    expect(state.stage).toBe('open');
    expect(state.fixes).toBe(1);
    expect(state.comments[0]?.reply).toBe('Fixed');
  });

  it('ignores empty comments and double resolution', () => {
    expect(comment(INITIAL_REVIEW, { ...target, text: '  ' })).toBe(INITIAL_REVIEW);
    const state = resolve(comment(INITIAL_REVIEW, target), 1, 'Fixed');
    expect(resolve(state, 1, 'Again')).toBe(state);
  });

  it('merges only approved changes with green checks', () => {
    const approved = approve(INITIAL_REVIEW);
    expect(merge(approved, false)).toBe(approved);
    expect(merge(approved, true).stage).toBe('merged');
    expect(merge(INITIAL_REVIEW, true).stage).toBe('open');
  });
});
