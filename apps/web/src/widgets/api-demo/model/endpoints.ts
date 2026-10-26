import { createOrder, type OrderRequest, type OrderResponse } from './createOrder';

export type EndpointId = 'products' | 'createOrder' | 'getOrder' | 'webhook';
export type Scenario = 'ok' | 'outOfStock' | 'declined';
export type Environment = 'production' | 'staging';
export type Outcome =
  'products' | 'created' | 'outOfStock' | 'declined' | 'paid' | 'notFound' | 'webhook' | 'invalid';

export interface Endpoint {
  id: EndpointId;
  method: 'GET' | 'POST';
  path: string;
}

export const ENDPOINTS: readonly Endpoint[] = [
  { id: 'products', method: 'GET', path: '/v1/products' },
  { id: 'createOrder', method: 'POST', path: '/v1/orders' },
  { id: 'getOrder', method: 'GET', path: '/v1/orders/:id' },
  { id: 'webhook', method: 'POST', path: '/v1/webhooks/monobank' },
];

export interface ApiResult {
  status: number;
  statusText: string;
  latency: number;
  size: number;
  body: unknown;
  headers: readonly (readonly [string, string])[];
  tests: readonly { name: string; passed: boolean }[];
  order?: Order;
  outcome: Outcome;
}

export type Order = OrderResponse['body'];

interface Context {
  request: OrderRequest;
  sequence: number;
  lastOrder: Order | null;
  scenario?: Scenario;
  environment?: Environment;
}

const PRODUCTS = [
  { sku: 'eth-yirgacheffe-250', name: 'Ethiopia Yirgacheffe', price: 420, stock: 38 },
  { sku: 'col-huila-250', name: 'Colombia Huila', price: 380, stock: 54 },
  { sku: 'bra-mogiana-250', name: 'Brazil Mogiana', price: 340, stock: 71 },
];

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  402: 'Payment Required',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
};

function byteSize(body: unknown): number {
  return new TextEncoder().encode(JSON.stringify(body, null, 2)).length;
}

function finish(
  status: number,
  body: unknown,
  latency: number,
  id: string,
  outcome: Outcome,
  environment: Environment,
): ApiResult {
  const size = byteSize(body);
  return {
    status,
    statusText: STATUS_TEXT[status] ?? '',
    latency,
    size,
    body,
    outcome,
    headers: [
      ['x-environment', environment],
      ['content-type', 'application/json; charset=utf-8'],
      ['content-length', String(size)],
      ['cache-control', 'no-store'],
      ['x-request-id', id],
      [
        'server-timing',
        `db;dur=${Math.round(latency * 0.3)}, app;dur=${Math.round(latency * 0.6)}`,
      ],
      ['strict-transport-security', 'max-age=63072000'],
    ],
    tests: [
      { name: `Status code is ${status}`, passed: status < 400 },
      { name: 'Response time is less than 300ms', passed: latency < 300 },
      { name: 'Body matches schema', passed: status < 400 },
    ],
  };
}

export function requestId(sequence: number): string {
  return `req_${(1_679_616 + sequence * 104_729).toString(36)}`;
}

export function respond(endpoint: EndpointId, context: Context): ApiResult {
  const id = requestId(context.sequence);
  const jitter = (context.sequence * 29) % 40;
  const scenario = context.scenario ?? 'ok';
  const environment = context.environment ?? 'production';
  const reply = (status: number, body: unknown, latency: number, outcome: Outcome) =>
    finish(status, body, latency, id, outcome, environment);
  switch (endpoint) {
    case 'products': {
      const data =
        scenario === 'outOfStock'
          ? PRODUCTS.map((product, index) => (index === 0 ? { ...product, stock: 0 } : product))
          : PRODUCTS;
      return reply(200, { data, total: data.length }, 38 + jitter, 'products');
    }
    case 'createOrder': {
      if (scenario === 'outOfStock')
        return reply(
          409,
          { error: 'out_of_stock', sku: 'eth-yirgacheffe-250', available: 0 },
          31 + jitter,
          'outOfStock',
        );
      const order = createOrder(context.request, context.sequence);
      if (scenario === 'declined')
        return reply(
          402,
          { error: 'payment_declined', reason: 'insufficient_funds', order: order.body.id },
          order.latency + 90,
          'declined',
        );
      return { ...reply(201, order.body, order.latency, 'created'), order: order.body };
    }
    case 'getOrder':
      return context.lastOrder
        ? reply(200, { ...context.lastOrder, status: 'paid' }, 24 + jitter, 'paid')
        : reply(404, { error: 'order_not_found' }, 18 + jitter, 'notFound');
    case 'webhook':
      return reply(
        200,
        { received: true, order: context.lastOrder?.id ?? null, status: 'paid' },
        41 + jitter,
        'webhook',
      );
  }
}

export function invalidResult(
  status: number,
  body: unknown,
  sequence: number,
  environment: Environment = 'production',
): ApiResult {
  return finish(
    status,
    body,
    12 + ((sequence * 29) % 9),
    requestId(sequence),
    'invalid',
    environment,
  );
}

export function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}
