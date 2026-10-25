import { describe, expect, it } from 'vitest';
import {
  ALL_OPTIMIZATIONS,
  BASELINE,
  FRAME_TIMES,
  computeMetrics,
  frameStage,
  rate,
} from '../model/metrics';

const ALL = ['images', 'ssr', 'split', 'fonts', 'cdn'];

describe('computeMetrics', () => {
  it('returns the baseline with nothing enabled', () => {
    expect(computeMetrics([])).toEqual(BASELINE);
  });

  it('reaches a passing profile with every optimisation', () => {
    const metrics = computeMetrics(ALL);
    expect(metrics.score).toBe(98);
    for (const key of ['fcp', 'lcp', 'tbt', 'cls', 'si', 'inp'] as const) {
      expect(rate(key, metrics[key])).toBe('good');
    }
  });

  it('rates the baseline as poor on loading metrics', () => {
    expect(rate('lcp', BASELINE.lcp)).toBe('poor');
    expect(rate('tbt', BASELINE.tbt)).toBe('poor');
  });
});

describe('frameStage', () => {
  it('shows a blank screen before first paint and the full page after LCP', () => {
    const metrics = computeMetrics(ALL);
    expect(frameStage(0.5, metrics)).toBe(0);
    expect(frameStage(metrics.lcp, metrics)).toBe(3);
  });

  it('keeps the baseline incomplete across the whole filmstrip', () => {
    expect(FRAME_TIMES.every((time) => frameStage(time, BASELINE) < 3)).toBe(true);
  });
});

describe('conditions', () => {
  it('slows loading down on 3G and speeds it up on Wi-Fi', () => {
    const base = computeMetrics([]);
    expect(computeMetrics([], { network: '3g', device: 'mobile' }).lcp).toBeGreaterThan(base.lcp);
    expect(computeMetrics([], { network: 'wifi', device: 'mobile' }).lcp).toBeLessThan(base.lcp);
  });

  it('reduces blocking time on a desktop CPU and keeps the score in range', () => {
    const desktop = computeMetrics(ALL_OPTIMIZATIONS, { network: 'wifi', device: 'desktop' });
    expect(desktop.tbt).toBeLessThan(computeMetrics(ALL_OPTIMIZATIONS).tbt + 1);
    expect(desktop.score).toBeLessThanOrEqual(100);
    expect(computeMetrics([], { network: '3g', device: 'mobile' }).score).toBeGreaterThanOrEqual(5);
  });
});
