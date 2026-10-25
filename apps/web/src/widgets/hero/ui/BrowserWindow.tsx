import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Gauge,
  Globe,
  Lock,
  Monitor,
  Plus,
  RotateCw,
  Search,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { DemoStore, STORE_HOST, parseStorePath, type CartLine } from '@/entities/demo-store';
import type { Dictionary } from '@/shared/i18n';
import { Callout, ScoreRing } from '@/shared/ui';
import {
  NEW_TAB,
  back,
  canGoBack,
  canGoForward,
  createHistory,
  currentUrl,
  forward,
  locate,
  push,
  resolveAddress,
  storeUrl,
  type BrowserHistory,
  type Location,
} from '../model/browserHistory';

export type Device = 'desktop' | 'mobile';
export type Audit = 'idle' | 'running' | 'done';

const SCORES = [98, 100, 100, 100] as const;
const MAX_TABS = 4;
const SHORTCUTS = ['/', '/catalog', '/cart'] as const;

interface Tab {
  id: number;
  history: BrowserHistory;
}

interface BrowserWindowProps {
  copy: Dictionary['build'];
  headline: string;
  cta: string;
  accent: string;
  device: Device;
  audit: Audit;
  onDevice: (device: Device) => void;
  onAudit: () => void;
  onInteract: () => void;
}

function titleOf(location: Location, copy: Dictionary['build']): string {
  if (location.kind === 'newtab') return copy.browser.newTabTitle;
  if (location.kind === 'external') return location.host;
  const demo = copy.demo;
  const route = parseStorePath(
    location.path,
    demo.products.map((product) => product.sku),
  );
  const page = {
    home: demo.nav[0],
    catalog: demo.catalog.title,
    product: route.page === 'product' ? demo.products.find((p) => p.sku === route.sku)?.name : '',
    cart: demo.cart.title,
    checkout: demo.checkout.title,
    order: demo.order.title,
    notFound: demo.notFound.title,
  }[route.page];
  return `${demo.brand} — ${page ?? ''}`;
}

function displayOf(location: Location): string {
  if (location.kind === 'newtab') return '';
  if (location.kind === 'external') return location.host;
  return location.path === '/' ? STORE_HOST : `${STORE_HOST}${location.path}`;
}

export function BrowserWindow({
  copy,
  headline,
  cta,
  accent,
  device,
  audit,
  onDevice,
  onAudit,
  onInteract,
}: BrowserWindowProps) {
  const [tabs, setTabs] = useState<readonly Tab[]>(() => [
    { id: 1, history: createHistory(storeUrl('/')) },
  ]);
  const [activeId, setActiveId] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [draft, setDraft] = useState<string | null>(null);
  const [visit, setVisit] = useState(0);
  const nextId = useRef(2);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const history = active?.history ?? createHistory(NEW_TAB);
  const url = currentUrl(history);
  const location = locate(url);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [url, activeId]);

  const labels = [
    copy.audit.performance,
    copy.audit.accessibility,
    copy.audit.bestPractices,
    copy.audit.seo,
  ];
  const scores = audit === 'done' ? SCORES : SCORES.map(() => 0);

  const update = (change: (history: BrowserHistory) => BrowserHistory) => {
    onInteract();
    setTabs((current) =>
      current.map((tab) => (tab.id === activeId ? { ...tab, history: change(tab.history) } : tab)),
    );
    setVisit((value) => value + 1);
  };

  const go = (target: string) => update((current) => push(current, target));
  const storeNavigate = (path: string) => go(storeUrl(path));

  const openTab = (target = NEW_TAB) => {
    onInteract();
    if (tabs.length >= MAX_TABS) return;
    const id = nextId.current;
    nextId.current += 1;
    setTabs((current) => [...current, { id, history: createHistory(target) }]);
    setActiveId(id);
    setVisit((value) => value + 1);
    if (target === NEW_TAB) window.requestAnimationFrame(() => addressRef.current?.focus());
  };

  const closeTab = (id: number) => {
    onInteract();
    const index = tabs.findIndex((tab) => tab.id === id);
    const rest = tabs.filter((tab) => tab.id !== id);
    if (rest.length === 0) {
      const fresh = nextId.current;
      nextId.current += 1;
      setTabs([{ id: fresh, history: createHistory(storeUrl('/')) }]);
      setActiveId(fresh);
      return;
    }
    setTabs(rest);
    const neighbour = rest[Math.max(0, index - 1)];
    if (id === activeId && neighbour) setActiveId(neighbour.id);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft === null) return;
    go(resolveAddress(draft));
    setDraft(null);
    addressRef.current?.blur();
  };

  return (
    <div
      role="group"
      aria-label={copy.demo.brand}
      data-tone="light"
      className="window flex h-full flex-col overflow-hidden"
    >
      <div className="flex h-10 shrink-0 items-end gap-1 bg-win-raised px-3">
        <span aria-hidden="true" className="mr-2 mb-3.5 flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <div role="group" aria-label={copy.browser.tabs} className="flex min-w-0 items-end gap-0.5">
          {tabs.map((tab) => {
            const selected = tab.id === active?.id;
            const tabLocation = locate(currentUrl(tab.history));
            const title = titleOf(tabLocation, copy);
            return (
              <div
                key={tab.id}
                className={`group flex h-8 max-w-48 min-w-0 flex-1 basis-40 items-center rounded-t-lg text-[0.75rem] transition-colors ${selected ? 'bg-win text-win-text' : 'text-win-muted hover:bg-win/60'}`}
              >
                <button
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  title={title}
                  onClick={() => {
                    onInteract();
                    setActiveId(tab.id);
                    setDraft(null);
                  }}
                  className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3"
                >
                  {tabLocation.kind === 'store' ? (
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-sm transition-colors duration-500"
                      style={{ backgroundColor: accent }}
                    />
                  ) : (
                    <Globe aria-hidden="true" className="size-3 shrink-0" />
                  )}
                  <span className="truncate">{title}</span>
                </button>
                <button
                  type="button"
                  aria-label={`${copy.browser.closeTab}: ${title}`}
                  title={copy.browser.closeTab}
                  onClick={() => closeTab(tab.id)}
                  className={`mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-win-raised ${selected ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'}`}
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          aria-label={copy.browser.newTab}
          title={copy.browser.newTab}
          disabled={tabs.length >= MAX_TABS}
          onClick={() => openTab()}
          className="mb-1.5 ml-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-win-muted hover:bg-win hover:text-win-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="relative flex h-10 shrink-0 items-center gap-1 border-b border-win-line px-2 sm:px-3">
        <Callout n={5} className="-bottom-3 left-24" />
        {(
          [
            ['back', ArrowLeft, canGoBack(history), () => update(back)],
            ['forward', ArrowRight, canGoForward(history), () => update(forward)],
            ['reload', RotateCw, true, () => update((current) => current)],
          ] as const
        ).map(([id, Icon, enabled, action]) => (
          <button
            key={id}
            type="button"
            aria-label={copy.browser[id]}
            title={copy.browser[id]}
            disabled={!enabled}
            onClick={action}
            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-win-muted hover:bg-win-raised hover:text-win-text disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon aria-hidden="true" className={id === 'reload' ? 'size-3.5' : 'size-4'} />
          </button>
        ))}
        <form
          onSubmit={submit}
          className="ml-1 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-full bg-win-raised px-3 text-[0.75rem] text-win-muted focus-within:bg-win focus-within:ring-2 focus-within:ring-win-accent/40"
        >
          {location.kind === 'store' ? (
            <Lock aria-hidden="true" className="size-3 shrink-0" />
          ) : (
            <Search aria-hidden="true" className="size-3 shrink-0" />
          )}
          <input
            ref={addressRef}
            value={draft ?? displayOf(location)}
            aria-label={copy.browser.address}
            placeholder={copy.browser.newTabSearch}
            spellCheck={false}
            autoComplete="off"
            onFocus={(event) => {
              onInteract();
              setDraft(displayOf(location));
              event.currentTarget.select();
            }}
            onBlur={() => setDraft(null)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              setDraft(null);
              event.currentTarget.blur();
            }}
            className="min-w-0 flex-1 bg-transparent text-win-text outline-none placeholder:text-win-muted"
          />
          <span className="ml-auto hidden shrink-0 rounded-full bg-win-accent/10 px-2 text-[0.6875rem] text-win-accent sm:inline lg:hidden">
            {copy.demoBadge}
          </span>
        </form>
        <div className="flex shrink-0 gap-0.5">
          {(
            [
              ['desktop', Monitor],
              ['mobile', Smartphone],
            ] as const
          ).map(([id, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              aria-label={copy.devices[id]}
              title={copy.devices[id]}
              onClick={() => onDevice(id)}
              className={`grid size-7 cursor-pointer place-items-center rounded-md ${device === id ? 'bg-win-raised text-win-text' : 'text-win-muted hover:text-win-text'}`}
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          ))}
          <button
            type="button"
            onClick={onAudit}
            disabled={audit === 'running'}
            aria-label={copy.runAudit}
            title={copy.runAudit}
            className="grid size-7 cursor-pointer place-items-center rounded-md text-win-muted hover:text-win-text disabled:cursor-wait"
          >
            <Gauge
              aria-hidden="true"
              className={`size-4 ${audit === 'running' ? 'animate-pulse text-win-accent' : ''}`}
            />
          </button>
        </div>
        {visit > 0 ? (
          <span
            key={visit}
            aria-hidden="true"
            className="page-progress absolute inset-x-0 -bottom-px h-0.5 origin-left"
            style={{ backgroundColor: accent }}
          />
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#e9e6e1]">
        <Callout n={3} className="right-3 bottom-3" />
        <div
          ref={scrollRef}
          className={`absolute inset-y-0 left-1/2 -translate-x-1/2 overflow-y-auto bg-[#f7f4ef] transition-[width,box-shadow] duration-500 ease-[var(--ease-out)] ${device === 'mobile' ? 'w-[min(100%,22rem)] shadow-[0_0_0_1px_rgb(0_0_0/0.1)]' : 'w-full'}`}
        >
          {location.kind === 'store' ? (
            <DemoStore
              key={`${active?.id ?? 0}:${visit}`}
              copy={copy.demo}
              headline={headline}
              cta={cta}
              accent={accent}
              path={location.path}
              cart={cart}
              guide
              onNavigate={storeNavigate}
              onCart={(next) => {
                onInteract();
                setCart(next);
              }}
            />
          ) : location.kind === 'newtab' ? (
            <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-win px-5 py-10 text-win-text">
              <p className="text-[0.8125rem] text-win-muted">{copy.browser.shortcuts}</p>
              <ul className="flex flex-wrap justify-center gap-3">
                {SHORTCUTS.map((path) => {
                  const shortcut = locate(storeUrl(path));
                  return (
                    <li key={path}>
                      <button
                        type="button"
                        onClick={() => go(storeUrl(path))}
                        className="flex w-24 cursor-pointer flex-col items-center gap-2 rounded-xl p-3 text-center hover:bg-win-raised"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-10 place-items-center rounded-full text-white"
                          style={{ backgroundColor: accent }}
                        >
                          <Coffee className="size-4" />
                        </span>
                        <span className="line-clamp-2 text-[0.6875rem] leading-tight">
                          {titleOf(shortcut, copy)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex min-h-full flex-col items-start justify-center gap-3 bg-win px-8 py-10 text-win-text">
              <WifiOff aria-hidden="true" className="size-9 text-win-muted" strokeWidth={1.5} />
              <p className="text-[1.125rem] font-semibold">{copy.browser.offlineTitle}</p>
              <p className="text-[0.8125rem] text-win-muted">
                <span className="font-medium text-win-text">{location.host}</span> ·{' '}
                {copy.browser.offlineText}
              </p>
              <button
                type="button"
                onClick={() => go(storeUrl('/'))}
                className="mt-2 cursor-pointer rounded-full bg-win-accent px-4 py-2 text-[0.8125rem] font-medium text-white hover:opacity-90"
              >
                {copy.browser.offlineBack}
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        aria-live="polite"
        className="relative flex shrink-0 items-center gap-3 border-t border-win-line px-3 py-2.5 sm:gap-5 sm:px-4"
      >
        <Callout n={4} className="-top-3 left-3" />
        {scores.map((value, index) => (
          <ScoreRing key={labels[index]} value={value} label={labels[index] ?? ''} size="sm" />
        ))}
        <p className="ml-auto hidden max-w-[12rem] text-right text-[0.6875rem] text-win-muted sm:block">
          {audit === 'running' ? copy.auditing : copy.auditNote}
        </p>
      </div>
    </div>
  );
}
