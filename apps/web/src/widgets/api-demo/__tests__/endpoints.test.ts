import { describe, expect, it } from 'vitest';
import { createOrder } from '../model/createOrder';
import { formatSize, respond } from '../model/endpoints';

const request = { product: 'eth', quantity: 1, city: 'kyiv', payment: 'liqpay' };

describe('respond', () => {
  it('lists products', () => {
    const result = respond('products', { request, sequence: 1, lastOrder: null });
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('OK');
    expect(result.body).toMatchObject({ total: 3 });
  });

  it('returns 404 for an order that does not exist yet', () => {
    const result = respond('getOrder', { request, sequence: 2, lastOrder: null });
    expect(result.status).toBe(404);
    expect(result.tests.find((test) => test.name.startsWith('Status'))?.passed).toBe(false);
  });

  it('reads back the last created order as paid', () => {
    expect(respond('createOrder', { request, sequence: 3, lastOrder: null }).status).toBe(201);
    const lastOrder = createOrder(request, 3).body;
    const fetched = respond('getOrder', { request, sequence: 4, lastOrder });
    expect(fetched.body).toMatchObject({ id: lastOrder.id, status: 'paid' });
  });

  it('reports the response size in its headers', () => {
    const result = respond('webhook', { request, sequence: 5, lastOrder: null });
    expect(result.headers).toContainEqual(['content-length', String(result.size)]);
  });
});

describe('scenarios', () => {
  it('refuses an order when the coffee is sold out', () => {
    const result = respond('createOrder', {
      request,
      sequence: 6,
      lastOrder: null,
      scenario: 'outOfStock',
    });
    expect(result.status).toBe(409);
    expect(result.outcome).toBe('outOfStock');
    expect(result.order).toBeUndefined();
  });

  it('reports a declined card with a 402', () => {
    const result = respond('createOrder', {
      request,
      sequence: 7,
      lastOrder: null,
      scenario: 'declined',
    });
    expect(result.status).toBe(402);
    expect(result.outcome).toBe('declined');
  });

  it('labels the environment in the headers', () => {
    const result = respond('products', {
      request,
      sequence: 8,
      lastOrder: null,
      environment: 'staging',
    });
    expect(result.headers).toContainEqual(['x-environment', 'staging']);
  });
});

describe('formatSize', () => {
  it('switches to kilobytes above 1 KB', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2.0 KB');
  });
});
