import { useState } from 'react';
import { Play, RotateCcw, Server, X } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import {
  LOAD_SECONDS,
  LOAD_STEP,
  TARGET_RPS,
  loadSeries,
  summarize,
  type LoadPoint,
} from '../model/requestTools';

const POINTS = loadSeries();
const WIDTH = 600;
const HEIGHT = 170;
const MAX_P95 = 250;

interface LoadTestProps {
  copy: Dictionary['api']['load'];
  schedule: (callback: () => void, delay: number) => void;
  onFinish: (summary: ReturnType<typeof summarize>) => void;
  onClose: () => void;
}

function path(points: readonly LoadPoint[], value: (point: LoadPoint) => number, max: number) {
  return points
    .map((point, index) => {
      const x = (point.t / LOAD_SECONDS) * WIDTH;
      const y = HEIGHT - (value(point) / max) * (HEIGHT - 10);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export function LoadTest({ copy, schedule, onFinish, onClose }: LoadTestProps) {
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const visible = POINTS.slice(0, shown);
  const current = visible.at(-1);
  const summary = summarize(visible);

  const start = () => {
    setShown(0);
    setRunning(true);
    POINTS.forEach((_, index) => {
      schedule(() => setShown(index + 1), index * LOAD_STEP * 1000);
    });
    schedule(
      () => {
        setRunning(false);
        onFinish(summarize(POINTS));
      },
      POINTS.length * LOAD_STEP * 1000,
    );
  };

  const rpsLine = path(visible, (point) => point.rps, TARGET_RPS);
  const area =
    visible.length > 1
      ? `${rpsLine} L${((current?.t ?? 0) / LOAD_SECONDS) * WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`
      : '';

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-win/95 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[0.8125rem] font-semibold text-win-text">{copy.title}</p>
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-accent px-3 py-1.5 text-[0.75rem] font-semibold text-win disabled:cursor-wait disabled:opacity-60"
        >
          {shown > 0 && !running ? (
            <RotateCcw aria-hidden="true" className="size-3.5" />
          ) : (
            <Play aria-hidden="true" className="size-3.5 fill-current" />
          )}
          {shown > 0 && !running ? copy.again : copy.start}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="grid size-7 cursor-pointer place-items-center rounded-md text-win-muted hover:bg-win-raised hover:text-win-text"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            [copy.rps, String(current?.rps ?? 0)],
            [copy.p95, `${current?.p95 ?? 0} ms`],
            [copy.errors, '0.00%'],
            [copy.requests, summary.requests.toLocaleString('uk-UA')],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-md bg-win-raised px-3 py-2">
            <dt className="text-[0.6875rem] text-win-muted">{label}</dt>
            <dd className="font-mono text-[1.0625rem] font-semibold text-win-text tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-3 min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="size-full"
          role="img"
          aria-label={copy.title}
        >
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={WIDTH}
              y1={HEIGHT * ratio}
              y2={HEIGHT * ratio}
              stroke="var(--win-line)"
              strokeDasharray="4 6"
            />
          ))}
          {area ? <path d={area} fill="var(--win-accent)" fillOpacity="0.14" /> : null}
          {visible.length > 1 ? (
            <>
              <path
                d={rpsLine}
                fill="none"
                stroke="var(--win-accent)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={path(visible, (point) => point.p95, MAX_P95)}
                fill="none"
                stroke="var(--ok)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </svg>
        <span className="absolute top-1 left-2 text-[0.6875rem] text-win-accent">{copy.rps}</span>
        <span className="absolute top-1 right-2 text-[0.6875rem] text-ok">{copy.p95}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.6875rem] text-win-muted">
        {copy.instances}
        {Array.from({ length: 8 }, (_, index) => (
          <Server
            key={index}
            aria-hidden="true"
            className={`size-4 transition-colors duration-300 ${index < (current?.instances ?? 2) ? 'text-ok' : 'text-win-line'}`}
          />
        ))}
        <span className="font-mono text-win-text">{current?.instances ?? 2}</span>
      </div>
    </div>
  );
}
