export interface Metrics {
  score: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  si: number;
  inp: number;
  weight: number;
}

export const BASELINE: Metrics = {
  score: 41,
  fcp: 3.4,
  lcp: 5.8,
  tbt: 640,
  cls: 0.21,
  si: 6.1,
  inp: 420,
  weight: 2.6,
};

const EFFECTS: Record<string, Partial<Metrics>> = {
  images: { score: 18, lcp: -1.6, si: -1.4, weight: -1.4 },
  ssr: { score: 17, fcp: -1.6, lcp: -1.9, si: -1.6, cls: -0.12 },
  split: { score: 12, tbt: -470, inp: -190, si: -0.6, weight: -0.21 },
  fonts: { score: 6, fcp: -0.3, lcp: -0.3, cls: -0.08, weight: -0.18 },
  cdn: { score: 4, fcp: -0.4, lcp: -0.6, si: -0.5, inp: -40 },
};

const KEYS = ['score', 'fcp', 'lcp', 'tbt', 'cls', 'si', 'inp', 'weight'] as const;

export type Network = 'wifi' | '4g' | '3g';
export type Device = 'mobile' | 'desktop';

export interface Conditions {
  network: Network;
  device: Device;
}

export const DEFAULT_CONDITIONS: Conditions = { network: '4g', device: 'mobile' };

const NETWORK_TIME: Record<Network, number> = { wifi: 0.55, '4g': 1, '3g': 1.9 };
const NETWORK_SCORE: Record<Network, number> = { wifi: 8, '4g': 0, '3g': -22 };
const DEVICE_TIME: Record<Device, number> = { mobile: 1, desktop: 0.6 };
const DEVICE_CPU: Record<Device, number> = { mobile: 1, desktop: 0.35 };
const DEVICE_SCORE: Record<Device, number> = { mobile: 0, desktop: 10 };

const round = (value: number, digits: number) => Number(value.toFixed(digits));

export function computeMetrics(
  enabled: readonly string[],
  conditions: Conditions = DEFAULT_CONDITIONS,
): Metrics {
  const total = { ...BASELINE };
  for (const id of enabled) {
    const effect = EFFECTS[id] ?? {};
    for (const key of KEYS) total[key] += effect[key] ?? 0;
  }
  const time = NETWORK_TIME[conditions.network] * DEVICE_TIME[conditions.device];
  const cpu = DEVICE_CPU[conditions.device];
  const score = total.score + NETWORK_SCORE[conditions.network] + DEVICE_SCORE[conditions.device];
  return {
    score: Math.max(5, Math.min(100, Math.round(score))),
    fcp: round(Math.max(0.4, Math.max(0.6, total.fcp) * time), 1),
    lcp: round(Math.max(0.5, Math.max(0.8, total.lcp) * time), 1),
    tbt: Math.max(0, Math.round(total.tbt * cpu)),
    cls: round(Math.max(0, total.cls), 2),
    si: round(Math.max(0.5, Math.max(0.8, total.si) * time), 1),
    inp: Math.max(30, Math.round(Math.max(40, total.inp) * cpu)),
    weight: round(Math.max(0.2, total.weight), 2),
  };
}

export const ALL_OPTIMIZATIONS: readonly string[] = Object.keys(EFFECTS);

export function raceDuration(slow: Metrics): number {
  return round(slow.lcp + 0.5, 1);
}

export type Rating = 'good' | 'average' | 'poor';

export type RatedMetric = 'fcp' | 'lcp' | 'tbt' | 'cls' | 'si' | 'inp';

const LIMITS: Record<RatedMetric, readonly [number, number]> = {
  fcp: [1.8, 3],
  lcp: [2.5, 4],
  tbt: [200, 600],
  cls: [0.1, 0.25],
  si: [3.4, 5.8],
  inp: [200, 500],
};

export function rate(metric: RatedMetric, value: number): Rating {
  const [good, poor] = LIMITS[metric];
  if (value <= good) return 'good';
  return value <= poor ? 'average' : 'poor';
}

export type FrameStage = 0 | 1 | 2 | 3;

export const FRAME_TIMES: readonly number[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function frameStage(time: number, metrics: Metrics): FrameStage {
  if (time < metrics.fcp) return 0;
  if (time >= metrics.lcp) return 3;
  return time < (metrics.fcp + metrics.lcp) / 2 ? 1 : 2;
}
