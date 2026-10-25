import { describe, expect, it } from 'vitest';
import { DIFF, diffStats } from '../model/diff';

describe('diff', () => {
  it('counts additions and deletions across files', () => {
    expect(diffStats(DIFF)).toEqual({ additions: 13, deletions: 2 });
  });

  it('numbers old and new lines independently', () => {
    const lines = DIFF[0]?.lines ?? [];
    const firstAdd = lines.find((line) => line.kind === 'add');
    const firstDel = lines.find((line) => line.kind === 'del');
    expect(firstDel).toMatchObject({ oldNumber: 13 });
    expect(firstDel?.newNumber).toBeUndefined();
    expect(firstAdd).toMatchObject({ newNumber: 13 });
    expect(lines.at(-1)).toMatchObject({ oldNumber: 18, newNumber: 24 });
  });
});
