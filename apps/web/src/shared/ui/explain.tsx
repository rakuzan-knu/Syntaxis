import { use } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { ExplainContext } from './explainContext';

export function Callout({ n, className = '' }: { n: number; className?: string }) {
  const visible = use(ExplainContext);
  if (!visible) return null;
  return (
    <span aria-hidden="true" className={`callout pointer-events-none absolute z-20 ${className}`}>
      {n}
    </span>
  );
}

interface ExplainToggleProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

export function ExplainToggle({ active, onToggle, className = '' }: ExplainToggleProps) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-step--1 font-medium transition-colors ${active ? 'bg-ink text-bg' : 'bg-surface text-ink shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--faint)]'} ${className}`}
    >
      {active ? (
        <X aria-hidden="true" className="size-4" />
      ) : (
        <Lightbulb aria-hidden="true" className="size-4" />
      )}
      {active ? t.ui.hideExplain : t.ui.explain}
    </button>
  );
}

export function ExplainLegend({ callouts }: { callouts: readonly string[] }) {
  return (
    <ol className="ink-in mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {callouts.map((text, index) => (
        <li key={text} className="flex items-start gap-3 text-step--1">
          <span aria-hidden="true" className="callout shrink-0">
            {index + 1}
          </span>
          <span className="pt-0.5">{text}</span>
        </li>
      ))}
    </ol>
  );
}
