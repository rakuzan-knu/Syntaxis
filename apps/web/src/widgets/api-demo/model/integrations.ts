export const INTEGRATIONS = ['crm', 'shipping', 'telegram', 'email'] as const;
export type IntegrationId = (typeof INTEGRATIONS)[number];

export interface Attempt {
  at: number;
  status: number;
  ms: number;
}

export interface Delivery {
  id: IntegrationId;
  request: string;
  attempts: readonly Attempt[];
}

export interface Reveal {
  delivery: number;
  attempt: number;
  at: number;
}

export const RETRY_BACKOFF = [1000, 2000] as const;

const REQUESTS: Readonly<Record<IntegrationId, string>> = {
  crm: 'POST openapi.keycrm.app/v1/order',
  shipping: 'POST api.novaposhta.ua/v2.0/json InternetDocument.save',
  telegram: 'POST api.telegram.org/bot…/sendMessage',
  email: 'POST api.brevo.com/v3/smtp/email',
};

const BASE_DELAY: Readonly<Record<IntegrationId, number>> = {
  crm: 120,
  shipping: 260,
  telegram: 180,
  email: 340,
};

function latency(seed: number, id: IntegrationId): number {
  return 60 + ((seed * 37 + INTEGRATIONS.indexOf(id) * 53) % 140);
}

export function fanOut(sequence: number, crmDown: boolean): Delivery[] {
  return INTEGRATIONS.map((id) => {
    const start = BASE_DELAY[id];
    const ms = latency(sequence, id);
    if (id !== 'crm' || !crmDown) {
      return { id, request: REQUESTS[id], attempts: [{ at: start, status: 200, ms }] };
    }
    const attempts: Attempt[] = [{ at: start, status: 503, ms: 30 }];
    let at = start;
    RETRY_BACKOFF.forEach((wait, index) => {
      at += wait;
      const last = index === RETRY_BACKOFF.length - 1;
      attempts.push({ at, status: last ? 200 : 503, ms: last ? ms : 30 });
    });
    return { id, request: REQUESTS[id], attempts };
  });
}

export function revealOrder(deliveries: readonly Delivery[]): Reveal[] {
  return deliveries
    .flatMap((delivery, index) =>
      delivery.attempts.map((attempt, position) => ({
        delivery: index,
        attempt: position,
        at: attempt.at + attempt.ms,
      })),
    )
    .sort((a, b) => a.at - b.at);
}

export function visibleAttempts(
  deliveries: readonly Delivery[],
  revealed: number,
): readonly (readonly Attempt[])[] {
  const shown = revealOrder(deliveries).slice(0, revealed);
  return deliveries.map((delivery, index) =>
    delivery.attempts.filter((_, position) =>
      shown.some((item) => item.delivery === index && item.attempt === position),
    ),
  );
}

export function isDelivered(attempts: readonly Attempt[]): boolean {
  return attempts.at(-1)?.status === 200;
}
