import { useState } from 'react';
import { CircleCheck, Eye, EyeOff, Globe, Lock, Search } from 'lucide-react';
import { RUNTIME_LOGS, filterLogs, visitsSeries } from '../model/insights';

export type Section = 'Deployments' | 'Analytics' | 'Logs' | 'Settings';

const VITALS = [
  { label: 'LCP', value: '1.3 s', note: 'Good' },
  { label: 'INP', value: '88 ms', note: 'Good' },
  { label: 'CLS', value: '0.02', note: 'Good' },
] as const;

const PAGES = [
  ['/', 4120],
  ['/catalog', 2380],
  ['/product/ethiopia', 1710],
  ['/cart', 960],
] as const;

const ENV = [
  { name: 'DATABASE_URL', value: 'postgres://zerno:••••@db.internal:5432/zerno', secret: true },
  { name: 'MONOBANK_TOKEN', value: 'uMjX3Qw9…f02', secret: true },
  { name: 'NOVA_POSHTA_API_KEY', value: '8c41e0…9ad', secret: true },
  { name: 'PUBLIC_SITE_URL', value: 'https://zerno.preview.example', secret: false },
] as const;

function Analytics() {
  const series = visitsSeries();
  const max = Math.max(...series.map((point) => point.visitors));
  const total = series.reduce((sum, point) => sum + point.visitors, 0);
  return (
    <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        <p className="text-[0.75rem] text-win-muted">Visitors · last 14 days</p>
        <p className="font-mono text-[1.5rem] font-semibold text-win-text tabular-nums">
          {total.toLocaleString('en-US')}
        </p>
        <div className="mt-3 flex h-40 items-end gap-1.5" role="img" aria-label="Visitors per day">
          {series.map((point) => (
            <span
              key={point.day}
              title={`Day ${point.day}: ${point.visitors}`}
              className="flex-1 rounded-t bg-win-accent/70 transition-[height] duration-500 hover:bg-win-accent"
              style={{ height: `${(point.visitors / max) * 100}%` }}
            />
          ))}
        </div>
        <ul className="mt-4 divide-y divide-win-line text-[0.75rem]">
          {PAGES.map(([path, visits]) => (
            <li key={path} className="flex items-center justify-between py-1.5">
              <span className="font-mono text-win-text">{path}</span>
              <span className="text-win-muted tabular-nums">{visits.toLocaleString('en-US')}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[0.75rem] text-win-muted">Speed Insights · p75</p>
        {VITALS.map((vital) => (
          <div key={vital.label} className="rounded-md border border-win-line p-3">
            <p className="flex items-center justify-between text-[0.75rem] text-win-muted">
              {vital.label}
              <span className="inline-flex items-center gap-1 text-ok">
                <CircleCheck aria-hidden="true" className="size-3" />
                {vital.note}
              </span>
            </p>
            <p className="mt-1 font-mono text-[1.125rem] font-semibold text-win-text">
              {vital.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Logs() {
  const [query, setQuery] = useState('');
  const [problems, setProblems] = useState(false);
  const logs = filterLogs(RUNTIME_LOGS, query, problems);
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-win-line px-2.5 py-1.5 text-[0.75rem] focus-within:border-win-accent">
          <Search aria-hidden="true" className="size-3.5 text-win-muted" />
          <input
            value={query}
            aria-label="Search logs"
            placeholder="Search path, method or status"
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-win-text outline-none placeholder:text-win-muted"
          />
        </label>
        <button
          type="button"
          aria-pressed={problems}
          onClick={() => setProblems((value) => !value)}
          className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-[0.75rem] ${problems ? 'border-bad/50 bg-bad/10 text-bad' : 'border-win-line text-win-muted hover:text-win-text'}`}
        >
          Warnings and errors
        </button>
      </div>
      <ul className="mt-3 font-mono text-[0.75rem]">
        {logs.map((log) => (
          <li
            key={`${log.time}-${log.path}-${log.status}`}
            className={`grid grid-cols-[4.5rem_2.5rem_3.25rem_minmax(0,1fr)_3.5rem] gap-2 border-b border-win-line/60 py-1.5 ${log.level === 'error' ? 'text-bad' : log.level === 'warning' ? 'text-warn' : 'text-win-text/85'}`}
          >
            <span className="text-win-muted">{log.time}</span>
            <span>{log.status}</span>
            <span>{log.method}</span>
            <span className="truncate">{log.path}</span>
            <span className="text-right text-win-muted">{log.duration}ms</span>
          </li>
        ))}
        {logs.length === 0 ? (
          <li className="py-6 text-center font-sans text-win-muted">No logs match this filter</li>
        ) : null}
      </ul>
    </div>
  );
}

function Settings() {
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const toggle = (name: string) =>
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  return (
    <div className="grid gap-5 p-4">
      <div>
        <p className="mb-2 text-[0.75rem] font-semibold text-win-text">Environment Variables</p>
        <ul className="divide-y divide-win-line rounded-md border border-win-line text-[0.75rem]">
          {ENV.map((item) => {
            const open = !item.secret || revealed.has(item.name);
            return (
              <li key={item.name} className="flex items-center gap-3 px-3 py-2">
                <span className="w-44 shrink-0 truncate font-mono text-win-text">{item.name}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-win-muted">
                  {open ? item.value : '••••••••••••••••'}
                </span>
                {item.secret ? (
                  <span className="hidden items-center gap-1 text-[0.6875rem] text-win-muted sm:inline-flex">
                    <Lock aria-hidden="true" className="size-3" /> Encrypted
                  </span>
                ) : null}
                {item.secret ? (
                  <button
                    type="button"
                    aria-label={open ? `Hide ${item.name}` : `Reveal ${item.name}`}
                    onClick={() => toggle(item.name)}
                    className="grid size-6 cursor-pointer place-items-center rounded text-win-muted hover:bg-win-raised hover:text-win-text"
                  >
                    {open ? (
                      <EyeOff aria-hidden="true" className="size-3.5" />
                    ) : (
                      <Eye aria-hidden="true" className="size-3.5" />
                    )}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-[0.75rem] font-semibold text-win-text">Domains</p>
        <ul className="divide-y divide-win-line rounded-md border border-win-line text-[0.75rem]">
          {['zerno.preview.example', 'www.zerno.preview.example'].map((domain) => (
            <li key={domain} className="flex items-center gap-2 px-3 py-2">
              <Globe aria-hidden="true" className="size-3.5 text-win-muted" />
              <span className="font-mono text-win-text">{domain}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-ok">
                <CircleCheck aria-hidden="true" className="size-3.5" /> Valid · SSL auto-renew
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Insights({ section }: { section: Exclude<Section, 'Deployments'> }) {
  if (section === 'Analytics') return <Analytics />;
  if (section === 'Logs') return <Logs />;
  return <Settings />;
}
