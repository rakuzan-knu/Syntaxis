import { describe, expect, it } from 'vitest';
import {
  ERROR_THRESHOLD,
  affectedVisitors,
  breachIndex,
  canaryPoints,
  servedVisitors,
} from '../model/canary';

describe('canary release', () => {
  const points = canaryPoints();
  const breach = breachIndex(points);

  it('rolls back after two ticks above the threshold', () => {
    expect(breach).toBeGreaterThan(0);
    expect(points[breach]?.canaryRate).toBeGreaterThan(ERROR_THRESHOLD);
    expect(points[breach - 1]?.canaryRate).toBeGreaterThan(ERROR_THRESHOLD);
    expect(points[breach - 2]?.canaryRate ?? 0).toBeLessThanOrEqual(ERROR_THRESHOLD);
  });

  it('sends no traffic to the canary after the rollback', () => {
    expect(points.slice(breach + 1).every((point) => point.traffic === 0)).toBe(true);
    expect(points.length).toBe(breach + 4);
  });

  it('ramps traffic up gradually', () => {
    const live = points.slice(0, breach + 1).map((point) => point.traffic);
    expect(live[0]).toBe(5);
    expect(live).toEqual([...live].sort((a, b) => a - b));
  });

  it('keeps the damage small', () => {
    expect(servedVisitors(points)).toBeGreaterThan(0);
    expect(affectedVisitors(points)).toBeLessThan(servedVisitors(points) / 10);
  });
});
