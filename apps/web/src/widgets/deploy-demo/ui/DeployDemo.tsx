import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Gauge,
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
  Search,
} from 'lucide-react';
import { DemoStore } from '@/entities/demo-store';
import { useI18n } from '@/shared/i18n';
import { fillTemplate, useAutoplay, useDemoCommands, usePrefersReducedMotion } from '@/shared/lib';
import {
  Avatar,
  Callout,
  DemoPlayer,
  DesktopWindow,
  GuideCursor,
  Hotspot,
  Showcase,
  TrafficLights,
  Window,
} from '@/shared/ui';
import {
  begin,
  initialState,
  isBuilding,
  PREVIEW_VERSION,
  productionOf,
  promote,
  rollback,
  select,
  settle,
  VERSION_ACCENTS,
  type Commit,
  type Deployment,
  type DeployState,
  type DeployTarget,
} from '../model/deployments';
import { STEP_MS, buildTimeline, totalDuration, type TimelineEvent } from '../model/timeline';
import { CANARY_VERSION, breachIndex, canaryPoints } from '../model/canary';
import { CanaryPanel } from './CanaryPanel';
import { Insights, type Section } from './Insights';

type Story =
  | 'idle'
  | 'building'
  | 'ready'
  | 'failed'
  | 'rollback'
  | 'selected'
  | 'preview'
  | 'promoted'
  | 'canary'
  | 'canaryRollback';

const CANARY_POINTS = canaryPoints();
const CANARY_BREACH = breachIndex(CANARY_POINTS);

const NAV: readonly Section[] = ['Deployments', 'Analytics', 'Logs', 'Settings'];
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

const CHAPTERS = [0, 6800, 12000, 14200] as const;

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
  const [section, setSection] = useState<Section>('Deployments');
  const [logQuery, setLogQuery] = useState('');
  const [succeeded, setSucceeded] = useState(false);
  const [triedBroken, setTriedBroken] = useState(false);
  const [canary, setCanary] = useState<Run | null>(null);

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

  const start = (
    later: Schedule,
    commit: Commit,
    version: number,
    target: DeployTarget = 'production',
  ) => {
    sequence.current += 1;
    const id = `dpl_${sequence.current}`;
    const events = timelineOf({
      ...commit,
      id,
      status: 'building',
      version,
      fresh: true,
      target,
    });
    const ok = version !== BROKEN_VERSION;
    setSection('Deployments');
    setDeploys((state) => begin(state, commit, version, sequence.current, target));
    setRun({ id, shown: 0 });
    setStory('building');
    events.forEach((event, index) => {
      later(() => setRun({ id, shown: index + 1 }), reduceMotion ? 0 : event.at);
    });
    later(
      () => {
        setDeploys((state) => settle(state, id, ok));
        setStory(ok ? (target === 'preview' ? 'preview' : 'ready') : 'failed');
        if (ok) setSucceeded(true);
      },
      reduceMotion ? 0 : (events.at(-1)?.at ?? 0) + 150,
    );
  };

  const reset = () => {
    sequence.current = 0;
    setDeploys(initialState(copy.history));
    setRun(null);
    setStory('idle');
    setSucceeded(false);
    setTriedBroken(false);
    setSection('Deployments');
    setLogQuery('');
    setCanary(null);
  };

  const { schedule, interrupt, touched, player } = useAutoplay(
    rootRef,
    (later) => {
      const [, broken = 0, restoreAt = 0, canaryAt = 0] = CHAPTERS;
      later(() => undefined, 600, { target: '[data-guide="redeploy"]', press: true });
      later(() => undefined, broken, { target: '[data-guide="broken"]', press: true });
      later(() => undefined, restoreAt, { target: '[data-guide="rollback"]', press: true });
      later(() => undefined, canaryAt, { target: '[data-guide="canary"]', press: true });
    },
    { reset, chapters: CHAPTERS },
  );

  useDemoCommands('deploy', player);

  const redeploy = () => {
    interrupt();
    start(schedule, latest, NEW_VERSION);
  };

  const breakIt = () => {
    interrupt();
    setTriedBroken(true);
    start(schedule, copy.broken, BROKEN_VERSION);
  };

  const releaseCanary = () => {
    interrupt();
    sequence.current += 1;
    const id = `dpl_${sequence.current}`;
    setSection('Deployments');
    setDeploys((state) =>
      begin(state, copy.canary.commit, CANARY_VERSION, sequence.current, 'canary'),
    );
    setCanary({ id, shown: reduceMotion ? CANARY_POINTS.length : 1 });
    setStory('canary');
    CANARY_POINTS.forEach((point, index) => {
      schedule(() => setCanary({ id, shown: index + 1 }), reduceMotion ? 0 : point.at);
    });
    schedule(
      () => {
        setDeploys((state) => settle(state, id, false));
        setStory('canaryRollback');
      },
      reduceMotion ? 0 : (CANARY_POINTS[CANARY_BREACH]?.at ?? 0) + 200,
    );
  };

  const previewBranch = () => {
    interrupt();
    start(
      schedule,
      { sha: copy.preview.sha, message: copy.preview.message },
      PREVIEW_VERSION,
      'preview',
    );
  };

  const promoteDeployment = (id: string) => {
    interrupt();
    setDeploys((state) => promote(state, id));
    setStory('promoted');
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
    version === PREVIEW_VERSION
      ? copy.preview.headline
      : version < copy.history.length
        ? (copy.history[version]?.headline ?? t.build.demo.headline)
        : t.build.demo.headline;

  const caption =
    section === 'Logs'
      ? copy.plainExtra.logs
      : story === 'canary' || story === 'canaryRollback'
        ? copy.canary.plain[story]
        : story === 'preview' || story === 'promoted'
          ? copy.plainExtra[story]
          : story === 'ready'
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
      player={<DemoPlayer player={player} labels={copy.chapters} />}
    >
      <div ref={rootRef} className="relative flex flex-col gap-4 lg:block lg:h-full">
        <GuideCursor cursor={player.cursor} name={t.ui.player.guide} />
        <DesktopWindow id="deployments" title={copy.window} className="lg:h-full lg:w-[64%]">
          <Window title={copy.window} className="h-full">
            <div className="flex h-full flex-col">
              <div className="flex h-11 shrink-0 items-center gap-5 overflow-x-auto border-b border-win-line px-4 text-[0.8125rem]">
                <span className="flex shrink-0 items-center gap-2 font-medium text-win-text">
                  <span
                    aria-hidden="true"
                    className="size-4 rounded bg-gradient-to-br from-[#8a4b2a] to-[#c9875a]"
                  />
                  zerno-coffee
                </span>
                <span role="tablist" aria-label="Project" className="flex gap-1">
                  {NAV.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={section === item}
                      onClick={() => {
                        interrupt();
                        setSection(item);
                      }}
                      className={`shrink-0 cursor-pointer rounded-md px-2 py-1 transition-colors ${section === item ? 'bg-win-raised text-win-text' : 'text-win-muted hover:text-win-text'}`}
                    >
                      {item}
                    </button>
                  ))}
                </span>
              </div>

              <div className="relative flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-win-line px-4 py-4">
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
                <button
                  type="button"
                  data-guide="canary"
                  onClick={releaseCanary}
                  disabled={building}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-win-line px-3 py-1.5 text-[0.75rem] font-medium text-win-text hover:border-win-accent/60 hover:text-win-accent disabled:cursor-wait disabled:opacity-60"
                >
                  <Gauge aria-hidden="true" className="size-3.5" />
                  {copy.canary.button}
                </button>
                <button
                  type="button"
                  data-guide="preview"
                  onClick={previewBranch}
                  disabled={building}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-win-line px-3 py-1.5 text-[0.75rem] font-medium text-win-text hover:border-win-accent/60 hover:text-win-accent disabled:cursor-wait disabled:opacity-60"
                >
                  <GitBranch aria-hidden="true" className="size-3.5" />
                  {copy.preview.button}
                </button>
                <span className="relative">
                  <button
                    type="button"
                    data-guide="broken"
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
                    data-guide="redeploy"
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

              {section !== 'Deployments' ? (
                <div className="scroll-area lg:min-h-0 lg:flex-1">
                  <Insights section={section} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[17rem_minmax(0,1fr)] lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)]">
                  <div className="flex flex-col border-b border-win-line md:border-r md:border-b-0 lg:min-h-0">
                    <p className="px-4 pt-3 pb-1.5 text-[0.6875rem] font-semibold text-win-muted">
                      {copy.list}
                    </p>
                    <ul className="scroll-area pb-2 lg:min-h-0 lg:flex-1">
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
                              {deployment.target === 'canary' ? (
                                <span className="shrink-0 rounded-full bg-warn/15 px-2 py-0.5 text-[0.625rem] font-semibold text-warn">
                                  {copy.canary.badge}
                                </span>
                              ) : null}
                              {deployment.target === 'preview' && !live ? (
                                <span className="shrink-0 rounded-full bg-win-accent/15 px-2 py-0.5 text-[0.625rem] font-semibold text-win-accent">
                                  {copy.preview.badge}
                                </span>
                              ) : null}
                              {live ? (
                                <span className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[0.625rem] font-semibold text-ok">
                                  {copy.live}
                                </span>
                              ) : null}
                            </button>
                            {canRestore && deployment.target === 'preview' ? (
                              <button
                                type="button"
                                data-guide="promote"
                                onClick={() => promoteDeployment(deployment.id)}
                                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-win-accent px-2 py-1 text-[0.6875rem] font-medium text-win hover:opacity-90"
                              >
                                <ArrowUpRight aria-hidden="true" className="size-3" />
                                {copy.preview.promote}
                              </button>
                            ) : null}
                            {canRestore && deployment.target === 'production' ? (
                              <button
                                type="button"
                                data-guide="rollback"
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

                  <div className="flex min-w-0 flex-col lg:min-h-0 lg:overflow-y-auto">
                    {selected?.target === 'canary' ? (
                      <CanaryPanel
                        copy={copy.canary}
                        points={CANARY_POINTS}
                        shown={canary?.id === selected.id ? canary.shown : CANARY_POINTS.length}
                        total={CANARY_POINTS.length}
                      />
                    ) : (
                      <>
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
                        <label className="flex items-center gap-2 border-b border-win-line px-4 py-1.5 text-[0.75rem] text-win-muted focus-within:text-win-text">
                          <Search aria-hidden="true" className="size-3.5" />
                          <input
                            value={logQuery}
                            aria-label="Filter build logs"
                            placeholder="Filter build logs"
                            onChange={(event) => setLogQuery(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent font-mono text-win-text outline-none placeholder:font-sans placeholder:text-win-muted"
                          />
                        </label>
                        <div
                          ref={logRef}
                          aria-live="off"
                          className="scroll-area h-[19rem] py-3 font-mono lg:h-auto lg:min-h-[8rem] lg:flex-1 text-[0.75rem] leading-[1.7]"
                        >
                          {visible
                            .filter(
                              (event) =>
                                logQuery === '' ||
                                event.kind !== 'line' ||
                                event.text.toLowerCase().includes(logQuery.toLowerCase()),
                            )
                            .map((event, index) =>
                              event.kind === 'start' ? (
                                <p
                                  key={index}
                                  className="log-line mt-2 px-4 font-semibold text-win-text first:mt-0"
                                >
                                  ▾ {event.text}
                                </p>
                              ) : event.kind === 'line' ? (
                                <p key={index} className="log-line flex gap-3 px-4 whitespace-pre">
                                  <span className="w-12 shrink-0 text-right text-win-muted">
                                    {seconds(event.at)}s
                                  </span>
                                  <span
                                    className={
                                      event.text.startsWith('$')
                                        ? 'text-win-accent'
                                        : event.text.startsWith('FAIL') ||
                                            event.text.includes('failed')
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
                            <p className="log-line mt-2 px-4 font-sans text-bad">
                              ✕ {copy.broken.failed}
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Window>
        </DesktopWindow>

        <DesktopWindow
          id="preview"
          title="zerno.preview.example"
          className="lg:absolute lg:right-0 lg:bottom-0 lg:w-[38%]"
        >
          <div data-tone="light" className="window relative overflow-hidden">
            <Callout n={3} className="top-12 right-3" />
            <div
              data-drag-handle
              className="flex h-9 items-center gap-2 border-b border-win-line bg-win-raised px-3 text-[0.6875rem] text-win-muted"
            >
              <TrafficLights size="sm" />
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
        </DesktopWindow>
      </div>
    </Showcase>
  );
}
