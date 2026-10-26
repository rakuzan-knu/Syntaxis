import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { TrafficLights } from './TrafficLights';

export interface WindowTab<T extends string> {
  id: T;
  label: string;
}

interface WindowProps<T extends string> {
  title: string;
  children: ReactNode;
  toolbar?: ReactNode;
  tabs?: readonly WindowTab<T>[];
  activeTab?: T;
  onTabChange?: (id: T) => void;
  className?: string;
  tone?: 'dark' | 'light';
}

export function Window<T extends string>({
  title,
  children,
  toolbar,
  tabs,
  activeTab,
  onTabChange,
  className = '',
  tone = 'dark',
}: WindowProps<T>) {
  const baseId = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!tabs || !onTabChange || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return;
    const current = tabs.findIndex((tab) => tab.id === activeTab);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(current + step + tabs.length) % tabs.length];
    if (!next) return;
    onTabChange(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <div
      role="group"
      aria-label={title}
      data-tone={tone}
      className={`window flex flex-col overflow-hidden ${className}`}
    >
      <div
        data-drag-handle
        className="flex h-11 shrink-0 items-center gap-3 border-b border-win-line px-4"
      >
        <TrafficLights muted />
        {tabs && onTabChange ? (
          <div
            role="tablist"
            aria-label={title}
            onKeyDown={onKeyDown}
            className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto"
          >
            {tabs.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  id={`${baseId}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTabChange(tab.id)}
                  className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-step--1 transition-colors ${selected ? 'bg-win-raised text-win-text' : 'text-win-muted hover:text-win-text'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="min-w-0 flex-1 truncate text-center text-step--1 text-win-muted">{title}</p>
        )}
        {toolbar ? (
          <div className="flex shrink-0 items-center gap-2">{toolbar}</div>
        ) : (
          <span aria-hidden="true" className="w-[2.625rem]" />
        )}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
