import { STORE_HOST, normalizePath } from '@/entities/demo-store';

export interface BrowserHistory {
  entries: readonly string[];
  index: number;
}

export const NEW_TAB = 'about:newtab';

export function createHistory(url: string): BrowserHistory {
  return { entries: [url], index: 0 };
}

export function currentUrl(history: BrowserHistory): string {
  return history.entries[history.index] ?? NEW_TAB;
}

export function push(history: BrowserHistory, url: string): BrowserHistory {
  if (currentUrl(history) === url) return history;
  const entries = [...history.entries.slice(0, history.index + 1), url];
  return { entries, index: entries.length - 1 };
}

export function back(history: BrowserHistory): BrowserHistory {
  return history.index > 0 ? { ...history, index: history.index - 1 } : history;
}

export function forward(history: BrowserHistory): BrowserHistory {
  return history.index < history.entries.length - 1
    ? { ...history, index: history.index + 1 }
    : history;
}

export function canGoBack(history: BrowserHistory): boolean {
  return history.index > 0;
}

export function canGoForward(history: BrowserHistory): boolean {
  return history.index < history.entries.length - 1;
}

export type Location =
  { kind: 'newtab' } | { kind: 'store'; path: string } | { kind: 'external'; host: string };

export function storeUrl(path: string): string {
  return `${STORE_HOST}${normalizePath(path)}`;
}

export function resolveAddress(input: string): string {
  const bare = input.trim().replace(/^https?:\/\//i, '');
  if (bare === '') return NEW_TAB;
  const host = (bare.split('/')[0] ?? '').toLowerCase();
  if (bare.startsWith('/') || host === STORE_HOST || !host.includes('.')) return storeUrl(bare);
  return host;
}

export function locate(url: string): Location {
  if (url === NEW_TAB) return { kind: 'newtab' };
  if (url.startsWith(STORE_HOST)) return { kind: 'store', path: normalizePath(url) };
  return { kind: 'external', host: url };
}
