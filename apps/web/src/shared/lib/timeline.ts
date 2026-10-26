export interface CueOptions {
  target?: string;
  click?: boolean;
  press?: boolean;
  value?: string;
  process?: boolean;
}

export interface Cue {
  at: number;
  order: number;
  run: () => void;
  options: CueOptions;
}

export interface Timeline {
  cues: Cue[];
  now: number;
  order: number;
}

export function createTimeline(): Timeline {
  return { cues: [], now: 0, order: 0 };
}

export function addCue(
  timeline: Timeline,
  run: () => void,
  delay: number,
  options: CueOptions = {},
): Cue {
  timeline.order += 1;
  const cue: Cue = { at: timeline.now + Math.max(0, delay), order: timeline.order, run, options };
  timeline.cues.push(cue);
  return cue;
}

export function nextCue(timeline: Timeline, until: number): Cue | undefined {
  let best: Cue | undefined;
  for (const cue of timeline.cues) {
    if (cue.at > until) continue;
    if (!best || cue.at < best.at || (cue.at === best.at && cue.order < best.order)) best = cue;
  }
  return best;
}

export function runUntil(
  timeline: Timeline,
  until: number,
  wrap: (run: () => void) => void = (run) => run(),
): void {
  for (let cue = nextCue(timeline, until); cue; cue = nextCue(timeline, until)) {
    const current = cue;
    timeline.cues = timeline.cues.filter((item) => item !== current);
    timeline.now = current.at;
    wrap(current.run);
  }
  timeline.now = Math.max(timeline.now, until);
}

export function endOf(timeline: Timeline): number {
  return timeline.cues.reduce((end, cue) => Math.max(end, cue.at), timeline.now);
}

export function chapterAt(chapters: readonly number[], elapsed: number): number {
  let index = 0;
  chapters.forEach((start, position) => {
    if (elapsed >= start) index = position;
  });
  return index;
}
