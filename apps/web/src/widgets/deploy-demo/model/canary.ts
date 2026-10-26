export interface CanaryPoint {
  at: number;
  traffic: number;
  canaryRate: number;
  stableRate: number;
}

export const ERROR_THRESHOLD = 2;
export const CANARY_TICK = 450;
export const VISITORS_PER_TICK = 400;
export const CANARY_VERSION = 5;

const TRAFFIC = [5, 5, 5, 10, 10, 10, 25, 25, 25, 25] as const;
const AFTER_ROLLBACK = 3;
const BREACH_TICKS = 2;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function stableRate(index: number): number {
  return round(0.2 + ((index * 7) % 5) * 0.05);
}

export function canaryRate(index: number): number {
  return round(0.3 + index * 0.42 + ((index * 3) % 4) * 0.08);
}

export function breachIndex(points: readonly CanaryPoint[]): number {
  let streak = 0;
  for (const [index, point] of points.entries()) {
    streak = point.traffic > 0 && point.canaryRate > ERROR_THRESHOLD ? streak + 1 : 0;
    if (streak >= BREACH_TICKS) return index;
  }
  return -1;
}

export function canaryPoints(): CanaryPoint[] {
  const points: CanaryPoint[] = [];
  let rolledBackAt = -1;
  for (let index = 0; index < TRAFFIC.length + AFTER_ROLLBACK; index += 1) {
    const live = rolledBackAt === -1;
    points.push({
      at: index * CANARY_TICK,
      traffic: live ? (TRAFFIC[index] ?? 25) : 0,
      canaryRate: live ? canaryRate(index) : 0,
      stableRate: stableRate(index),
    });
    if (live && breachIndex(points) !== -1) rolledBackAt = index;
    if (rolledBackAt !== -1 && index - rolledBackAt >= AFTER_ROLLBACK) break;
  }
  return points;
}

export function affectedVisitors(points: readonly CanaryPoint[]): number {
  return Math.round(
    points.reduce(
      (sum, point) => sum + (VISITORS_PER_TICK * point.traffic * point.canaryRate) / 10000,
      0,
    ),
  );
}

export function servedVisitors(points: readonly CanaryPoint[]): number {
  return Math.round(
    points.reduce((sum, point) => sum + (VISITORS_PER_TICK * point.traffic) / 100, 0),
  );
}
