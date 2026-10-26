import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, Command, Keyboard, Play, Search, X } from 'lucide-react';
import { localePath, useI18n } from '@/shared/i18n';
import { runCommand, telegramLink } from '@/shared/lib';
import {
  OPEN_PALETTE_EVENT,
  buildCommands,
  filterCommands,
  otherLocale,
  type CommandGroup,
  type PaletteCommand,
} from '../model/commands';

type View = 'palette' | 'shortcuts' | null;

const REVEAL_TIMEOUT = 4000;
const REVEAL_POLL = 150;

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function reveal(target: string, then?: () => void) {
  if (target === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    then?.();
    return;
  }
  const started = performance.now();
  const attempt = () => {
    const element = document.getElementById(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      then?.();
      return;
    }
    document.getElementById('work')?.scrollIntoView({ block: 'start' });
    if (performance.now() - started < REVEAL_TIMEOUT) window.setTimeout(attempt, REVEAL_POLL);
  };
  attempt();
}

function Keys({ keys }: { keys: readonly string[] }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-6 rounded-md border border-line bg-bg px-1.5 py-0.5 text-center font-mono text-[0.6875rem] text-muted shadow-[0_1px_0_var(--line)]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export function CommandPalette() {
  const { t, locale } = useI18n();
  const copy = t.ui.palette;
  const id = useId();
  const [view, setView] = useState<View>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const commands = useMemo(
    () =>
      buildCommands({
        t,
        otherLocalePath: localePath(otherLocale(locale)),
        telegram: telegramLink(),
      }),
    [t, locale],
  );
  const results = filterCommands(commands, query);
  const groups: readonly CommandGroup[] = ['demo', 'go', 'other'];
  const ordered = groups.flatMap((group) => results.filter((item) => item.group === group));

  const close = () => {
    setView(null);
    returnFocus.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const remember = () => {
      if (document.activeElement instanceof HTMLElement)
        returnFocus.current = document.activeElement;
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        remember();
        setView((current) => (current === 'palette' ? null : 'palette'));
        setQuery('');
        setActive(0);
        return;
      }
      if (event.key === '?' && !mod && !isTyping(event.target)) {
        event.preventDefault();
        remember();
        setView('shortcuts');
      }
    };
    const onOpen = () => {
      remember();
      setQuery('');
      setActive(0);
      setView('palette');
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (view === 'palette') inputRef.current?.focus({ preventScroll: true });
  }, [view]);

  const execute = (command: PaletteCommand) => {
    const { action } = command;
    if (action.type === 'shortcuts') {
      setView('shortcuts');
      return;
    }
    setView(null);
    if (action.type === 'link') {
      if (action.external) window.open(action.href, '_blank', 'noopener,noreferrer');
      else window.location.assign(action.href);
      return;
    }
    if (action.type === 'scroll') {
      reveal(action.target);
      return;
    }
    reveal(action.target, () => runCommand(action.command));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (view !== 'palette') return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + ordered.length) % Math.max(ordered.length, 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = ordered[active];
      if (command) execute(command);
    }
  };

  useEffect(() => {
    if (view !== 'palette') return;
    document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id, view]);

  if (!view) return null;

  const groupLabel: Record<CommandGroup, string> = copy.groups;
  let index = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-3 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={onKeyDown}
    >
      {view === 'palette' ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          className="ink-in w-full max-w-[38rem] overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={ordered[active] ? `${id}-option-${active}` : undefined}
              aria-label={copy.title}
              value={query}
              placeholder={copy.placeholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              className="h-14 min-w-0 flex-1 bg-transparent text-step-0 outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={close}
              aria-label={copy.hints.close}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div id={`${id}-list`} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {ordered.length === 0 ? (
              <p className="px-3 py-6 text-center text-step--1 text-muted">{copy.empty}</p>
            ) : (
              groups.map((group) => {
                const items = ordered.filter((item) => item.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} role="group" aria-label={groupLabel[group]} className="mb-1">
                    <p className="px-3 pt-2 pb-1 text-step--2 font-medium text-faint">
                      {groupLabel[group]}
                    </p>
                    {items.map((command) => {
                      index += 1;
                      const position = index;
                      const selected = position === active;
                      const Icon =
                        command.group === 'demo'
                          ? Play
                          : command.action.type === 'shortcuts'
                            ? Keyboard
                            : ArrowRight;
                      return (
                        <div
                          key={command.id}
                          id={`${id}-option-${position}`}
                          role="option"
                          aria-selected={selected}
                          onMouseMove={() => setActive(position)}
                          onClick={() => execute(command)}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-step--1 ${selected ? 'bg-accent-soft text-ink' : 'text-ink'}`}
                        >
                          <Icon
                            aria-hidden="true"
                            className={`size-4 shrink-0 ${selected ? 'text-accent' : 'text-faint'}`}
                          />
                          <span className="min-w-0 flex-1 truncate">{command.label}</span>
                          {command.detail ? (
                            <span className="shrink-0 text-step--2 text-muted">
                              {command.detail}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-step--2 text-muted">
            <span className="flex items-center gap-1.5">
              <Keys keys={['↑', '↓']} /> {copy.hints.move}
            </span>
            <span className="flex items-center gap-1.5">
              <Keys keys={['Enter']} /> {copy.hints.run}
            </span>
            <span className="flex items-center gap-1.5">
              <Keys keys={['Esc']} /> {copy.hints.close}
            </span>
          </div>
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.ui.shortcuts.title}
          className="ink-in w-full max-w-[34rem] rounded-2xl border border-line bg-surface p-5 text-ink shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-step-0 font-semibold">
              <Command aria-hidden="true" className="size-4" />
              {t.ui.shortcuts.title}
            </p>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label={t.ui.shortcuts.close}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <ul className="flex flex-col gap-2.5">
            {t.ui.shortcuts.items.map((item) => (
              <li key={item.text} className="flex items-center justify-between gap-4 text-step--1">
                <span className="text-muted">{item.text}</span>
                <Keys keys={item.keys} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PaletteTrigger() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      aria-label={t.ui.palette.open}
      className="hidden cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-step--1 text-muted transition-colors hover:border-faint hover:text-ink md:inline-flex"
    >
      <Search aria-hidden="true" className="size-4" />
      <span className="hidden xl:inline">{t.ui.palette.open}</span>
      <Keys keys={['Ctrl', 'K']} />
    </button>
  );
}
