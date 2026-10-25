import { describe, expect, it } from 'vitest';
import { gradeFor } from '../model/grade';

describe('gradeFor', () => {
  it('maps enabled protections to a grade', () => {
    expect(gradeFor(0, 6)).toBe('F');
    expect(gradeFor(3, 6)).toBe('C');
    expect(gradeFor(5, 6)).toBe('A');
    expect(gradeFor(6, 6)).toBe('A+');
  });

  it('clamps out-of-range input', () => {
    expect(gradeFor(-2, 6)).toBe('F');
    expect(gradeFor(9, 6)).toBe('A+');
  });
});
