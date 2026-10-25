import { describe, expect, it } from 'vitest';
import {
  addToCart,
  cartTotals,
  formatPrice,
  lineKey,
  normalizePath,
  orderNumber,
  parseStorePath,
  setQuantity,
} from '../model/store';

const SKUS = ['ethiopia', 'colombia'];
const PRODUCTS = [
  { sku: 'ethiopia', price: 420 },
  { sku: 'colombia', price: 380 },
];
const line = { sku: 'ethiopia', grind: 'beans', weight: '250', quantity: 1 };

describe('routes', () => {
  it('normalises full URLs and trailing slashes', () => {
    expect(normalizePath('https://zerno.preview.example/Cart/')).toBe('/cart');
    expect(normalizePath('catalog')).toBe('/catalog');
    expect(normalizePath('')).toBe('/');
  });

  it('parses every store page', () => {
    expect(parseStorePath('/', SKUS)).toEqual({ page: 'home' });
    expect(parseStorePath('/product/colombia', SKUS)).toEqual({ page: 'product', sku: 'colombia' });
    expect(parseStorePath('/order/ab12cd', SKUS)).toEqual({ page: 'order', id: 'AB12CD' });
    expect(parseStorePath('/product/unknown', SKUS)).toEqual({
      page: 'notFound',
      path: '/product/unknown',
    });
  });
});

describe('cart', () => {
  it('merges identical lines and caps quantity', () => {
    let cart = addToCart([], line);
    cart = addToCart(cart, { ...line, quantity: 20 });
    expect(cart).toHaveLength(1);
    expect(cart[0]?.quantity).toBe(9);
  });

  it('keeps different grinds as separate lines and removes at zero', () => {
    let cart = addToCart(addToCart([], line), { ...line, grind: 'espresso' });
    expect(cart).toHaveLength(2);
    cart = setQuantity(cart, lineKey(line), 0);
    expect(cart.map((item) => item.grind)).toEqual(['espresso']);
  });

  it('charges delivery below the free threshold and applies the weight factor', () => {
    expect(cartTotals([line], PRODUCTS)).toEqual({
      count: 1,
      subtotal: 420,
      delivery: 80,
      total: 500,
    });
    const kilo = { ...line, weight: '1000' };
    expect(cartTotals([kilo], PRODUCTS)).toEqual({
      count: 1,
      subtotal: 1512,
      delivery: 0,
      total: 1512,
    });
    expect(cartTotals([], PRODUCTS).total).toBe(0);
  });

  it('issues distinct order numbers', () => {
    expect(orderNumber(1)).not.toBe(orderNumber(2));
    expect(orderNumber(1)).toMatch(/^[0-9A-Z]{6}$/);
  });
});

describe('formatting', () => {
  it('formats prices with thin-space grouping', () => {
    expect(formatPrice(420, '₴')).toBe('420 ₴');
    expect(formatPrice(1512, '₴')).toBe('1 512 ₴');
  });
});
