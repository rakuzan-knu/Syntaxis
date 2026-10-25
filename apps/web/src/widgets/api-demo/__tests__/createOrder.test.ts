import { describe, expect, it } from 'vitest';
import { clampQuantity, createOrder } from '../model/createOrder';

describe('createOrder', () => {
  const request = { product: 'eth', quantity: 2, city: 'lviv', payment: 'monobank' };

  it('totals the order and routes delivery to the city branch', () => {
    const { status, body } = createOrder(request, 1);
    expect(status).toBe(201);
    expect(body.total).toBe(840);
    expect(body.delivery).toEqual({
      carrier: 'nova_poshta',
      city: 'lviv',
      branch: 12,
      eta_days: 1,
    });
    expect(body.payment.url).toBe(`https://pay.example/${body.id}`);
  });

  it('issues a new id for every request', () => {
    expect(createOrder(request, 1).body.id).not.toBe(createOrder(request, 2).body.id);
  });

  it('clamps quantity to the allowed range', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(42)).toBe(9);
    expect(createOrder({ ...request, quantity: 42 }, 3).body.total).toBe(420 * 9);
  });
});
