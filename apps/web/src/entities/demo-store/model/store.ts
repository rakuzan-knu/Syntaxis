export const STORE_HOST = 'zerno.preview.example';

export type StoreRoute =
  | { page: 'home' }
  | { page: 'catalog' }
  | { page: 'product'; sku: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'order'; id: string }
  | { page: 'notFound'; path: string };

export function normalizePath(input: string): string {
  let path = input.trim();
  path = path.replace(/^https?:\/\//, '');
  if (path.startsWith(STORE_HOST)) path = path.slice(STORE_HOST.length);
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/+$/, '');
  return path === '' ? '/' : path.toLowerCase();
}

export function parseStorePath(input: string, skus: readonly string[]): StoreRoute {
  const path = normalizePath(input);
  if (path === '/') return { page: 'home' };
  if (path === '/catalog') return { page: 'catalog' };
  if (path === '/cart') return { page: 'cart' };
  if (path === '/checkout') return { page: 'checkout' };
  const product = /^\/product\/([\w-]+)$/.exec(path);
  if (product?.[1] && skus.includes(product[1])) return { page: 'product', sku: product[1] };
  const order = /^\/order\/([\w-]+)$/.exec(path);
  if (order?.[1]) return { page: 'order', id: order[1].toUpperCase() };
  return { page: 'notFound', path };
}

export interface CartLine {
  sku: string;
  grind: string;
  weight: string;
  quantity: number;
}

export interface PricedProduct {
  sku: string;
  price: number;
}

export const WEIGHT_FACTOR: Record<string, number> = { '250': 1, '1000': 3.6 };
export const FREE_DELIVERY_FROM = 1000;
export const DELIVERY_FEE = 80;
export const MAX_QUANTITY = 9;

export function lineKey(line: Pick<CartLine, 'sku' | 'grind' | 'weight'>): string {
  return `${line.sku}:${line.grind}:${line.weight}`;
}

export function addToCart(cart: readonly CartLine[], line: CartLine): CartLine[] {
  const key = lineKey(line);
  const existing = cart.find((item) => lineKey(item) === key);
  if (!existing) return [...cart, { ...line, quantity: Math.min(line.quantity, MAX_QUANTITY) }];
  return cart.map((item) =>
    lineKey(item) === key
      ? { ...item, quantity: Math.min(item.quantity + line.quantity, MAX_QUANTITY) }
      : item,
  );
}

export function setQuantity(cart: readonly CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return cart.filter((item) => lineKey(item) !== key);
  return cart.map((item) =>
    lineKey(item) === key ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) } : item,
  );
}

export function unitPrice(line: CartLine, products: readonly PricedProduct[]): number {
  const base = products.find((product) => product.sku === line.sku)?.price ?? 0;
  return Math.round(base * (WEIGHT_FACTOR[line.weight] ?? 1));
}

export function cartTotals(cart: readonly CartLine[], products: readonly PricedProduct[]) {
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + unitPrice(line, products) * line.quantity, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { count, subtotal, delivery, total: subtotal + delivery };
}

export function orderNumber(sequence: number): string {
  return (60_466_176 + sequence * 7_919_311).toString(36).toUpperCase().slice(-6);
}

export function defaultLine(sku: string): CartLine {
  return { sku, grind: 'beans', weight: '250', quantity: 1 };
}

export function formatPrice(value: number, currency: string): string {
  return `${value.toLocaleString('uk-UA').replace(/\s/g, ' ')} ${currency}`;
}
