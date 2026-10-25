import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, CircleX, Plus, Trash2, TriangleAlert, X } from 'lucide-react';
import type { Problem } from '../../model/problems';
import { FileIcon } from './FileIcon';

export type PanelTab = 'problems' | 'output' | 'debug' | 'terminal' | 'ports';

const TABS: readonly { id: PanelTab; label: string }[] = [
  { id: 'problems', label: 'PROBLEMS' },
  { id: 'output', label: 'OUTPUT' },
  { id: 'debug', label: 'DEBUG CONSOLE' },
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'ports', label: 'PORTS' },
];

type Channel = 'Vite' | 'ESLint' | 'Prettier' | 'Git';

interface BottomPanelProps {
  tab: PanelTab;
  maximized: boolean;
  problems: readonly Problem[];
  log: readonly string[];
  gitLog: readonly string[];
  onTab: (tab: PanelTab) => void;
  onProblem: (problem: Problem) => void;
  onCommand: (command: string) => void;
  onClear: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-6 cursor-pointer place-items-center rounded text-win-muted transition-colors hover:bg-win-raised hover:text-win-text"
    >
      {children}
    </button>
  );
}

function TerminalLine({ entry }: { entry: string }) {
  if (entry.startsWith('$ ')) return <span className="text-win-text">{entry}</span>;
  if (entry.includes('[vite]')) {
    const file = entry.indexOf('/src');
    return (
      <>
        <span className="text-win-muted">{entry.slice(0, 8)}</span>{' '}
        <span className="syn-tag">[vite]</span>
        <span className="text-win-text">{entry.slice(entry.indexOf(']') + 1, file)}</span>
        <span className="text-win-muted">{entry.slice(file)}</span>
      </>
    );
  }
  if (entry.includes('VITE') || entry.includes('✓') || entry.includes('✔')) {
    return <span className="text-ok">{entry}</span>;
  }
  if (entry.includes('✖') || entry.includes('not found'))
    return <span className="text-bad">{entry}</span>;
  return <span className="text-win-muted">{entry || ' '}</span>;
}

export function BottomPanel({
  tab,
  maximized,
  problems,
  log,
  gitLog,
  onTab,
  onProblem,
  onCommand,
  onClear,
  onToggleMaximize,
  onClose,
}: BottomPanelProps) {
  const [channel, setChannel] = useState<Channel>('Vite');
  const [command, setCommand] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hmr = log.filter((entry) => entry.includes('[vite]'));

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [log, tab]);

  const output: Record<Channel, readonly string[]> = {
    Vite: hmr.length > 0 ? hmr : ['[vite] connected.'],
    ESLint: [
      '[Info] ESLint server is running.',
      problems.length === 0
        ? '[Info] src/widgets/hero/Hero.tsx: no problems'
        : `[Warn] src/widgets/hero/Hero.tsx: ${problems.length} problem(s)`,
    ],
    Prettier: hmr.length
      ? hmr.map((entry) => `["INFO" - ${entry.slice(0, 8)}] Formatting src/widgets/hero/Hero.tsx`)
      : ['["INFO"] Using config file at .prettierrc.json'],
    Git: gitLog.length ? gitLog : ['> git status -z -uall', '> git log --oneline -1'],
  };

  return (
    <div
      className={`flex min-h-0 flex-col border-t border-win-line ${maximized ? 'flex-1' : 'h-40 shrink-0'}`}
    >
      <div className="flex h-8 shrink-0 items-center gap-0.5 pr-1.5 pl-1.5">
        <div
          role="tablist"
          aria-label="Panel"
          className="scrollbar-none flex min-w-0 flex-1 gap-0.5 overflow-x-auto"
        >
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTab(item.id)}
                className={`shrink-0 cursor-pointer items-center gap-1.5 border-b px-1.5 py-1 text-[0.6875rem] tracking-wide transition-colors ${item.id === 'debug' || item.id === 'ports' ? 'hidden @[36rem]:flex' : item.id === 'output' ? 'hidden @[22rem]:flex' : 'flex'} ${selected ? 'border-win-text text-win-text' : 'border-transparent text-win-muted hover:text-win-text'}`}
              >
                {item.label}
                {item.id === 'problems' && problems.length > 0 ? (
                  <span className="rounded-full bg-win-raised px-1.5 text-[0.625rem]">
                    {problems.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {tab === 'output' ? (
          <label className="hidden items-center sm:flex">
            <span className="sr-only">Output channel</span>
            <select
              value={channel}
              onChange={(event) => {
                const value = event.target.value;
                if (
                  value === 'Vite' ||
                  value === 'ESLint' ||
                  value === 'Prettier' ||
                  value === 'Git'
                ) {
                  setChannel(value);
                }
              }}
              className="cursor-pointer rounded border border-win-line bg-win-raised px-1.5 py-0.5 text-[0.6875rem] text-win-text"
            >
              {(['Vite', 'ESLint', 'Prettier', 'Git'] as const).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {tab === 'terminal' ? (
          <>
            <IconButton label="New Terminal" onClick={() => inputRef.current?.focus()}>
              <Plus aria-hidden="true" className="size-3.5" />
            </IconButton>
            <IconButton label="Clear Terminal" onClick={onClear}>
              <Trash2 aria-hidden="true" className="size-3.5" />
            </IconButton>
          </>
        ) : null}
        <IconButton
          label={maximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
          onClick={onToggleMaximize}
        >
          {maximized ? (
            <ChevronDown aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronUp aria-hidden="true" className="size-3.5" />
          )}
        </IconButton>
        <IconButton label="Hide Panel" onClick={onClose}>
          <X aria-hidden="true" className="size-3.5" />
        </IconButton>
      </div>

      <div
        ref={scrollRef}
        role="tabpanel"
        aria-label={tab}
        className="min-h-0 flex-1 overflow-y-auto pb-2 font-mono text-[0.75rem] leading-[1.6]"
        onClick={() => {
          if (tab === 'terminal') inputRef.current?.focus();
        }}
      >
        {tab === 'problems' ? (
          problems.length === 0 ? (
            <p className="px-4 pt-1 font-sans text-win-muted">
              No problems have been detected in the workspace.
            </p>
          ) : (
            <ul className="font-sans text-[0.8125rem]">
              <li className="flex items-center gap-1.5 px-3 py-0.5 text-win-text">
                <ChevronDown aria-hidden="true" className="size-3.5" />
                <FileIcon name="Hero.tsx" />
                Hero.tsx
                <span className="text-[0.6875rem] text-win-muted">src/widgets/hero</span>
                <span className="rounded-full bg-win-raised px-1.5 text-[0.625rem]">
                  {problems.length}
                </span>
              </li>
              {problems.map((problem) => (
                <li key={problem.message}>
                  <button
                    type="button"
                    onClick={() => onProblem(problem)}
                    className="flex w-full cursor-pointer items-start gap-2 py-0.5 pr-3 pl-9 text-left transition-colors hover:bg-win-raised"
                  >
                    {problem.severity === 'error' ? (
                      <CircleX aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-bad" />
                    ) : (
                      <TriangleAlert
                        aria-hidden="true"
                        className="mt-0.5 size-3.5 shrink-0 text-warn"
                      />
                    )}
                    <span className="min-w-0 text-win-text">
                      {problem.message}{' '}
                      <span className="text-win-muted">
                        {problem.source} [Ln {problem.line}, Col {problem.column}]
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : tab === 'output' ? (
          <div className="px-4">
            {output[channel].map((entry, index) => (
              <p key={`${index}-${entry}`} className="truncate whitespace-pre text-win-muted">
                {entry}
              </p>
            ))}
          </div>
        ) : tab === 'debug' ? (
          <p className="px-4 font-sans text-win-muted">
            Debug console is active when a debug session is running. Press F5 to start debugging.
          </p>
        ) : tab === 'ports' ? (
          <table className="w-full font-sans text-[0.75rem]">
            <thead className="text-left text-win-muted">
              <tr>
                {['Port', 'Forwarded Address', 'Running Process', 'Origin'].map((column) => (
                  <th key={column} scope="col" className="px-4 py-1 font-normal">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="text-win-text transition-colors hover:bg-win-raised">
                <td className="px-4 py-1">
                  <span className="mr-1.5 inline-block size-2 rounded-full bg-ok" />
                  5173
                </td>
                <td className="px-4 py-1 text-win-accent underline">localhost:5173</td>
                <td className="px-4 py-1 font-mono text-win-muted">node vite</td>
                <td className="px-4 py-1 text-win-muted">Auto Forwarded</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div aria-live="polite" className="px-4">
            {log.map((entry, index) => (
              <p key={`${index}-${entry}`} className="log-line whitespace-pre-wrap break-all">
                <TerminalLine entry={entry} />
              </p>
            ))}
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onCommand(command);
                setCommand('');
              }}
            >
              <span className="shrink-0 text-ok">zerno-coffee</span>
              <span className="shrink-0 text-win-accent">main</span>
              <span className="shrink-0 text-win-muted">$</span>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Terminal input</span>
                <input
                  ref={inputRef}
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="help"
                  className="w-full bg-transparent text-win-text caret-win-text outline-none placeholder:text-win-muted/60"
                />
              </label>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
