import { describe, expect, it } from 'vitest';
import {
  back,
  canGoBack,
  canGoForward,
  createHistory,
  currentUrl,
  forward,
  push,
  NEW_TAB,
  locate,
  resolveAddress,
} from '../model/browserHistory';

describe('browser history', () => {
  it('navigates back and forward', () => {
    let history = push(push(createHistory('/'), '/catalog'), '/cart');
    history = back(back(history));
    expect(currentUrl(history)).toBe('/');
    expect(canGoBack(history)).toBe(false);
    history = forward(history);
    expect(currentUrl(history)).toBe('/catalog');
    expect(canGoForward(history)).toBe(true);
  });

  it('drops forward entries after a new navigation', () => {
    let history = back(push(push(createHistory('/'), '/catalog'), '/cart'));
    history = push(history, '/checkout');
    expect(history.entries).toEqual(['/', '/catalog', '/checkout']);
    expect(canGoForward(history)).toBe(false);
  });

  it('ignores navigation to the current page', () => {
    const history = createHistory('/');
    expect(push(history, '/')).toBe(history);
  });
});

describe('address bar', () => {
  it('resolves store paths, bare words and other hosts', () => {
    expect(resolveAddress('/cart')).toBe('zerno.preview.example/cart');
    expect(resolveAddress('catalog')).toBe('zerno.preview.example/catalog');
    expect(resolveAddress('https://zerno.preview.example/')).toBe('zerno.preview.example/');
    expect(resolveAddress('Google.com/search')).toBe('google.com');
    expect(resolveAddress('  ')).toBe(NEW_TAB);
  });

  it('locates every kind of page', () => {
    expect(locate(NEW_TAB)).toEqual({ kind: 'newtab' });
    expect(locate('zerno.preview.example/cart')).toEqual({ kind: 'store', path: '/cart' });
    expect(locate('google.com')).toEqual({ kind: 'external', host: 'google.com' });
  });
});
