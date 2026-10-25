import { useCallback, useId, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { GlossaryItem } from '@/shared/i18n';
import { useDismiss } from '@/shared/lib';

interface GlossaryProps {
  label: string;
  items: readonly GlossaryItem[];
}

export function Glossary({ label, items }: GlossaryProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const current = items.find((item) => item.term === open);

  useDismiss(ref, open !== null, close);

  return (
    <div ref={ref} className="relative mt-4 flex flex-wrap items-center gap-2 text-step--1">
      <span className="inline-flex items-center gap-1.5 text-muted">
        <BookOpen aria-hidden="true" className="size-4" />
        {label}
      </span>
      {items.map((item) => (
        <button
          key={item.term}
          type="button"
          aria-expanded={open === item.term}
          aria-controls={`${id}-definition`}
          onClick={() => setOpen((value) => (value === item.term ? null : item.term))}
          className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium underline decoration-dotted underline-offset-4 transition-colors ${open === item.term ? 'bg-ink text-bg' : 'bg-surface text-ink shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--faint)]'}`}
        >
          {item.term}
        </button>
      ))}
      <p
        id={`${id}-definition`}
        aria-live="polite"
        className={`w-full max-w-[44rem] text-muted ${current ? 'ink-in' : 'sr-only'}`}
      >
        {current ? (
          <>
            <span className="font-semibold text-ink">{current.term}</span> — {current.text}
          </>
        ) : null}
      </p>
    </div>
  );
}

export function PlainCaption({ label, text }: { label: string; text: string }) {
  return (
    <p
      aria-live="polite"
      className="mt-4 flex max-w-[52rem] flex-col gap-1 rounded-xl bg-surface px-4 py-3 text-step-0 shadow-[0_0_0_1px_var(--line)] sm:flex-row sm:gap-3"
    >
      <span className="shrink-0 font-semibold text-ink">{label}</span>
      <span key={text} className="ink-in text-muted">
        {text}
      </span>
    </p>
  );
}
