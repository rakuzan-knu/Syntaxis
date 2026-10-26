import { describe, expect, it } from 'vitest';
import { addCue, chapterAt, createTimeline, endOf, runUntil } from '../timeline';

describe('timeline', () => {
  it('runs cues in time order up to a point', () => {
    const timeline = createTimeline();
    const log: string[] = [];
    addCue(timeline, () => log.push('b'), 200);
    addCue(timeline, () => log.push('a'), 100);
    addCue(timeline, () => log.push('c'), 300);
    runUntil(timeline, 250);
    expect(log).toEqual(['a', 'b']);
    expect(timeline.now).toBe(250);
    expect(timeline.cues).toHaveLength(1);
  });

  it('schedules nested cues relative to the cue that created them', () => {
    const timeline = createTimeline();
    const log: number[] = [];
    addCue(
      timeline,
      () => {
        addCue(timeline, () => log.push(timeline.now), 50);
      },
      100,
    );
    expect(endOf(timeline)).toBe(100);
    runUntil(timeline, 1000);
    expect(log).toEqual([150]);
  });

  it('keeps insertion order for cues at the same time', () => {
    const timeline = createTimeline();
    const log: string[] = [];
    addCue(timeline, () => log.push('first'), 10);
    addCue(timeline, () => log.push('second'), 10);
    runUntil(timeline, 10);
    expect(log).toEqual(['first', 'second']);
  });

  it('finds the current chapter', () => {
    expect(chapterAt([0, 1000, 3000], 0)).toBe(0);
    expect(chapterAt([0, 1000, 3000], 1500)).toBe(1);
    expect(chapterAt([0, 1000, 3000], 9000)).toBe(2);
  });
});
