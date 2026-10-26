import { Pause, Play, RotateCcw } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import type { DemoPlayer as Player, GuideCursor as Cursor } from '@/shared/lib';

interface DemoPlayerProps {
  player: Player;
  labels: readonly string[];
  className?: string;
}

function share(player: Player, index: number): number {
  const start = player.chapters[index] ?? 0;
  const end = player.chapters[index + 1] ?? player.total;
  if (player.elapsed <= start) return 0;
  if (end <= start || player.elapsed >= end) return 1;
  return (player.elapsed - start) / (end - start);
}

export function DemoPlayer({ player, labels, className = '' }: DemoPlayerProps) {
  const { t } = useI18n();
  const copy = t.ui.player;
  const playing = player.state === 'playing';
  const yours = player.state === 'yours';

  return (
    <div
      role="group"
      aria-label={copy.label}
      className={`flex min-w-0 items-center gap-2 text-step--1 ${className}`}
    >
      <button
        type="button"
        onClick={playing ? player.pause : player.play}
        aria-label={playing ? copy.pause : copy.play}
        title={playing ? copy.pause : copy.play}
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-ink text-bg transition-transform hover:scale-105 active:scale-95"
      >
        {playing ? (
          <Pause aria-hidden="true" className="size-4 fill-current" />
        ) : (
          <Play aria-hidden="true" className="size-4 translate-x-px fill-current" />
        )}
      </button>
      <ol className="scrollbar-none flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
        {labels.map((label, index) => {
          const active = !yours && player.chapter === index && player.state !== 'done';
          return (
            <li key={label}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => player.seek(index)}
                className={`relative cursor-pointer overflow-hidden rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${active ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--line)]' : 'text-muted hover:bg-surface hover:text-ink'}`}
              >
                <span className="text-faint">{index + 1}</span> {label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-200"
                  style={{ transform: `scaleX(${yours ? 0 : share(player, index)})` }}
                />
              </button>
            </li>
          );
        })}
      </ol>
      {yours || player.state === 'done' ? (
        <button
          type="button"
          onClick={player.replay}
          aria-label={yours ? copy.yours : copy.replay}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 whitespace-nowrap text-muted hover:bg-surface hover:text-ink"
        >
          <RotateCcw aria-hidden="true" className="size-3.5" />
          <span className="hidden sm:inline">{yours ? copy.yours : copy.replay}</span>
        </button>
      ) : null}
    </div>
  );
}

export function GuideCursor({ cursor, name }: { cursor: Cursor; name: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 left-0 z-50 transition-[transform,opacity,visibility] duration-[650ms] ease-[var(--ease-out)] ${cursor.visible ? 'visible opacity-100' : 'invisible opacity-0'}`}
      style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
    >
      {cursor.click > 0 ? (
        <span
          key={cursor.click}
          className="guide-click absolute -top-4 -left-4 size-8 rounded-full border-2 border-accent"
        />
      ) : null}
      <svg
        viewBox="0 0 24 24"
        className="relative size-6 -translate-x-[3px] -translate-y-[2px] drop-shadow-md"
      >
        <path
          d="M4 2.5 20 11l-7 1.8-3.4 6.7z"
          fill="var(--accent)"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute top-5 left-4 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold whitespace-nowrap text-on-accent shadow-md">
        {name}
      </span>
    </span>
  );
}
