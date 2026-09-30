import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import { addToCart, cartTotal, cartUnits, reviewCart, setCartQuantity, syncCart } from './cart';
import { relatedProducts } from './catalog';

const product = (id: string, patch: Partial<Product> = {}): Product => ({
  id,
  sku: id,
  name: id,
  price: 12.5,
  stock: 3,
  imageUrl: null,
  category: 'Redes',
  brand: null,
  active: true,
  ...patch,
});

describe('cart operations', () => {
  it('adds several units without exceeding stock', () => {
    const lines = addToCart([], product('a'), 2);
    expect(lines).toEqual([{ product: product('a'), quantity: 2 }]);
    expect(addToCart(lines, product('a'), 5)[0].quantity).toBe(3);
    expect(addToCart([], product('b', { stock: 0 }))).toEqual([]);
    expect(addToCart([], product('a'), 0)).toEqual([]);
  });
  it('sets, clamps and removes quantities', () => {
    const lines = addToCart([], product('a'));
    expect(setCartQuantity(lines, 'a', 10)[0].quantity).toBe(3);
    expect(setCartQuantity(lines, 'a', 0)).toEqual([]);
    expect(setCartQuantity(lines, 'x', 2)).toEqual(lines);
  });
  it('computes units and totals', () => {
    const lines = addToCart(addToCart([], product('a'), 2), product('b', { price: 5 }));
    expect(cartUnits(lines)).toBe(3);
    expect(cartTotal(lines)).toBe(30);
  });
});

describe('related products', () => {
  it('uses the same category and puts stocked products first', () => {
    const current = product('a');
    const list = [
      current,
      product('b', { stock: 0 }),
      product('c'),
      product('d', { category: 'X' }),
    ];
    expect(relatedProducts(current, list).map((p) => p.id)).toEqual(['c', 'b']);
    expect(relatedProducts(product('z', { category: null }), list)).toEqual([]);
  });
});

describe('cart review', () => {
  it('refreshes snapshots and keeps the same array when nothing changed', () => {
    const lines = addToCart([], product('a'), 2);
    expect(syncCart(lines, [product('a')])).toBe(lines);
    const synced = syncCart(lines, [product('a', { price: 20, stock: 1 })]);
    expect(synced[0].product.price).toBe(20);
    expect(synced[0].quantity).toBe(2);
  });
  it('flags unpublished, sold out and excessive lines', () => {
    const lines = [
      { product: product('a', { stock: 1 }), quantity: 2 },
      { product: product('b', { stock: 0 }), quantity: 1 },
      { product: product('c'), quantity: 1 },
      { product: product('d'), quantity: 1 },
    ];
    const issues = reviewCart(lines, [lines[0].product, lines[1].product, lines[3].product]);
    expect(Object.fromEntries(issues)).toEqual({
      a: 'exceeds-stock',
      b: 'out-of-stock',
      c: 'unavailable',
    });
    expect(reviewCart(lines, null).has('c')).toBe(false);
  });
});
