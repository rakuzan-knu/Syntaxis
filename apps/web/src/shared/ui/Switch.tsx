import type { ReactNode } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  description?: string;
  guide?: string;
}

export function Switch({ checked, onChange, children, description, guide }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      data-guide={guide}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-win-raised"
    >
      <span className="min-w-0">
        <span className="block text-step--1 text-win-text">{children}</span>
        {description ? (
          <span className="block font-mono text-step--2 text-win-muted">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-win-accent' : 'bg-win-line'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-win-text transition-transform duration-300 ease-[var(--ease-out)] ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
    </button>
  );
}
