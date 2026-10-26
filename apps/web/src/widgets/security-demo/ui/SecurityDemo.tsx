import { useRef, useState } from 'react';
import { CircleAlert, CircleX, Info, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { fillTemplate, useAutoplay, useDemoCommands } from '@/shared/lib';
import {
  Callout,
  DemoPlayer,
  DesktopWindow,
  GuideCursor,
  Hotspot,
  Showcase,
  Switch,
  Window,
} from '@/shared/ui';
import { ATTACKS, attackLog, isBlocked, type AttackId } from '../model/attacks';
import { VULNERABLE, owaspReport } from '../model/audit';
import {
  consoleMessages,
  networkRows,
  type ConsoleLevel,
  type ConsoleMessage,
} from '../model/console';
import { HEADER_VALUES, gradeFor, gradeTone } from '../model/grade';
import { recordIncident, type Incident } from '../model/incidents';
import { IncidentLog } from './IncidentLog';
import { VictimView } from './VictimView';

const INITIAL = ['nosniff', 'rateLimit', 'sqlParams'];
const TABS = ['Network', 'Console', 'Application', 'Security'] as const;

type Tab = (typeof TABS)[number];
type Event =
  | { kind: 'idle' }
  | { kind: 'toggle'; id: string; on: boolean }
  | { kind: 'attack'; id: AttackId; blocked: boolean };

const LEVEL_STYLE: Record<ConsoleLevel, string> = {
  error: 'bg-bad/[0.07] text-bad',
  warning: 'bg-warn/[0.08] text-warn',
  info: 'text-win-muted',
};

function LevelIcon({ level }: { level: ConsoleLevel }) {
  if (level === 'error') return <CircleX aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />;
  if (level === 'warning')
    return <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />;
  return <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />;
}

const CHAPTERS = [0, 3400, 7400] as const;

export function SecurityDemo() {
  const { t } = useI18n();
  const copy = t.security;
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<readonly string[]>(INITIAL);
  const [tab, setTab] = useState<Tab>('Network');
  const [event, setEvent] = useState<Event>({ kind: 'idle' });
  const [run, setRun] = useState(0);
  const [fixed, setFixed] = useState<readonly string[]>([]);
  const [incidents, setIncidents] = useState<readonly Incident[]>([]);
  const incidentId = useRef(0);

  const reset = () => {
    setEnabled(INITIAL);
    setTab('Network');
    setEvent({ kind: 'idle' });
    setRun(0);
    setFixed([]);
    setIncidents([]);
    incidentId.current = 0;
  };

  const { interrupt, touched, player } = useAutoplay(
    rootRef,
    (later) => {
      const [, attackAt = 0, exposedAt = 0] = CHAPTERS;
      later(() => undefined, attackAt, { target: '[data-guide="attack-xss"]', press: true });
      later(() => undefined, attackAt + 1800, {
        target: '[data-guide="attack-clickjack"]',
        press: true,
      });
      later(() => undefined, exposedAt, { target: '[data-guide="switch-csp"]', press: true });
      later(() => undefined, exposedAt + 1500, {
        target: '[data-guide="attack-xss"]',
        press: true,
      });
      later(() => undefined, exposedAt + 3300, {
        target: '[data-guide="tab-Console"]',
        press: true,
      });
      later(() => undefined, exposedAt + 5200, {
        target: '[data-guide="switch-csp"]',
        press: true,
      });
      copy.headers.forEach((header, index) => {
        later(
          () =>
            setEnabled((current) =>
              current.includes(header.id) ? current : [...current, header.id],
            ),
          700 + index * 380,
        );
      });
    },
    { reset, chapters: CHAPTERS },
  );

  useDemoCommands('security', player);

  const toggle = (id: string, on: boolean) => {
    interrupt();
    setEnabled((current) => (on ? [...current, id] : current.filter((item) => item !== id)));
    setEvent({ kind: 'toggle', id, on });
  };

  const attack = (id: AttackId) => {
    interrupt();
    const blocked = isBlocked(id, enabled);
    incidentId.current += 1;
    const next = incidentId.current;
    setEvent({ kind: 'attack', id, blocked });
    setRun((value) => value + 1);
    setIncidents((current) => recordIncident(current, id, blocked, next, new Date()));
  };

  const headerIds = copy.headers.map((header) => header.id);
  const grade = gradeFor(
    enabled.filter((id) => headerIds.includes(id)).length,
    copy.headers.length,
  );
  const report = owaspReport(enabled, copy.headers.length, fixed);
  const protectedFromXss = enabled.includes('csp');
  const attackEvent = event.kind === 'attack' ? event : null;
  const messages = attackEvent
    ? [attackLog(attackEvent.id, attackEvent.blocked), ...consoleMessages(enabled)]
    : consoleMessages(enabled);
  const headerName = (id: string) =>
    [...copy.headers, ...copy.server.items].find((header) => header.id === id)?.name ?? id;
  const attackCopy = (id: AttackId) =>
    [...copy.attacks, ...copy.serverAttacks].find((item) => item.id === id);
  const caption =
    event.kind === 'toggle'
      ? fillTemplate(copy.plain[event.on ? 'on' : 'off'], { name: headerName(event.id), grade })
      : event.kind === 'attack'
        ? fillTemplate(copy.plain[event.blocked ? 'blocked' : 'succeeded'], {
            name: attackCopy(event.id)?.name ?? '',
            result: attackCopy(event.id)?.[event.blocked ? 'blocked' : 'succeeded'] ?? '',
          })
        : copy.plain.idle;
  const rows = networkRows(enabled);
  const allOn = headerIds.every((id) => enabled.includes(id));

  return (
    <Showcase
      id="security"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      caption={caption}
      glossary={copy.glossary}
      player={<DemoPlayer player={player} labels={copy.chapters} />}
    >
      <div
        ref={rootRef}
        className="relative grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_21rem] lg:grid-rows-[minmax(0,1fr)]"
      >
        <GuideCursor cursor={player.cursor} name={t.ui.player.guide} />
        <div className="scroll-area order-2 min-w-0 lg:order-1 lg:-m-3 lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:p-3">
          <DesktopWindow id="devtools" title={copy.window} className="lg:min-h-52 lg:flex-1">
            <Window title={copy.window} tone="light" className="h-full">
              <div className="flex h-full flex-col">
                <div
                  role="tablist"
                  aria-label="DevTools"
                  className="flex h-9 shrink-0 items-center gap-4 overflow-x-auto overflow-y-hidden border-b border-win-line px-3 text-[0.75rem]"
                >
                  {TABS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      data-guide={`tab-${item}`}
                      aria-selected={tab === item}
                      onClick={() => {
                        interrupt();
                        setTab(item);
                      }}
                      className={`shrink-0 cursor-pointer border-b-2 py-2 ${tab === item ? 'border-win-accent text-win-text' : 'border-transparent text-win-muted hover:text-win-text'}`}
                    >
                      {item}
                      {item === 'Console' &&
                      messages.some((message) => message.level !== 'info') ? (
                        <span className="ml-1.5 rounded-full bg-bad/15 px-1.5 text-[0.625rem] text-bad">
                          {messages.filter((message) => message.level !== 'info').length}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div role="tabpanel" className="scroll-area min-h-[17rem] lg:min-h-20 lg:flex-1">
                  {tab === 'Network' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                      <div className="relative overflow-x-auto border-b border-win-line xl:border-r xl:border-b-0">
                        <Callout n={1} className="top-1 right-2" />
                        <table className="w-full min-w-[30rem] text-left text-[0.75rem]">
                          <thead className="border-b border-win-line text-win-muted">
                            <tr>
                              {['Name', 'Status', 'Type', 'Size', 'Time'].map((column) => (
                                <th key={column} scope="col" className="px-3 py-1.5 font-normal">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="font-mono text-[0.6875rem]">
                            {rows.map((row, index) => (
                              <tr
                                key={row.name}
                                className={`${index === 0 ? 'bg-win-accent/10' : index % 2 ? 'bg-win-raised/60' : ''} ${row.blocked ? 'text-bad' : ''}`}
                              >
                                <td className="max-w-40 truncate px-3 py-1.5 whitespace-nowrap">
                                  {row.name}
                                </td>
                                <td className="px-3 py-1.5 whitespace-nowrap">{row.status}</td>
                                <td className="px-3 py-1.5 text-win-muted">{row.type}</td>
                                <td className="px-3 py-1.5 whitespace-nowrap text-win-muted">
                                  {row.size}
                                </td>
                                <td className="px-3 py-1.5 whitespace-nowrap text-win-muted">
                                  {row.time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="relative">
                        <Callout n={2} className="top-1 right-2" />
                        <p className="px-3 pt-2 pb-1 text-[0.6875rem] font-semibold text-win-text">
                          ▾ {copy.responseLabel}
                        </p>
                        <dl className="px-3 pb-2 text-[0.6875rem]">
                          {copy.headers.map((header) => {
                            const on = enabled.includes(header.id);
                            return (
                              <div
                                key={header.id}
                                className={`grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-2 py-0.5 font-mono transition-colors duration-300`}
                              >
                                <dt
                                  className={`truncate ${on ? 'syn-attr' : 'text-win-muted line-through'}`}
                                >
                                  {header.name.toLowerCase()}:
                                </dt>
                                <dd
                                  className={`truncate ${on ? 'text-win-text' : 'text-win-muted'}`}
                                >
                                  {on ? HEADER_VALUES[header.id] : '(not set)'}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </div>
                    </div>
                  ) : tab === 'Console' ? (
                    <ConsoleList messages={messages} />
                  ) : tab === 'Application' ? (
                    <table className="w-full text-left font-mono text-[0.6875rem]">
                      <thead className="border-b border-win-line font-sans text-win-muted">
                        <tr>
                          {['Name', 'Value', 'HttpOnly', 'Secure', 'SameSite'].map((column) => (
                            <th key={column} scope="col" className="px-3 py-1.5 font-normal">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['session', '8f2c…a91', '✓', enabled.includes('hsts') ? '✓' : '', 'Lax'],
                          ['cart', '[2 items]', '', enabled.includes('hsts') ? '✓' : '', 'Lax'],
                          ['locale', 'uk', '', '', 'Lax'],
                        ].map((cookie) => (
                          <tr key={cookie[0]} className="border-b border-win-line/60">
                            {cookie.map((cell, index) => (
                              <td
                                key={index}
                                className={`px-3 py-1.5 ${index > 1 && cell === '' ? 'text-bad' : ''}`}
                              >
                                {cell === '' && index > 1 && index < 4 ? '✕' : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="grid gap-4 p-4 text-[0.75rem] xl:grid-cols-2">
                      <div>
                        <p className="mb-2 font-semibold text-win-text">{copy.audit.owasp}</p>
                        <ul className="flex flex-col gap-1">
                          {report.map((item) => (
                            <li key={item.id} className="flex items-center gap-2">
                              {item.state === 'pass' ? (
                                <ShieldCheck
                                  aria-hidden="true"
                                  className="size-3.5 shrink-0 text-ok"
                                />
                              ) : (
                                <ShieldAlert
                                  aria-hidden="true"
                                  className="size-3.5 shrink-0 text-bad"
                                />
                              )}
                              <span className="w-8 shrink-0 font-mono text-win-muted">
                                {item.id}
                              </span>
                              <span
                                className={item.state === 'pass' ? 'text-win-text' : 'text-bad'}
                              >
                                {item.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="font-semibold text-win-text">{copy.audit.title}</p>
                          {fixed.length < VULNERABLE.length ? (
                            <button
                              type="button"
                              onClick={() => {
                                interrupt();
                                setFixed(VULNERABLE.map((dependency) => dependency.name));
                              }}
                              className="cursor-pointer rounded-md bg-win-accent px-2 py-1 text-[0.6875rem] font-medium text-white hover:opacity-90"
                            >
                              {copy.audit.fixAll}
                            </button>
                          ) : null}
                        </div>
                        {fixed.length >= VULNERABLE.length ? (
                          <p className="flex items-center gap-1.5 text-ok">
                            <ShieldCheck aria-hidden="true" className="size-3.5" />
                            {copy.audit.clean}
                          </p>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {VULNERABLE.filter(
                              (dependency) => !fixed.includes(dependency.name),
                            ).map((dependency) => (
                              <li
                                key={dependency.name}
                                className="ink-in rounded-md border border-win-line p-2"
                              >
                                <p className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-win-text">
                                    {dependency.name}@{dependency.current}
                                  </span>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase ${dependency.severity === 'moderate' ? 'bg-warn/15 text-warn' : 'bg-bad/15 text-bad'}`}
                                  >
                                    {dependency.severity}
                                  </span>
                                </p>
                                <p className="mt-1 text-win-muted">{dependency.issue}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    interrupt();
                                    setFixed((current) => [...current, dependency.name]);
                                  }}
                                  className="mt-1.5 cursor-pointer rounded border border-win-line px-2 py-0.5 text-[0.6875rem] text-win-text hover:border-win-accent hover:text-win-accent"
                                >
                                  {copy.audit.fix} → {dependency.fixed}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {tab === 'Console' ? null : (
                  <div className="relative border-t border-win-line lg:flex lg:min-h-18 lg:flex-col">
                    <Callout n={3} className="-top-3 right-3" />
                    <p className="shrink-0 border-b border-win-line px-3 py-1.5 text-[0.75rem] text-win-text">
                      Console
                    </p>
                    <div className="scroll-area lg:min-h-0">
                      <ConsoleList messages={messages.slice(0, 3)} />
                    </div>
                  </div>
                )}
              </div>
            </Window>
          </DesktopWindow>
          <DesktopWindow
            id="victim"
            title={copy.victim.title}
            className="relative mt-4 lg:mt-0 lg:shrink-0"
          >
            <Callout n={4} className="-top-3 -left-3" />
            <VictimView
              scenes={copy.scenes}
              copy={copy.victim}
              attack={attackEvent?.id ?? null}
              blocked={attackEvent?.blocked ?? false}
              run={run}
              brand={t.build.demo.brand}
              pay={t.build.demo.checkout.place}
            >
              <div className="border-b border-win-line p-3">
                <p className="mb-2 text-[0.75rem] font-semibold text-win-text">
                  {copy.attackLabel}
                </p>
                <div className="relative grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {ATTACKS.map(({ id }) => (
                    <button
                      key={id}
                      type="button"
                      data-guide={`attack-${id}`}
                      onClick={() => attack(id)}
                      className={`cursor-pointer rounded-lg px-2.5 py-2 text-left text-[0.75rem] font-medium transition-colors ${attackEvent?.id === id ? (attackEvent.blocked ? 'bg-ok text-white' : 'bg-bad text-white') : 'bg-win-raised text-win-text hover:bg-win-line'}`}
                    >
                      {attackCopy(id)?.name}
                    </button>
                  ))}
                  <Hotspot
                    label={copy.hints[1] ?? ''}
                    visible={touched && event.kind === 'toggle' && !event.on}
                    className="top-1/2 -left-3 -mt-1.5"
                    side="left"
                  />
                </div>
              </div>
            </VictimView>
          </DesktopWindow>
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2 lg:min-h-0">
          <DesktopWindow id="scan" title="Security scan" className="lg:min-h-0 lg:flex-1">
            <Window title="Security scan" className="h-full">
              <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center gap-4 border-b border-win-line p-4">
                  <div
                    className={`grid size-16 shrink-0 place-items-center rounded-xl bg-win-raised font-mono text-[1.75rem] font-semibold transition-colors duration-500 ${gradeTone(grade)}`}
                  >
                    <span key={grade} className="ink-in" aria-live="polite">
                      <span className="sr-only">{copy.gradeLabel}: </span>
                      {grade}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.6875rem] text-win-muted">{copy.gradeLabel}</p>
                    <p
                      className={`mt-1 flex items-start gap-1.5 text-[0.8125rem] font-medium ${protectedFromXss ? 'text-ok' : 'text-bad'}`}
                    >
                      {protectedFromXss ? (
                        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      )}
                      {protectedFromXss ? copy.blocked : copy.exposed}
                    </p>
                  </div>
                </div>
                <div className="scroll-area relative flex flex-col gap-0.5 p-2 lg:min-h-0 lg:flex-1">
                  {copy.headers.map((header) => (
                    <Switch
                      guide={`switch-${header.id}`}
                      key={header.id}
                      checked={enabled.includes(header.id)}
                      onChange={(on) => toggle(header.id, on)}
                      description={header.description}
                    >
                      {header.name}
                    </Switch>
                  ))}
                  <p className="px-3 pt-3 pb-1 text-[0.6875rem] font-semibold text-win-muted">
                    {copy.server.title}
                  </p>
                  {copy.server.items.map((item) => (
                    <Switch
                      key={item.id}
                      guide={`switch-${item.id}`}
                      checked={enabled.includes(item.id)}
                      onChange={(on) => toggle(item.id, on)}
                      description={item.description}
                    >
                      {item.name}
                    </Switch>
                  ))}
                  <Hotspot
                    label={copy.hints[0] ?? ''}
                    visible={!touched && allOn}
                    className="top-8 left-0"
                    side="left"
                  />
                </div>
                <p className="flex shrink-0 items-center gap-1.5 border-t border-win-line px-4 py-2.5 font-mono text-[0.6875rem] text-win-muted">
                  <CircleAlert aria-hidden="true" className="size-3" />
                  {enabled.filter((id) => headerIds.includes(id)).length} / {copy.headers.length}{' '}
                  headers
                </p>
              </div>
            </Window>
          </DesktopWindow>
          <DesktopWindow id="incidents" title={copy.incidents.title} className="lg:shrink-0">
            <Window title={copy.incidents.title}>
              <IncidentLog
                copy={copy.incidents}
                incidents={incidents}
                attackName={(incident) => attackCopy(incident.attack)?.name ?? incident.attack}
                guardName={headerName}
              />
            </Window>
          </DesktopWindow>
        </div>
      </div>
    </Showcase>
  );
}

function ConsoleList({ messages }: { messages: readonly ConsoleMessage[] }) {
  return (
    <ul aria-live="polite" className="min-h-[5.5rem] font-mono text-[0.6875rem] leading-[1.6]">
      {messages.map((message) => (
        <li
          key={message.text}
          className={`log-line flex gap-2 border-b border-win-line/70 px-3 py-1.5 ${LEVEL_STYLE[message.level]}`}
        >
          <LevelIcon level={message.level} />
          <span className="min-w-0 flex-1 break-words">{message.text}</span>
          <span className="hidden shrink-0 text-win-muted underline sm:inline">
            {message.source}
          </span>
        </li>
      ))}
    </ul>
  );
}
