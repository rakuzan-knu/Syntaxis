import { useRef, useState } from 'react';
import { CircleAlert, CircleX, Info, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { fillTemplate, useAutoplay } from '@/shared/lib';
import { Callout, Hotspot, Showcase, Switch, Window } from '@/shared/ui';
import { ATTACKS, attackLog, isBlocked, type AttackId } from '../model/attacks';
import {
  consoleMessages,
  networkRows,
  type ConsoleLevel,
  type ConsoleMessage,
} from '../model/console';
import { HEADER_VALUES, gradeFor, gradeTone } from '../model/grade';
import { VictimView } from './VictimView';

const INITIAL = ['nosniff'];
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

export function SecurityDemo() {
  const { t } = useI18n();
  const copy = t.security;
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<readonly string[]>(INITIAL);
  const [tab, setTab] = useState<Tab>('Network');
  const [event, setEvent] = useState<Event>({ kind: 'idle' });
  const [run, setRun] = useState(0);

  const { interrupt, touched } = useAutoplay(
    rootRef,
    (later) => {
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
    { amount: 0.35 },
  );

  const toggle = (id: string, on: boolean) => {
    interrupt();
    setEnabled((current) => (on ? [...current, id] : current.filter((item) => item !== id)));
    setEvent({ kind: 'toggle', id, on });
  };

  const attack = (id: AttackId) => {
    interrupt();
    setEvent({ kind: 'attack', id, blocked: isBlocked(id, enabled) });
    setRun((value) => value + 1);
  };

  const grade = gradeFor(enabled.length, copy.headers.length);
  const protectedFromXss = enabled.includes('csp');
  const attackEvent = event.kind === 'attack' ? event : null;
  const messages = attackEvent
    ? [attackLog(attackEvent.id, attackEvent.blocked), ...consoleMessages(enabled)]
    : consoleMessages(enabled);
  const headerName = (id: string) => copy.headers.find((header) => header.id === id)?.name ?? id;
  const attackCopy = (id: AttackId) => copy.attacks.find((item) => item.id === id);
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
  const allOn = enabled.length === copy.headers.length;

  return (
    <Showcase
      id="security"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      caption={caption}
      glossary={copy.glossary}
    >
      <div ref={rootRef} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="order-2 min-w-0 lg:order-1">
          <Window title={copy.window} tone="light">
            <div
              role="tablist"
              aria-label="DevTools"
              className="flex h-9 items-center gap-4 overflow-x-auto overflow-y-hidden border-b border-win-line px-3 text-[0.75rem]"
            >
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => {
                    interrupt();
                    setTab(item);
                  }}
                  className={`shrink-0 cursor-pointer border-b-2 py-2 ${tab === item ? 'border-win-accent text-win-text' : 'border-transparent text-win-muted hover:text-win-text'}`}
                >
                  {item}
                  {item === 'Console' && messages.some((message) => message.level !== 'info') ? (
                    <span className="ml-1.5 rounded-full bg-bad/15 px-1.5 text-[0.625rem] text-bad">
                      {messages.filter((message) => message.level !== 'info').length}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="min-h-[17rem]">
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
                            className={`grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-2 py-0.5 font-mono transition-opacity duration-300 ${on ? '' : 'opacity-40'}`}
                          >
                            <dt className={`truncate ${on ? 'syn-attr' : 'line-through'}`}>
                              {header.name.toLowerCase()}:
                            </dt>
                            <dd className="truncate text-win-text">
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
                <ul className="flex flex-col gap-2 p-4 text-[0.75rem]">
                  {copy.headers.map((header) => {
                    const on = enabled.includes(header.id);
                    return (
                      <li key={header.id} className="flex items-start gap-2.5">
                        {on ? (
                          <ShieldCheck
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-ok"
                          />
                        ) : (
                          <ShieldAlert
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-bad"
                          />
                        )}
                        <span>
                          <span className="font-medium text-win-text">{header.name}</span>
                          <span className="block text-win-muted">{header.description}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {tab === 'Console' ? null : (
              <div className="relative border-t border-win-line">
                <Callout n={3} className="-top-3 right-3" />
                <p className="border-b border-win-line px-3 py-1.5 text-[0.75rem] text-win-text">
                  Console
                </p>
                <ConsoleList messages={messages.slice(0, 3)} />
              </div>
            )}
          </Window>
          <div className="relative mt-4">
            <Callout n={4} className="-top-3 -left-3" />
            <VictimView
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
                <div className="relative grid grid-cols-2 gap-1.5">
                  {ATTACKS.map(({ id }) => (
                    <button
                      key={id}
                      type="button"
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
          </div>
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Window title="Security scan">
            <div className="flex items-center gap-4 border-b border-win-line p-4">
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
            <div className="relative flex flex-col gap-0.5 p-2">
              {copy.headers.map((header) => (
                <Switch
                  key={header.id}
                  checked={enabled.includes(header.id)}
                  onChange={(on) => toggle(header.id, on)}
                  description={header.description}
                >
                  {header.name}
                </Switch>
              ))}
              <Hotspot
                label={copy.hints[0] ?? ''}
                visible={!touched && allOn}
                className="top-8 -left-3"
                side="left"
              />
            </div>
            <p className="flex items-center gap-1.5 border-t border-win-line px-4 py-2.5 font-mono text-[0.6875rem] text-win-muted">
              <CircleAlert aria-hidden="true" className="size-3" />
              {enabled.length} / {copy.headers.length} headers
            </p>
          </Window>
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
