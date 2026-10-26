import { ShieldCheck, TriangleAlert } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';
import {
  CANARY_TICK,
  ERROR_THRESHOLD,
  affectedVisitors,
  breachIndex,
  servedVisitors,
  type CanaryPoint,
} from '../model/canary';

const WIDTH = 320;
const HEIGHT = 120;
const MAX_RATE = 5;

interface CanaryPanelProps {
  copy: Dictionary['deploy']['canary'];
  points: readonly CanaryPoint[];
  shown: number;
  total: number;
}

function path(points: readonly CanaryPoint[], total: number, pick: (point: CanaryPoint) => number) {
  const step = WIDTH / Math.max(total - 1, 1);
  return points
    .map((point, index) => {
      const y = HEIGHT - (Math.min(pick(point), MAX_RATE) / MAX_RATE) * HEIGHT;
      return `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function CanaryPanel({ copy, points, shown, total }: CanaryPanelProps) {
  const visible = points.slice(0, Math.max(shown, 1));
  const current = visible.at(-1);
  const breach = breachIndex(visible);
  const rolledBack = breach !== -1;
  const done = shown >= total;
  const thresholdY = HEIGHT - (ERROR_THRESHOLD / MAX_RATE) * HEIGHT;
  const live = visible.filter((point) => point.traffic > 0);
  const traffic = current?.traffic ?? 0;

  return (
    <div className="flex flex-col gap-3 p-4 text-[0.8125rem]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-win-text">{copy.title}</p>
        <span className="font-mono text-[0.6875rem] text-win-muted">
          {fillTemplate(copy.elapsed, {
            s: ((current?.at ?? 0) / 1000 + CANARY_TICK / 1000).toFixed(1),
          })}
        </span>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[0.6875rem] text-win-muted">
          <span>
            {copy.stable} · {100 - traffic}%
          </span>
          <span>
            {copy.next} · {traffic}%
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-win-raised">
          <span
            className="h-full bg-ok/70 transition-[width] duration-300"
            style={{ width: `${100 - traffic}%` }}
          />
          <span
            className={`h-full transition-[width] duration-300 ${rolledBack ? 'bg-bad' : 'bg-win-accent'}`}
            style={{ width: `${traffic}%` }}
          />
        </div>
      </div>

      <figure>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={copy.chart}
          className="h-28 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            x2={WIDTH}
            y1={thresholdY}
            y2={thresholdY}
            className="stroke-bad/60"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path(visible, total, (point) => point.stableRate)}
            fill="none"
            className="stroke-ok"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path(live, total, (point) => point.canaryRate)}
            fill="none"
            className={rolledBack ? 'stroke-bad' : 'stroke-win-accent'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <figcaption className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-win-muted">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-3 bg-ok" />
            {copy.stable} {current?.stableRate.toFixed(1)}%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-0.5 w-3 ${rolledBack ? 'bg-bad' : 'bg-win-accent'}`}
            />
            {copy.next} {(live.at(-1)?.canaryRate ?? 0).toFixed(1)}%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0 w-3 border-t border-dashed border-bad" />
            {fillTemplate(copy.threshold, { value: String(ERROR_THRESHOLD) })}
          </span>
        </figcaption>
      </figure>

      <p
        aria-live="polite"
        className={`flex items-start gap-2 rounded-lg p-2.5 ${rolledBack ? 'bg-bad/10 text-win-text' : 'bg-win-raised text-win-muted'}`}
      >
        {rolledBack ? (
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bad" />
        ) : (
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-win-accent" />
        )}
        <span>
          {rolledBack
            ? fillTemplate(done ? copy.result : copy.rollback, {
                rate: (live.at(-1)?.canaryRate ?? 0).toFixed(1),
                affected: String(affectedVisitors(visible)),
                served: String(servedVisitors(visible)),
              })
            : fillTemplate(copy.watching, { traffic: String(traffic) })}
        </span>
      </p>
    </div>
  );
}
