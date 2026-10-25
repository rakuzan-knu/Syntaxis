import { describe, expect, it } from 'vitest';
import { buildTimeline, stamp, totalDuration } from '../model/timeline';

describe('buildTimeline', () => {
  const timeline = buildTimeline(['Install', 'Build'], [['a', 'b'], ['c']], [300, 200]);

  it('orders start, log lines and completion for every step', () => {
    expect(timeline.map((event) => `${event.kind}:${event.text}@${event.at}`)).toEqual([
      'start:Install@0',
      'line:a@100',
      'line:b@200',
      'done:Install@300',
      'start:Build@300',
      'line:c@400',
      'done:Build@500',
    ]);
  });

  it('sums durations', () => {
    expect(totalDuration([300, 200])).toBe(500);
  });
});

describe('stamp', () => {
  it('formats a millisecond timestamp', () => {
    const base = new Date(2026, 9, 25, 14, 3, 9, 5).getTime();
    expect(stamp(base, 120)).toBe('14:03:09.125');
  });
});
