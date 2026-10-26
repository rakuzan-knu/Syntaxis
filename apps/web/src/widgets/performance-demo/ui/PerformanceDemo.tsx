import { useRef, useState } from 'react';
import { BudgetCheck, ImageCompare, RealPanel } from './PerformanceViews';
import { useRealVitals } from './useRealVitals';
import { Check, Gauge, Play, RotateCcw } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { fillTemplate, useAutoplay, useDemoCommands, usePrefersReducedMotion } from '@/shared/lib';
import {
  Callout,
  DemoPlayer,
  DesktopWindow,
  GuideCursor,
  Hotspot,
  ScoreRing,
  Showcase,
  Window,
} from '@/shared/ui';
import {
  ALL_OPTIMIZATIONS,
  DEFAULT_CONDITIONS,
  FRAME_TIMES,
  computeMetrics,
  raceDuration,
  frameStage,
  rate,
  type Conditions,
  type Device,
  type FrameStage,
  type Network,
  type RatedMetric,
  type Rating,
} from '../model/metrics';

const RATING_TONE: Record<Rating, string> = {
  good: 'text-ok',
  average: 'text-warn',
  poor: 'text-bad',
};

const SAVINGS: Record<string, number> = { images: 0.9, ssr: 1, split: 0.65, fonts: 0.3, cdn: 0.35 };

function Shape({ rating }: { rating: Rating }) {
  if (rating === 'good')
    return <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-ok" />;
  if (rating === 'average')
    return <span aria-hidden="true" className="inline-block size-2.5 bg-warn" />;
  return (
    <span
      aria-hidden="true"
      className="inline-block size-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-bad"
    />
  );
}

type Event =
  | { kind: 'idle' }
  | { kind: 'toggle'; id: string; on: boolean }
  | { kind: 'conditions' }
  | { kind: 'race'; slow: number; fast: number };

const RACE_TICK = 100;
const RACE_SPEED = 2;

function isNetwork(value: string): value is Network {
  return value === 'wifi' || value === '4g' || value === '3g';
}

function isDevice(value: string): value is Device {
  return value === 'mobile' || value === 'desktop';
}

function Frame({ stage, large = false }: { stage: FrameStage; large?: boolean }) {
  return (
    <span
      className={`flex flex-col overflow-hidden border border-win-line bg-white ${large ? 'h-44 w-24 gap-2 rounded-xl p-2' : 'h-20 w-11 gap-1 rounded-[3px] p-1'}`}
    >
      {stage >= 1 ? <span className="h-1.5 w-full rounded-sm bg-[#1d1a17]/15" /> : null}
      {stage >= 2 ? (
        <>
          <span className="h-2 w-4/5 rounded-sm bg-[#1d1a17]/70" />
          <span className="h-1 w-3/5 rounded-sm bg-[#1d1a17]/25" />
          <span className="h-1.5 w-2/5 rounded-full bg-[#2f3bff]" />
        </>
      ) : null}
      {stage >= 3 ? (
        <span className="mt-auto grid grid-cols-2 gap-0.5">
          <span className="aspect-square rounded-sm bg-[#c9875a]" />
          <span className="aspect-square rounded-sm bg-[#9b5a3c]" />
        </span>
      ) : null}
    </span>
  );
}

const CHAPTERS = [0, 4600, 9000, 15000] as const;

export function PerformanceDemo() {
  const { t, locale } = useI18n();
  const copy = t.performance;
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<readonly string[]>([]);
  const [conditions, setConditions] = useState<Conditions>(DEFAULT_CONDITIONS);
  const [metric, setMetric] = useState<RatedMetric | null>(null);
  const [event, setEvent] = useState<Event>({ kind: 'idle' });
  const [raceTime, setRaceTime] = useState<number | null>(null);
  const [view, setView] = useState<'report' | 'real' | 'images' | 'budget'>('report');
  const real = useRealVitals(view === 'real');
  const reduceMotion = usePrefersReducedMotion();

  const raceId = useRef(0);

  const reset = () => {
    raceId.current += 1;
    setEnabled([]);
    setConditions(DEFAULT_CONDITIONS);
    setMetric(null);
    setEvent({ kind: 'idle' });
    setRaceTime(null);
    setView('report');
  };

  const { interrupt, touched, player, schedule } = useAutoplay(
    rootRef,
    (later) => {
      const [, networkAt = 0, raceAt = 0, budgetAt = 0] = CHAPTERS;
      later(() => undefined, networkAt, { target: '[data-guide="choice-3g"]', press: true });
      later(() => undefined, networkAt + 1500, {
        target: '[data-guide="metric-lcp"]',
        press: true,
      });
      later(() => undefined, networkAt + 3300, { target: '[data-guide="choice-4g"]', press: true });
      later(() => undefined, raceAt, { target: '[data-guide="race"]', press: true });
      later(() => undefined, budgetAt, { target: '[data-guide="view-budget"]', press: true });
      later(() => undefined, budgetAt + 1200, {
        target: '[data-guide="budget-dates-heavy"]',
        press: true,
      });
      later(() => undefined, budgetAt + 3200, {
        target: '[data-guide="budget-fix-dates"]',
        press: true,
      });
      copy.optimizations.forEach((item, index) => {
        later(
          () =>
            setEnabled((current) => (current.includes(item.id) ? current : [...current, item.id])),
          900 + index * 700,
        );
      });
    },
    { reset, chapters: CHAPTERS },
  );

  useDemoCommands('performance', player);

  const toggle = (id: string) => {
    interrupt();
    setEnabled((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setEvent({ kind: 'toggle', id, on: !enabled.includes(id) });
  };

  const changeConditions = (patch: Partial<Conditions>) => {
    interrupt();
    setConditions((current) => ({ ...current, ...patch }));
    setEvent({ kind: 'conditions' });
  };

  const metrics = computeMetrics(enabled, conditions);
  const slow = computeMetrics([], conditions);
  const fast = computeMetrics(ALL_OPTIMIZATIONS, conditions);

  const startRace = () => {
    interrupt();
    raceId.current += 1;
    const id = raceId.current;
    const duration = raceDuration(slow);
    const finish = () => {
      if (raceId.current !== id) return;
      setRaceTime(duration);
      setEvent({ kind: 'race', slow: slow.lcp, fast: fast.lcp });
    };
    if (reduceMotion) {
      finish();
      return;
    }
    const ticks = Math.ceil((duration * 1000) / RACE_SPEED / RACE_TICK);
    setRaceTime(0);
    for (let index = 1; index < ticks; index += 1) {
      schedule(() => {
        if (raceId.current === id) setRaceTime((duration * index) / ticks);
      }, index * RACE_TICK);
    }
    schedule(finish, ticks * RACE_TICK);
  };
  const decimal = (value: number, digits: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);

  const vitals: readonly { id: RatedMetric; label: string; value: string }[] = [
    { id: 'fcp', label: 'First Contentful Paint', value: `${decimal(metrics.fcp, 1)} s` },
    { id: 'lcp', label: 'Largest Contentful Paint', value: `${decimal(metrics.lcp, 1)} s` },
    { id: 'tbt', label: 'Total Blocking Time', value: `${metrics.tbt} ms` },
    { id: 'cls', label: 'Cumulative Layout Shift', value: decimal(metrics.cls, 2) },
    { id: 'si', label: 'Speed Index', value: `${decimal(metrics.si, 1)} s` },
    { id: 'inp', label: 'Interaction to Next Paint', value: `${metrics.inp} ms` },
  ];

  const optionLabel = (options: readonly { value: string; label: string }[], value: string) =>
    options.find((option) => option.value === value)?.label ?? value;
  const reportCaption =
    event.kind === 'toggle'
      ? fillTemplate(copy.plain[event.on ? 'applied' : 'removed'], {
          label: copy.optimizations.find((item) => item.id === event.id)?.label ?? '',
          lcp: decimal(metrics.lcp, 1),
        })
      : event.kind === 'conditions'
        ? fillTemplate(copy.plain.conditions, {
            network: optionLabel(copy.networks, conditions.network),
            device: optionLabel(copy.devices, conditions.device).toLowerCase(),
            lcp: decimal(metrics.lcp, 1),
          })
        : event.kind === 'race'
          ? fillTemplate(copy.plain.race, {
              slow: decimal(event.slow, 1),
              fast: decimal(event.fast, 1),
            })
          : copy.plain.idle;
  const caption =
    view === 'real' && real.lcp !== null
      ? fillTemplate(copy.real.plain, { lcp: decimal(real.lcp / 1000, 1) })
      : view === 'images'
        ? copy.images.plain
        : view === 'budget'
          ? copy.budget.plain
          : reportCaption;

  const toolbar = (
    <button
      type="button"
      onClick={() => {
        interrupt();
        setEnabled([]);
      }}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-step--2 text-win-muted hover:text-win-text"
    >
      <RotateCcw aria-hidden="true" className="size-3.5" />
      {copy.reset}
    </button>
  );

  return (
    <Showcase
      id="performance"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      caption={caption}
      glossary={copy.glossary}
      player={<DemoPlayer player={player} labels={copy.chapters} />}
    >
      <div ref={rootRef} className="relative lg:h-full">
        <GuideCursor cursor={player.cursor} name={t.ui.player.guide} />
        <DesktopWindow id="main" title={copy.window} className="lg:h-full">
          <Window title={copy.window} toolbar={toolbar} tone="light" className="h-full">
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-win-line px-5 py-3 text-[0.75rem] text-win-muted">
                <span className="grid size-6 place-items-center rounded-full bg-[#f4b400]/20 text-[#b45309]">
                  <Gauge aria-hidden="true" className="size-3.5" />
                </span>
                <span className="font-medium text-win-text">https://zerno.preview.example/</span>
                <span className="flex flex-wrap items-center gap-3 lg:ml-auto">
                  <ChoiceGroup
                    label={copy.networkLabel}
                    options={copy.networks}
                    value={conditions.network}
                    onChange={(value) => {
                      if (isNetwork(value)) changeConditions({ network: value });
                    }}
                  />
                  <ChoiceGroup
                    label={copy.deviceLabel}
                    options={copy.devices}
                    value={conditions.device}
                    onChange={(value) => {
                      if (isDevice(value)) changeConditions({ device: value });
                    }}
                  />
                </span>
              </div>

              <div
                role="tablist"
                aria-label={copy.views.report}
                className="scrollbar-none flex shrink-0 gap-1 overflow-x-auto border-b border-win-line px-4 text-[0.75rem]"
              >
                {(['report', 'real', 'images', 'budget'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={view === id}
                    data-guide={`view-${id}`}
                    onClick={() => {
                      interrupt();
                      setView(id);
                    }}
                    className={`-mb-px shrink-0 cursor-pointer border-b-2 px-2.5 py-2 whitespace-nowrap ${view === id ? 'border-win-accent font-medium text-win-text' : 'border-transparent text-win-muted hover:text-win-text'}`}
                  >
                    {copy.views[id]}
                  </button>
                ))}
              </div>
              <div className="scroll-area lg:min-h-0 lg:flex-1">
                {view === 'real' ? (
                  <RealPanel copy={copy.real} vitals={real} locale={locale} />
                ) : view === 'images' ? (
                  <ImageCompare copy={copy.images} />
                ) : view === 'budget' ? (
                  <BudgetCheck copy={copy.budget} locale={locale} onChange={interrupt} />
                ) : (
                  <>
                    <div
                      aria-live="polite"
                      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
                    >
                      <div className="relative border-b border-win-line p-5 lg:border-r lg:border-b-0">
                        <Callout n={1} className="top-3 right-3" />
                        <div className="flex flex-wrap justify-center gap-6">
                          <div className="scale-125 px-2 pt-2 pb-4">
                            <ScoreRing value={metrics.score} label="Performance" />
                          </div>
                          {['Accessibility', 'Best Practices', 'SEO'].map((label) => (
                            <ScoreRing key={label} value={100} label={label} size="sm" />
                          ))}
                        </div>
                        <p className="mt-4 text-center text-[0.6875rem] text-win-muted">
                          <span className="mr-3 inline-flex items-center gap-1">
                            <Shape rating="poor" /> 0–49
                          </span>
                          <span className="mr-3 inline-flex items-center gap-1">
                            <Shape rating="average" /> 50–89
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Shape rating="good" /> 90–100
                          </span>
                        </p>
                        <dl className="mt-5 grid grid-cols-2 border-t border-win-line">
                          {vitals.map((vital) => {
                            const rating = rate(vital.id, metrics[vital.id]);
                            const active = metric === vital.id;
                            return (
                              <div
                                key={vital.id}
                                className="border-b border-win-line odd:pr-1 even:pl-1 sm:odd:pr-2 sm:even:pl-2"
                              >
                                <dt>
                                  <button
                                    type="button"
                                    aria-pressed={active}
                                    data-guide={`metric-${vital.id}`}
                                    onClick={() => {
                                      interrupt();
                                      setMetric(active ? null : vital.id);
                                    }}
                                    className={`mt-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 pt-1.5 text-left text-[0.75rem] text-win-text transition-colors ${active ? 'bg-win-accent/10' : 'hover:bg-win-raised'}`}
                                  >
                                    <Shape rating={rating} />
                                    <span className="underline decoration-dotted underline-offset-2">
                                      {vital.label}
                                    </span>
                                  </button>
                                </dt>
                                <dd
                                  className={`px-2 pb-2 pl-[1.625rem] text-[1.0625rem] font-semibold tabular-nums transition-colors duration-500 sm:text-[1.25rem] ${RATING_TONE[rating]}`}
                                >
                                  {vital.value}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                        <p
                          aria-live="polite"
                          className={`mt-3 rounded-md px-3 py-2 text-[0.75rem] ${metric ? 'bg-win-accent/10 text-win-text' : 'text-win-muted'}`}
                        >
                          {metric ? copy.explain[metric] : copy.explainHint}
                        </p>
                      </div>

                      <div className="flex min-w-0 flex-col">
                        <div className="relative border-b border-win-line p-5">
                          <Callout n={2} className="top-3 right-3" />
                          <p className="text-[0.75rem] font-semibold text-win-text">Filmstrip</p>
                          <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {FRAME_TIMES.map((time) => (
                              <li key={time} className="flex shrink-0 flex-col items-center gap-1">
                                <Frame stage={frameStage(time, metrics)} />
                                <span className="font-mono text-[0.625rem] text-win-muted">
                                  {decimal(time, 1)} s
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="relative p-5">
                          <Callout n={3} className="top-3 right-3" />
                          <p className="flex justify-between text-[0.75rem] font-semibold text-win-text">
                            Opportunity
                            <span className="font-normal text-win-muted">Estimated savings</span>
                          </p>
                          <ul className="mt-2">
                            {copy.optimizations.map((item, index) => {
                              const applied = enabled.includes(item.id);
                              return (
                                <li
                                  key={item.id}
                                  className="relative flex items-center gap-3 border-b border-win-line py-2.5 last:border-b-0"
                                >
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block truncate text-[0.8125rem] ${applied ? 'text-win-muted line-through' : 'text-win-text'}`}
                                    >
                                      {item.label}
                                    </span>
                                    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-win-raised">
                                      <span
                                        className={`block h-full rounded-full transition-[width,background-color] duration-500 ${applied ? 'bg-ok' : 'bg-bad'}`}
                                        style={{
                                          width: `${(applied ? 0.08 : (SAVINGS[item.id] ?? 0.4)) * 100}%`,
                                        }}
                                      />
                                    </span>
                                  </span>
                                  <span className="w-20 shrink-0 text-right font-mono text-[0.6875rem] text-win-muted">
                                    {item.detail}
                                  </span>
                                  <button
                                    type="button"
                                    aria-pressed={applied}
                                    onClick={() => toggle(item.id)}
                                    className={`inline-flex w-20 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1 text-[0.6875rem] font-medium transition-colors ${applied ? 'bg-ok/15 text-ok' : 'bg-win-accent text-white hover:bg-win-accent/90'}`}
                                  >
                                    {applied ? (
                                      <Check aria-hidden="true" className="size-3" />
                                    ) : null}
                                    {applied ? 'Applied' : 'Apply'}
                                  </button>
                                  {index === 0 ? (
                                    <Hotspot
                                      label={copy.hints[0] ?? ''}
                                      visible={
                                        !touched && enabled.length === copy.optimizations.length
                                      }
                                      className="top-1/2 right-[5.5rem] -mt-1.5"
                                      side="left"
                                    />
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                          <p className="mt-3 font-mono text-[0.6875rem] text-win-muted">
                            {copy.metrics.weight}: {decimal(metrics.weight, 2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex flex-col gap-4 border-t border-win-line p-5 md:flex-row md:items-center">
                      <div className="relative md:w-56">
                        <p className="text-[0.8125rem] font-semibold text-win-text">
                          {copy.race.button}
                        </p>
                        <button
                          type="button"
                          data-guide="race"
                          onClick={startRace}
                          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-accent px-3 py-1.5 text-[0.75rem] font-semibold text-white hover:bg-win-accent/90"
                        >
                          <Play aria-hidden="true" className="size-3.5 fill-current" />
                          {copy.race.button}
                        </button>
                        <Hotspot
                          label={copy.hints[1] ?? ''}
                          visible={touched && raceTime === null && event.kind === 'toggle'}
                          className="top-full left-4 mt-2"
                          side="right"
                        />
                      </div>
                      <div className="flex flex-1 flex-wrap justify-center gap-8">
                        {(
                          [
                            ['before', slow],
                            ['after', fast],
                          ] as const
                        ).map(([id, sample]) => {
                          const time = raceTime ?? 0;
                          const done = raceTime !== null && time >= sample.lcp;
                          return (
                            <div key={id} className="flex flex-col items-center gap-2">
                              <p className="text-[0.75rem] font-medium text-win-text">
                                {copy.race[id]}
                              </p>
                              <Frame
                                stage={raceTime === null ? 0 : frameStage(time, sample)}
                                large
                              />
                              <p
                                className={`font-mono text-[0.75rem] tabular-nums ${done ? (id === 'after' ? 'text-ok' : 'text-bad') : 'text-win-muted'}`}
                              >
                                {done
                                  ? fillTemplate(copy.race.loaded, { s: decimal(sample.lcp, 1) })
                                  : `${decimal(raceTime === null ? 0 : time, 1)} s`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Window>
        </DesktopWindow>
      </div>
    </Showcase>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <span role="radiogroup" aria-label={label} className="flex rounded-md bg-win-raised p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-guide={`choice-${option.value}`}
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded px-2 py-0.5 ${value === option.value ? 'bg-win text-win-text shadow-sm' : 'hover:text-win-text'}`}
          >
            {option.label}
          </button>
        ))}
      </span>
    </span>
  );
}
