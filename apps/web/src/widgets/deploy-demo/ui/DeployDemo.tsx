import { useEffect, useRef, useState } from 'react';
import {
  Bug,
  Check,
  Circle,
  CircleX,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  LoaderCircle,
  Lock,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { DemoStore } from '@/entities/demo-store';
import { useI18n } from '@/shared/i18n';
import { fillTemplate, useAutoplay, usePrefersReducedMotion } from '@/shared/lib';
import { Avatar, Callout, Hotspot, Showcase, Window } from '@/shared/ui';
import {
  VERSION_ACCENTS,
  begin,
  initialState,
  isBuilding,
  productionOf,
  rollback,
  select,
  settle,
  type Commit,
  type DeployState,
  type Deployment,
} from '../model/deployments';
import { STEP_MS, buildTimeline, totalDuration, type TimelineEvent } from '../model/timeline';

type Story = 'idle' | 'building' | 'ready' | 'failed' | 'rollback' | 'selected';

const NAV = ['Overview', 'Deployments', 'Analytics', 'Logs', 'Settings'] as const;
const FAIL_STEP = 3;
const NEW_VERSION = 2;
const BROKEN_VERSION = 3;

interface Run {
  id: string;
  shown: number;
}

type Schedule = (callback: () => void, delay: number) => void;

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

function StatusDot({ status }: { status: Deployment['status'] }) {
  if (status === 'building')
    return (
      <LoaderCircle
        aria-hidden="true"
        className="size-3.5 shrink-0 animate-[spin_0.8s_linear_infinite] text-warn"
      />
    );
  return (
    <span
      aria-hidden="true"
      className={`size-2 shrink-0 rounded-full ${status === 'ready' ? 'bg-ok' : 'bg-bad'}`}
    />
  );
}

export function DeployDemo() {
  const { t } = useI18n();
  const copy = t.deploy;
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);

  const [deploys, setDeploys] = useState<DeployState>(() => initialState(copy.history));
  const [run, setRun] = useState<Run | null>(null);
  const [story, setStory] = useState<Story>('idle');
  const [succeeded, setSucceeded] = useState(false);
  const [triedBroken, setTriedBroken] = useState(false);

  const latest: Commit = {
    sha: t.outstaff.pr.commits[1]?.sha ?? 'e3f9a12',
    message: t.outstaff.pr.commits[1]?.message ?? 'feat: subscription',
  };
  const building = isBuilding(deploys);
  const production = productionOf(deploys);
  const selected = deploys.deployments.find((item) => item.id === deploys.selected);
  const brokenLogs = copy.logs.map((lines, index) =>
    index === FAIL_STEP ? copy.broken.logs : lines,
  );

  const timelineOf = (deployment: Deployment | undefined): TimelineEvent[] => {
    if (!deployment) return [];
    const failed = deployment.version === BROKEN_VERSION;
    return buildTimeline(
      copy.steps,
      failed ? brokenLogs : copy.logs,
      STEP_MS,
      failed ? FAIL_STEP : undefined,
    );
  };

  const timeline = timelineOf(selected);
  const visible =
    run && selected?.id === run.id && selected.status === 'building'
      ? timeline.slice(0, run.shown)
      : timeline;
  const finished = new Set(visible.filter((event) => event.kind === 'done').map((e) => e.step));
  const failedStep = visible.find((event) => event.kind === 'fail')?.step;
  const started = new Set(visible.filter((event) => event.kind === 'start').map((e) => e.step));
  const elapsed = visible.at(-1)?.at ?? 0;

  const start = (later: Schedule, commit: Commit, version: number) => {
    sequence.current += 1;
    const id = `dpl_${sequence.current}`;
    const events = timelineOf({ ...commit, id, status: 'building', version, fresh: true });
    const ok = version !== BROKEN_VERSION;
    setDeploys((state) => begin(state, commit, version, sequence.current));
    setRun({ id, shown: 0 });
    setStory('building');
    events.forEach((event, index) => {
      later(() => setRun({ id, shown: index + 1 }), reduceMotion ? 0 : event.at);
    });
    later(
      () => {
        setDeploys((state) => settle(state, id, ok));
        setStory(ok ? 'ready' : 'failed');
        if (ok) setSucceeded(true);
      },
      reduceMotion ? 0 : (events.at(-1)?.at ?? 0) + 150,
    );
  };

  const { schedule, interrupt, touched } = useAutoplay(rootRef, (later) => {
    later(() => start(later, latest, NEW_VERSION), 500);
  });

  const redeploy = () => {
    interrupt();
    start(schedule, latest, NEW_VERSION);
  };

  const breakIt = () => {
    interrupt();
    setTriedBroken(true);
    start(schedule, copy.broken, BROKEN_VERSION);
  };

  const restore = (id: string) => {
    interrupt();
    setDeploys((state) => rollback(state, id));
    setStory('rollback');
  };

  const inspect = (id: string) => {
    interrupt();
    setDeploys((state) => select(state, id));
    setStory('selected');
  };

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [visible.length, deploys.selected]);

  const ageOf = (deployment: Deployment) =>
    deployment.fresh
      ? copy.newAge
      : (copy.history.find((item) => item.sha === deployment.sha)?.age ?? '');

  const headlineOf = (version: number) =>
    version < copy.history.length
      ? (copy.history[version]?.headline ?? t.build.demo.headline)
      : t.build.demo.headline;

  const caption =
    story === 'ready'
      ? fillTemplate(copy.plain.ready, { s: seconds(totalDuration()) })
      : story === 'rollback' || story === 'selected'
        ? fillTemplate(copy.plain[story], { message: selected?.message ?? '' })
        : copy.plain[story];

  const firstRollback = deploys.deployments.find(
    (item) => item.status === 'ready' && item.id !== deploys.production,
  )?.id;

  return (
    <Showcase
      id="deploy"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      caption={caption}
      glossary={copy.glossary}
    >
      <div ref={rootRef} className="flex flex-col gap-4 lg:relative lg:block lg:min-h-[40rem]">
        <div className="lg:w-[64%]">
          <Window title={copy.window}>
            <div className="flex h-11 items-center gap-5 overflow-x-auto border-b border-win-line px-4 text-[0.8125rem]">
              <span className="flex shrink-0 items-center gap-2 font-medium text-win-text">
                <span
                  aria-hidden="true"
                  className="size-4 rounded bg-gradient-to-br from-[#8a4b2a] to-[#c9875a]"
                />
                zerno-coffee
              </span>
              {NAV.map((item) => (
                <span
                  key={item}
                  className={`hidden shrink-0 sm:inline ${item === 'Deployments' ? 'text-win-text' : 'text-win-muted'}`}
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-win-line px-4 py-4">
              <Callout n={1} className="-top-2 left-3" />
              <Avatar name="syntaxis-dev" />
              <div className="min-w-[11rem] flex-1">
                <p className="truncate text-[0.875rem] font-medium">{latest.message}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] text-win-muted">
                  <span className="inline-flex items-center gap-1">
                    <GitBranch aria-hidden="true" className="size-3" /> main
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitCommitHorizontal aria-hidden="true" className="size-3" /> {latest.sha}
                  </span>
                </p>
              </div>
              <span className="relative">
                <button
                  type="button"
                  onClick={breakIt}
                  disabled={building}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-win-line px-3 py-1.5 text-[0.75rem] font-medium text-win-text hover:border-bad/60 hover:text-bad disabled:cursor-wait disabled:opacity-60"
                >
                  <Bug aria-hidden="true" className="size-3.5" />
                  {copy.actions.broken}
                </button>
                <Hotspot
                  label={copy.hints[1] ?? ''}
                  visible={touched && succeeded && !triedBroken && !building}
                  className="top-full left-1/2 mt-3"
                  side="left"
                />
              </span>
              <span className="relative">
                <button
                  type="button"
                  onClick={redeploy}
                  disabled={building}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-win-text px-3 py-1.5 text-[0.75rem] font-semibold text-win disabled:cursor-wait disabled:opacity-60"
                >
                  <RotateCw aria-hidden="true" className="size-3.5" />
                  {copy.actions.redeploy}
                </button>
                <Hotspot
                  label={copy.hints[0] ?? ''}
                  visible={!touched && !building && succeeded}
                  className="top-full left-1/2 mt-3"
                  side="left"
                />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="border-b border-win-line md:border-r md:border-b-0">
                <p className="px-4 pt-3 pb-1.5 text-[0.6875rem] font-semibold text-win-muted">
                  {copy.list}
                </p>
                <ul className="pb-2">
                  {deploys.deployments.map((deployment) => {
                    const live = deployment.id === deploys.production;
                    const active = deployment.id === deploys.selected;
                    const canRestore = deployment.status === 'ready' && !live && !building;
                    return (
                      <li
                        key={deployment.id}
                        className={`log-line relative flex items-center gap-2 px-2 ${active ? 'bg-win-raised' : ''}`}
                      >
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => inspect(deployment.id)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-win-raised"
                        >
                          <StatusDot status={deployment.status} />
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block text-[0.8125rem] leading-snug text-win-text">
                              {deployment.message}
                            </span>
                            <span className="flex items-center gap-2 font-mono text-[0.6875rem] text-win-muted">
                              {deployment.sha}
                              <span className="font-sans">{ageOf(deployment)}</span>
                            </span>
                          </span>
                          {live ? (
                            <span className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[0.625rem] font-semibold text-ok">
                              {copy.live}
                            </span>
                          ) : null}
                        </button>
                        {canRestore ? (
                          <button
                            type="button"
                            onClick={() => restore(deployment.id)}
                            title={copy.instant}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-win-line px-2 py-1 text-[0.6875rem] text-win-text hover:border-win-accent hover:text-win-accent"
                          >
                            <RotateCcw aria-hidden="true" className="size-3" />
                            {copy.actions.rollback}
                          </button>
                        ) : null}
                        {deployment.id === firstRollback ? (
                          <Hotspot
                            label={copy.hints[2] ?? ''}
                            visible={story === 'failed'}
                            className="top-1/2 right-24 -mt-1.5"
                            side="left"
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex min-w-0 flex-col">
                <ol className="relative flex flex-wrap gap-1 border-b border-win-line p-3">
                  <Callout n={2} className="top-2 right-2" />
                  {copy.steps.map((step, index) => {
                    const done = finished.has(index);
                    const failed = failedStep === index;
                    const current = started.has(index) && !done && !failed;
                    return (
                      <li
                        key={step}
                        aria-current={current ? 'step' : undefined}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.75rem] ${failed ? 'bg-bad/10 text-bad' : current ? 'bg-win-raised text-win-text' : done ? 'text-win-text' : 'text-win-muted'}`}
                      >
                        {failed ? (
                          <CircleX aria-hidden="true" className="size-3.5" />
                        ) : done ? (
                          <Check aria-hidden="true" className="size-3.5 text-ok" />
                        ) : current ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-3.5 animate-[spin_0.8s_linear_infinite] text-warn"
                          />
                        ) : (
                          <Circle aria-hidden="true" className="size-3.5" />
                        )}
                        {step}
                      </li>
                    );
                  })}
                </ol>
                <div
                  ref={logRef}
                  aria-live="off"
                  className="h-[19rem] overflow-y-auto py-3 font-mono text-[0.75rem] leading-[1.7]"
                >
                  {visible.map((event, index) =>
                    event.kind === 'start' ? (
                      <p
                        key={index}
                        className="log-line mt-2 px-4 font-semibold text-win-text first:mt-0"
                      >
                        ▾ {event.text}
                      </p>
                    ) : event.kind === 'line' ? (
                      <p key={index} className="log-line flex gap-3 px-4 whitespace-pre">
                        <span className="w-12 shrink-0 text-right text-win-muted/80">
                          {seconds(event.at)}s
                        </span>
                        <span
                          className={
                            event.text.startsWith('$')
                              ? 'text-win-accent'
                              : event.text.startsWith('FAIL') || event.text.includes('failed')
                                ? 'text-bad'
                                : 'text-win-text/85'
                          }
                        >
                          {event.text}
                        </span>
                      </p>
                    ) : null,
                  )}
                  {selected?.status === 'ready' ? (
                    <p className="log-line mt-2 px-4 text-ok">
                      ✓ Deployment completed in {seconds(elapsed)}s
                    </p>
                  ) : selected?.status === 'error' ? (
                    <p className="log-line mt-2 px-4 font-sans text-bad">✕ {copy.broken.failed}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </Window>
        </div>

        <div className="lg:absolute lg:right-0 lg:bottom-0 lg:z-10 lg:w-[38%]">
          <div data-tone="light" className="window relative overflow-hidden">
            <Callout n={3} className="top-12 right-3" />
            <div className="flex h-9 items-center gap-2 border-b border-win-line bg-win-raised px-3 text-[0.6875rem] text-win-muted">
              <span aria-hidden="true" className="flex gap-1">
                <span className="size-2 rounded-full bg-[#ff5f57]" />
                <span className="size-2 rounded-full bg-[#febc2e]" />
                <span className="size-2 rounded-full bg-[#28c840]" />
              </span>
              <span className="mx-auto flex items-center gap-1.5 rounded-full bg-win px-3 py-0.5">
                <Lock aria-hidden="true" className="size-2.5" />
                zerno.preview.example
              </span>
            </div>
            <div
              key={production?.id}
              aria-hidden="true"
              inert
              className="ink-in h-52 overflow-hidden bg-[#f7f4ef]"
            >
              <div className="w-[200%] origin-top-left scale-50">
                <DemoStore
                  copy={t.build.demo}
                  headline={headlineOf(production?.version ?? NEW_VERSION)}
                  cta={t.build.demo.cta}
                  accent={VERSION_ACCENTS[production?.version ?? NEW_VERSION] ?? '#2F3BFF'}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-win-line px-4 py-3 text-[0.75rem]">
              <span className="inline-flex items-center gap-1.5 font-medium text-ok">
                <span className="size-1.5 rounded-full bg-current" />
                Production
              </span>
              <span className="truncate font-mono text-win-muted">{production?.sha}</span>
              <span className="inline-flex items-center gap-1 text-win-accent">
                Visit <ExternalLink aria-hidden="true" className="size-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Showcase>
  );
}
