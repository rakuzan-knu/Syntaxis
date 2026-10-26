import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Replace, X } from 'lucide-react';
import { useDismiss } from '@/shared/lib';
import type { SymbolInfo } from '../../model/symbols';
import { FileIcon } from './FileIcon';

export interface Point {
  x: number;
  y: number;
}

const KIND_TONE: Record<SymbolInfo['kind'], string> = {
  function: 'text-[#dcdcaa]',
  const: 'text-[#9cdcfe]',
  interface: 'text-[#4ec9b0]',
  parameter: 'text-[#9cdcfe]',
};

export function HoverCard({ symbol, at }: { symbol: SymbolInfo; at: Point }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-40 w-[min(26rem,calc(100%-1rem))] rounded-md border border-win-line bg-win-raised font-mono text-[0.75rem] shadow-xl"
      style={{ left: Math.max(8, at.x), top: at.y }}
    >
      <p className={`border-b border-win-line px-3 py-2 break-words ${KIND_TONE[symbol.kind]}`}>
        {symbol.signature}
      </p>
      <p className="px-3 py-2 font-sans text-win-muted">{symbol.doc}</p>
      {symbol.definition ? (
        <p className="border-t border-win-line px-3 py-1.5 font-sans text-[0.6875rem] text-win-muted">
          Ctrl + Click · Go to Definition
        </p>
      ) : null}
    </div>
  );
}

export interface MenuItem {
  label: string;
  keys?: string;
  disabled?: boolean;
  run: () => void;
}

export function ContextMenu({
  at,
  items,
  onClose,
}: {
  at: Point;
  items: readonly MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, true, onClose);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute z-50 min-w-56 rounded-md border border-win-line bg-win-raised py-1 font-sans text-[0.8125rem] shadow-2xl"
      style={{ left: at.x, top: at.y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.run();
            onClose();
          }}
          className="flex w-full cursor-pointer items-center justify-between gap-6 px-3 py-1.5 text-left text-win-text hover:bg-win-accent hover:text-white focus-visible:bg-win-accent focus-visible:text-white focus-visible:outline-none disabled:cursor-default disabled:text-win-muted disabled:hover:bg-transparent"
        >
          {item.label}
          {item.keys ? <span className="text-[0.6875rem] opacity-70">{item.keys}</span> : null}
        </button>
      ))}
    </div>
  );
}

interface FindWidgetProps {
  query: string;
  replacement: string;
  count: number;
  current: number;
  canReplace: boolean;
  onQuery: (value: string) => void;
  onReplacement: (value: string) => void;
  onStep: (direction: 1 | -1) => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export function FindWidget({
  query,
  replacement,
  count,
  current,
  canReplace,
  onQuery,
  onReplacement,
  onStep,
  onReplaceAll,
  onClose,
}: FindWidgetProps) {
  const [replaceOpen, setReplaceOpen] = useState(false);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onStep(event.shiftKey ? -1 : 1);
    }
    if (event.key === 'Escape') onClose();
  };

  const field =
    'h-6 min-w-0 flex-1 rounded-sm border border-win-line bg-win px-1.5 text-[0.75rem] text-win-text outline-none focus:border-win-accent';
  const icon =
    'grid size-6 shrink-0 cursor-pointer place-items-center rounded text-win-muted hover:bg-win-line hover:text-win-text disabled:cursor-default disabled:opacity-40';

  return (
    <div className="absolute top-1 right-4 z-40 flex w-[min(24rem,calc(100%-2rem))] gap-1 rounded-md border border-win-line bg-win-raised p-1.5 font-sans shadow-xl">
      <button
        type="button"
        aria-label="Toggle Replace"
        aria-expanded={replaceOpen}
        onClick={() => setReplaceOpen((value) => !value)}
        className={icon}
      >
        <ChevronRight
          aria-hidden="true"
          className={`size-3.5 transition-transform ${replaceOpen ? 'rotate-90' : ''}`}
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            autoFocus
            aria-label="Find"
            placeholder="Find"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={onKeyDown}
            className={field}
          />
          <span className="w-16 shrink-0 text-center text-[0.6875rem] text-win-muted tabular-nums">
            {query === '' ? '' : count === 0 ? 'No results' : `${current + 1} of ${count}`}
          </span>
          <button
            type="button"
            aria-label="Previous Match"
            disabled={count === 0}
            onClick={() => onStep(-1)}
            className={icon}
          >
            <ArrowUp aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next Match"
            disabled={count === 0}
            onClick={() => onStep(1)}
            className={icon}
          >
            <ArrowDown aria-hidden="true" className="size-3.5" />
          </button>
          <button type="button" aria-label="Close" onClick={onClose} className={icon}>
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </div>
        {replaceOpen ? (
          <div className="flex items-center gap-1">
            <input
              aria-label="Replace"
              placeholder="Replace"
              value={replacement}
              onChange={(event) => onReplacement(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onReplaceAll();
                if (event.key === 'Escape') onClose();
              }}
              className={field}
            />
            <button
              type="button"
              aria-label="Replace All"
              title={canReplace ? 'Replace All' : 'Only the headline and button text are editable'}
              disabled={!canReplace || count === 0}
              onClick={onReplaceAll}
              className={icon}
            >
              <Replace aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface QuickOpenProps {
  query: string;
  results: readonly string[];
  onQuery: (value: string) => void;
  onOpen: (path: string) => void;
  onClose: () => void;
}

export function QuickOpen({ query, results, onQuery, onOpen, onClose }: QuickOpenProps) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, true, onClose);
  const shown = results.slice(0, 8);

  return (
    <div
      ref={ref}
      className="absolute top-1 left-1/2 z-50 w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 rounded-md border border-win-line bg-win-raised p-1.5 font-sans shadow-2xl"
    >
      <input
        autoFocus
        aria-label="Go to File"
        placeholder="Search files by name"
        value={query}
        onChange={(event) => {
          onQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setActive((current) => (current + step + shown.length) % Math.max(shown.length, 1));
          }
          if (event.key === 'Enter') {
            const path = shown[active];
            if (path) onOpen(path);
          }
          if (event.key === 'Escape') onClose();
        }}
        className="h-7 w-full rounded-sm border border-win-accent bg-win px-2 text-[0.8125rem] text-win-text outline-none"
      />
      <ul role="listbox" aria-label="Files" className="mt-1">
        {shown.map((path, index) => {
          const name = path.split('/').at(-1) ?? path;
          return (
            <li key={path} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseMove={() => setActive(index)}
                onClick={() => onOpen(path)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-[0.8125rem] ${index === active ? 'bg-win-accent/20 text-win-text' : 'text-win-text'}`}
              >
                <FileIcon name={name} />
                <span className="truncate">{name}</span>
                <span className="ml-auto truncate text-[0.6875rem] text-win-muted">
                  {path.split('/').slice(0, -1).join('/')}
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 ? (
          <li className="px-2 py-2 text-[0.75rem] text-win-muted">No matching results</li>
        ) : null}
      </ul>
    </div>
  );
}
