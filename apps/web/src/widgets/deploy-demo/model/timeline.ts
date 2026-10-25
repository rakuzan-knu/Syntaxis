export const STEP_MS: readonly number[] = [900, 700, 600, 1100, 1000, 900];

export interface TimelineEvent {
  at: number;
  step: number;
  kind: 'start' | 'line' | 'done' | 'fail';
  text: string;
}

export function buildTimeline(
  steps: readonly string[],
  logs: readonly (readonly string[])[],
  durations: readonly number[] = STEP_MS,
  failAt?: number,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let elapsed = 0;
  steps.forEach((step, index) => {
    if (failAt !== undefined && index > failAt) return;
    const duration = durations[index] ?? 800;
    const lines = logs[index] ?? [];
    events.push({ at: elapsed, step: index, kind: 'start', text: step });
    lines.forEach((text, lineIndex) => {
      events.push({
        at: elapsed + Math.round(((lineIndex + 1) * duration) / (lines.length + 1)),
        step: index,
        kind: 'line',
        text,
      });
    });
    elapsed += duration;
    events.push({ at: elapsed, step: index, kind: index === failAt ? 'fail' : 'done', text: step });
  });
  return events;
}

export function totalDuration(durations: readonly number[] = STEP_MS): number {
  return durations.reduce((sum, value) => sum + value, 0);
}

export function stamp(base: number, offset: number): string {
  const date = new Date(base + offset);
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
  return `${time}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

export function currentTime(): number {
  return Date.now();
}
