import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AppWindow, LayoutGrid } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useMediaQuery } from '@/shared/lib';
import { DesktopContext, type DesktopApi } from './desktopContext';

function Wallpaper() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
    >
      <circle cx="860" cy="250" r="90" fill="var(--sun)" opacity="0.85" />
      <path
        d="M0 380 C 180 300 320 330 470 290 S 760 250 900 300 S 1110 280 1200 250 V600 H0Z"
        fill="var(--hill-far)"
      />
      <path
        d="M0 450 C 160 390 300 420 460 380 S 720 360 880 410 S 1100 380 1200 360 V600 H0Z"
        fill="var(--hill-mid)"
      />
      <path
        d="M0 520 C 200 470 380 500 560 470 S 860 450 1000 490 S 1150 480 1200 470 V600 H0Z"
        fill="var(--hill-near)"
      />
    </svg>
  );
}

interface DesktopProps {
  children: ReactNode;
  className?: string;
}

const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)';

export function Desktop({ children, className = '' }: DesktopProps) {
  const { t } = useI18n();
  const enabled = useMediaQuery(DESKTOP_QUERY);
  const [titles, setTitles] = useState<Readonly<Record<string, string>>>({});
  const [order, setOrder] = useState<readonly string[]>([]);
  const [minimized, setMinimized] = useState<readonly string[]>([]);
  const [solo, setSolo] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);

  const register = useCallback((id: string, title: string) => {
    setTitles((current) => (current[id] === title ? current : { ...current, [id]: title }));
    setOrder((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const focus = useCallback((id: string) => {
    setOrder((current) =>
      current.at(-1) === id ? current : [...current.filter((item) => item !== id), id],
    );
  }, []);

  const minimize = useCallback((id: string) => {
    setMinimized((current) => (current.includes(id) ? current : [...current, id]));
    setSolo((current) => (current === id ? null : current));
  }, []);

  const restore = useCallback(
    (id: string) => {
      setMinimized((current) => current.filter((item) => item !== id));
      focus(id);
    },
    [focus],
  );

  const toggleSolo = useCallback(
    (id: string) => {
      if (solo === id) {
        setSolo(null);
        setMinimized([]);
      } else {
        setSolo(id);
        setMinimized(order.filter((item) => item !== id));
      }
      focus(id);
    },
    [focus, order, solo],
  );

  const resetAll = () => {
    setMinimized([]);
    setSolo(null);
    setGeneration((value) => value + 1);
  };

  const api = useMemo<DesktopApi>(
    () => ({
      enabled,
      order,
      minimized,
      solo,
      generation,
      register,
      focus,
      minimize,
      restore,
      toggleSolo,
    }),
    [enabled, order, minimized, solo, generation, register, focus, minimize, restore, toggleSolo],
  );

  return (
    <DesktopContext value={api}>
      <div className={`desktop p-3 sm:p-6 lg:p-8 ${className}`}>
        <Wallpaper />
        {children}
        {enabled && (minimized.length > 0 || generation > 0 || order.length > 0) ? (
          <div
            role="toolbar"
            aria-label={t.ui.windows.dock}
            className={`absolute bottom-3 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/30 bg-white/55 p-1.5 shadow-lg backdrop-blur-md transition-[opacity,translate] duration-300 dark:border-white/10 dark:bg-black/45 ${minimized.length > 0 ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
          >
            {minimized.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => restore(id)}
                title={t.ui.windows.restore}
                className="flex max-w-48 cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-[0.75rem] font-medium text-ink hover:bg-white/60 dark:hover:bg-white/10"
              >
                <AppWindow aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{titles[id] ?? id}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetAll}
              aria-label={t.ui.windows.reset}
              title={t.ui.windows.reset}
              className="grid size-8 cursor-pointer place-items-center rounded-xl text-ink hover:bg-white/60 dark:hover:bg-white/10"
            >
              <LayoutGrid aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </DesktopContext>
  );
}
