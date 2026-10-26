import { describe, expect, it } from 'vitest';
import { TARGET_RPS, loadSeries, parseOrderBody, snippet, summarize } from '../model/requestTools';

const CITIES = ['kyiv', 'lviv'];
const PROVIDERS = ['liqpay', 'monobank'];
const valid = JSON.stringify({
  items: [{ sku: 'x', quantity: 2 }],
  delivery: { city: 'lviv' },
  payment: { provider: 'monobank' },
});

describe('parseOrderBody', () => {
  it('accepts a valid order', () => {
    expect(parseOrderBody(valid, CITIES, PROVIDERS)).toEqual({
      ok: true,
      quantity: 2,
      city: 'lviv',
      payment: 'monobank',
    });
  });

  it('answers 400 for broken JSON', () => {
    const result = parseOrderBody('{ "items": [', CITIES, PROVIDERS);
    expect(result.ok).toBe(false);
    expect(result.ok ? 0 : result.status).toBe(400);
  });

  it('answers 422 with every invalid field', () => {
    const result = parseOrderBody(
      JSON.stringify({ items: [{ quantity: 40 }], delivery: { city: 'paris' }, payment: {} }),
      CITIES,
      PROVIDERS,
    );
    expect(result.ok ? 0 : result.status).toBe(422);
    expect(JSON.stringify(result)).toContain('items[0].quantity');
    expect(JSON.stringify(result)).toContain('delivery.city');
    expect(JSON.stringify(result)).toContain('payment.provider');
  });
});

describe('snippet', () => {
  const request = {
    method: 'POST' as const,
    url: 'https://api.zerno.example/v1/orders',
    headers: [
      ['Content-Type', 'application/json'],
      ['User-Agent', 'zerno-web'],
    ] as const,
    body: '{\n  "a": 1\n}',
  };

  it('builds curl without a trailing backslash', () => {
    const text = snippet('curl', request);
    expect(text).toContain("curl -X POST 'https://api.zerno.example/v1/orders'");
    expect(text).toContain(`--data '{ "a": 1 }'`);
    expect(text).not.toContain('User-Agent');
    expect(text.endsWith('\\')).toBe(false);
  });

  it('builds fetch and python versions', () => {
    expect(snippet('fetch', request)).toContain("method: 'POST'");
    expect(snippet('python', request)).toContain('requests.post(');
  });
});

describe('load test', () => {
  it('ramps to the target and scales servers up', () => {
    const points = loadSeries();
    expect(points[0]?.rps).toBe(0);
    expect(Math.max(...points.map((point) => point.rps))).toBeLessThanOrEqual(TARGET_RPS);
    expect(points.at(-1)?.instances).toBeGreaterThan(points[0]?.instances ?? 0);
    const summary = summarize(points);
    expect(summary.peakP95).toBeLessThan(200);
    expect(summary.requests).toBeGreaterThan(6000);
  });
});
