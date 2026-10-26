export interface ResourceRow {
  name: string;
  type: string;
  start: number;
  duration: number;
  size: number;
}

export interface WaterfallInput {
  name: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
}

export function shortName(url: string): string {
  try {
    const parsed = new URL(url);
    const file = parsed.pathname.split('/').filter(Boolean).at(-1) ?? parsed.hostname;
    return file.length > 28 ? `${file.slice(0, 12)}…${file.slice(-12)}` : file;
  } catch {
    return url.slice(0, 28);
  }
}

export function waterfall(entries: readonly WaterfallInput[], limit = 9): ResourceRow[] {
  return [...entries]
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, limit)
    .map((entry) => ({
      name: shortName(entry.name),
      type: entry.initiatorType,
      start: Math.round(entry.startTime),
      duration: Math.max(1, Math.round(entry.duration)),
      size: entry.transferSize || entry.encodedBodySize,
    }));
}

export function totalSize(entries: readonly WaterfallInput[]): number {
  return entries.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize), 0);
}

export function addShift(current: number, value: number, hadRecentInput: boolean): number {
  return hadRecentInput ? current : current + value;
}
