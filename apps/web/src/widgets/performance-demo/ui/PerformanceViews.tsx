import { useState } from 'react';
import { Check, GitPullRequest, X } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';
import {
  BASE_KB,
  BUDGET_KB,
  NEEDS,
  NO_CHOICES,
  checkBudget,
  type Choice,
  type Choices,
} from '../model/budget';
import { rate, type RatedMetric } from '../model/metrics';
import type { RealVitals } from './useRealVitals';

const TONE = { good: 'text-ok', average: 'text-warn', poor: 'text-bad' } as const;
const BAR = {
  script: 'bg-[#f4b400]',
  link: 'bg-[#7c3aed]',
  css: 'bg-[#7c3aed]',
  img: 'bg-[#0f8a5f]',
  fetch: 'bg-[#2f3bff]',
  other: 'bg-[#94a3b8]',
} as const;

function seconds(ms: number | null, locale: string): string {
  if (ms === null) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(ms / 1000)} s`;
}

export function RealPanel({
  copy,
  vitals,
  locale,
}: {
  copy: Dictionary['performance']['real'];
  vitals: RealVitals;
  locale: string;
}) {
  const metric = (id: RatedMetric, value: number | null, unit: 's' | 'ms' | '') => {
    if (value === null)
      return { text: id === 'inp' ? copy.interact : copy.waiting, tone: 'text-win-muted' };
    const normalized = unit === 's' ? value / 1000 : value;
    const text =
      unit === 's'
        ? seconds(value, locale)
        : unit === 'ms'
          ? `${value} ms`
          : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value);
    return { text, tone: TONE[rate(id, normalized)] };
  };
  const cards = [
    {
      label: 'Time to First Byte',
      ...{ text: vitals.ttfb === null ? copy.waiting : `${vitals.ttfb} ms`, tone: 'text-win-text' },
    },
    { label: 'First Contentful Paint', ...metric('fcp', vitals.fcp, 's') },
    { label: 'Largest Contentful Paint', ...metric('lcp', vitals.lcp, 's') },
    { label: 'Cumulative Layout Shift', ...metric('cls', vitals.cls, '') },
    { label: 'Interaction to Next Paint', ...metric('inp', vitals.inp, 'ms') },
  ];
  const end = Math.max(1, ...vitals.resources.map((row) => row.start + row.duration));

  return (
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <p className="text-[0.8125rem] font-semibold text-win-text">{copy.title}</p>
        <p className="mt-1 text-[0.75rem] text-win-muted">{copy.note}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2">
          {cards.map((card) => (
            <div key={card.label} className="rounded-md bg-win-raised px-3 py-2.5">
              <dt className="text-[0.6875rem] text-win-muted">{card.label}</dt>
              <dd className={`mt-0.5 text-[1.0625rem] font-semibold tabular-nums ${card.tone}`}>
                {card.text}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="min-w-0">
        <p className="flex items-baseline justify-between gap-3 text-[0.75rem] font-semibold text-win-text">
          {copy.waterfall}
          <span className="font-normal text-win-muted">
            {fillTemplate(copy.loaded, {
              n: String(vitals.count),
              kb: String(Math.round(vitals.bytes / 1024)),
            })}
          </span>
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 font-mono text-[0.6875rem]">
          {vitals.resources.map((row) => (
            <li
              key={`${row.name}-${row.start}`}
              className="grid grid-cols-[9rem_minmax(0,1fr)_3.5rem] items-center gap-2"
            >
              <span className="truncate text-win-text" title={row.name}>
                {row.name}
              </span>
              <span className="relative h-2.5 rounded-sm bg-win-raised">
                <span
                  className={`absolute inset-y-0 rounded-sm ${BAR[row.type in BAR ? (row.type as keyof typeof BAR) : 'other']}`}
                  style={{
                    left: `${(row.start / end) * 100}%`,
                    width: `${Math.max(1.5, (row.duration / end) * 100)}%`,
                  }}
                />
              </span>
              <span className="text-right text-win-muted">{row.duration} ms</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Photo() {
  return (
    <svg
      viewBox="0 0 400 240"
      className="size-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="400" height="240" fill="#e9dccb" />
      <circle cx="300" cy="70" r="46" fill="#f5c58a" />
      <path d="M0 170 C80 140 160 150 240 130 S360 120 400 140 V240 H0Z" fill="#b98a63" />
      <ellipse cx="150" cy="168" rx="86" ry="26" fill="#6b4430" />
      <path d="M78 168 Q150 205 222 168 L214 120 Q150 138 86 120Z" fill="#fffaf2" />
      <ellipse cx="150" cy="120" rx="64" ry="16" fill="#4a2c1d" />
      <path d="M222 132 q34 4 26 30 q-6 16 -30 10" fill="none" stroke="#fffaf2" strokeWidth="8" />
      {[0, 1, 2].map((index) => (
        <ellipse
          key={index}
          cx={300 + index * 26}
          cy={190 - index * 6}
          rx="9"
          ry="13"
          transform={`rotate(28 ${300 + index * 26} ${190 - index * 6})`}
          fill={['#c9875a', '#9b5a3c', '#6f4330'][index]}
        />
      ))}
    </svg>
  );
}

export function ImageCompare({ copy }: { copy: Dictionary['performance']['images'] }) {
  const [split, setSplit] = useState(50);
  return (
    <div className="p-5">
      <div className="relative aspect-[5/3] max-h-[22rem] w-full overflow-hidden rounded-lg">
        <Photo />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <Photo />
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${split}%` }}
        />
        <span className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[0.6875rem] text-white">
          {copy.before}
        </span>
        <span className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-1 text-[0.6875rem] text-white">
          {copy.after}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          aria-label={copy.slider}
          onChange={(event) => setSplit(Number(event.target.value))}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
      <p className="mt-3 text-[0.75rem] text-win-muted">{copy.hint}</p>
    </div>
  );
}

export function BudgetCheck({
  copy,
  locale,
  onChange,
}: {
  copy: Dictionary['performance']['budget'];
  locale: string;
  onChange: () => void;
}) {
  const [choices, setChoices] = useState<Choices>(NO_CHOICES);
  const result = checkBudget(choices);
  const scale = Math.max(result.total, BUDGET_KB) * 1.1;
  const pick = (id: keyof Choices, choice: Choice) => {
    onChange();
    setChoices((current) => ({ ...current, [id]: choice }));
  };

  return (
    <div className="flex flex-col gap-4 p-5 text-[0.8125rem]">
      <p className="flex items-center gap-2 font-medium text-win-text">
        <GitPullRequest aria-hidden="true" className="size-4 text-win-accent" />
        {copy.title}
      </p>
      <p className="-mt-2 text-[0.75rem] text-win-muted">{copy.lead}</p>
      <div className="flex flex-col gap-2.5">
        {NEEDS.map((need) => (
          <div key={need.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="w-36 shrink-0 text-win-text">{copy.needs[need.id]}</span>
            <div
              role="radiogroup"
              aria-label={copy.needs[need.id]}
              className="flex flex-wrap gap-1"
            >
              {(['none', 'heavy', 'light'] as const).map((choice) => {
                const item =
                  choice === 'heavy' ? need.heavy : choice === 'light' ? need.light : null;
                const active = choices[need.id] === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-guide={`budget-${need.id}-${choice}`}
                    onClick={() => pick(need.id, choice)}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[0.6875rem] transition-colors ${active ? (choice === 'heavy' && !result.pass ? 'border-bad/50 bg-bad/10 text-win-text' : 'border-win-accent/60 bg-win-accent/10 text-win-text') : 'border-win-line text-win-muted hover:text-win-text'}`}
                  >
                    {item ? `${item.name} +${item.kb} KB` : copy.skip}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-win-line">
        <div className="flex items-center gap-2.5 border-b border-win-line px-3.5 py-2.5">
          {result.pass ? (
            <span className="grid size-5 place-items-center rounded-full bg-ok text-white">
              <Check aria-hidden="true" className="size-3.5" />
            </span>
          ) : (
            <span className="grid size-5 place-items-center rounded-full bg-bad text-white">
              <X aria-hidden="true" className="size-3.5" />
            </span>
          )}
          <span aria-live="polite" className="font-mono text-[0.75rem] text-win-text">
            {fillTemplate(result.pass ? copy.pass : copy.fail, {
              total: String(result.total),
              budget: String(BUDGET_KB),
            })}
          </span>
        </div>
        <div className="px-3.5 py-3">
          <div className="relative h-3 rounded-full bg-win-raised">
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-win-muted/50"
                style={{ width: `${(BASE_KB / scale) * 100}%` }}
              />
              <span
                className={`absolute inset-y-0 rounded-r-full transition-[width] duration-300 ${result.pass ? 'bg-win-accent' : 'bg-bad'}`}
                style={{
                  left: `${(BASE_KB / scale) * 100}%`,
                  width: `${(result.delta / scale) * 100}%`,
                }}
              />
            </span>
            <span
              aria-hidden="true"
              className="absolute -inset-y-1 w-0.5 bg-win-text"
              style={{ left: `${(BUDGET_KB / scale) * 100}%` }}
            />
          </div>
          <p className="mt-2 flex flex-wrap justify-between gap-2 text-[0.6875rem] text-win-muted">
            <span>{fillTemplate(copy.base, { kb: String(BASE_KB) })}</span>
            <span>{fillTemplate(copy.lcp, { s: seconds(result.lcp, locale) })}</span>
          </p>
        </div>
        <p
          className={`border-t border-win-line px-3.5 py-2.5 text-[0.75rem] ${result.pass ? 'text-ok' : 'text-bad'}`}
        >
          {result.pass ? copy.mergeable : copy.blocked}
        </p>
        {result.offenders.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-win-line px-3.5 py-2.5">
            {result.offenders.map((id) => {
              const need = NEEDS.find((item) => item.id === id);
              if (!need) return null;
              return (
                <button
                  key={id}
                  type="button"
                  data-guide={`budget-fix-${id}`}
                  onClick={() => pick(id, 'light')}
                  className="cursor-pointer rounded-md bg-win-accent px-2.5 py-1 text-[0.75rem] font-medium text-white hover:opacity-90"
                >
                  {fillTemplate(copy.fix, { from: need.heavy.name, to: need.light.name })}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
