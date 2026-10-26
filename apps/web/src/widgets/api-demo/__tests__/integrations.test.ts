import { describe, expect, it } from 'vitest';
import { fanOut, isDelivered, revealOrder, visibleAttempts } from '../model/integrations';

describe('integrations fan-out', () => {
  it('delivers every event once when all services are up', () => {
    const deliveries = fanOut(3, false);
    expect(deliveries.map((delivery) => delivery.id)).toEqual([
      'crm',
      'shipping',
      'telegram',
      'email',
    ]);
    expect(deliveries.every((delivery) => delivery.attempts.length === 1)).toBe(true);
  });

  it('retries the CRM with exponential backoff', () => {
    const crm = fanOut(3, true)[0];
    expect(crm?.attempts.map((attempt) => attempt.status)).toEqual([503, 503, 200]);
    expect(crm?.attempts.map((attempt) => attempt.at)).toEqual([120, 1120, 3120]);
  });

  it('reveals attempts in time order', () => {
    const deliveries = fanOut(1, true);
    const order = revealOrder(deliveries);
    expect(order).toHaveLength(6);
    expect(order.map((item) => item.at)).toEqual(
      [...order.map((item) => item.at)].sort((a, b) => a - b),
    );
    const visible = visibleAttempts(deliveries, 2);
    expect(visible.flat()).toHaveLength(2);
    expect(isDelivered(visibleAttempts(deliveries, 6)[0] ?? [])).toBe(true);
    expect(isDelivered([])).toBe(false);
  });
});
