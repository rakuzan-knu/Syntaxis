export interface OrderRequest {
  product: string;
  quantity: number;
  city: string;
  payment: string;
}

export interface OrderResponse {
  status: number;
  latency: number;
  body: {
    id: string;
    status: 'awaiting_payment';
    total: number;
    currency: 'UAH';
    items: { sku: string; quantity: number; price: number }[];
    delivery: { carrier: 'nova_poshta'; city: string; branch: number; eta_days: number };
    payment: { provider: string; url: string };
  };
}

const PRICE = 420;
const SKU = 'eth-yirgacheffe-250';
const ETA: Record<string, number> = { kyiv: 1, lviv: 1, odesa: 2, dnipro: 2 };
const BRANCH: Record<string, number> = { kyiv: 34, lviv: 12, odesa: 7, dnipro: 19 };

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9;

export function clampQuantity(value: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(value)));
}

export function requestBody(request: OrderRequest): string {
  return JSON.stringify(
    {
      items: [{ sku: SKU, quantity: request.quantity }],
      delivery: { carrier: 'nova_poshta', city: request.city },
      payment: { provider: request.payment },
    },
    null,
    2,
  );
}

export function createOrder(request: OrderRequest, sequence: number): OrderResponse {
  const id = `ord_${(46_656 + sequence * 7_919).toString(36).toUpperCase()}`;
  const quantity = clampQuantity(request.quantity);
  return {
    status: 201,
    latency: 62 + ((sequence * 37 + quantity * 11) % 70),
    body: {
      id,
      status: 'awaiting_payment',
      total: PRICE * quantity,
      currency: 'UAH',
      items: [{ sku: SKU, quantity, price: PRICE }],
      delivery: {
        carrier: 'nova_poshta',
        city: request.city,
        branch: BRANCH[request.city] ?? 1,
        eta_days: ETA[request.city] ?? 2,
      },
      payment: { provider: request.payment, url: `https://pay.example/${id}` },
    },
  };
}
