import { describe, expect, it } from 'vitest';
import { cleanProduct, emptyProduct, toProductInput, validateProduct } from './products';
import { isUuid } from './validation';

describe('product form rules', () => {
  it('requires sku, name, non negative price and integer stock', () => {
    expect(Object.keys(validateProduct({ ...emptyProduct, price: -1, stock: 1.5 }))).toEqual([
      'sku',
      'name',
      'price',
      'stock',
    ]);
    expect(validateProduct({ ...emptyProduct, sku: 'A', name: 'B' })).toEqual({});
  });
  it('rejects invalid image urls and trims optional fields to null', () => {
    const input = { ...emptyProduct, sku: ' A ', name: 'B', imageUrl: 'ftp://x', brand: '  ' };
    expect(validateProduct(input).imageUrl).toBeDefined();
    expect(cleanProduct(input)).toMatchObject({ sku: 'A', brand: null, category: null });
  });
  it('drops the id when editing an existing product', () => {
    const product = { ...emptyProduct, id: 'x', price: '10.50' as unknown as number };
    expect(toProductInput(product)).toEqual({ ...emptyProduct, price: 10.5 });
  });
  it('validates the UUIDs used by the lookups', () => {
    expect(isUuid('0b7f1c2e-8a4d-4f5e-9c1b-2d3e4f5a6b7c')).toBe(true);
    expect(isUuid('pedido-1')).toBe(false);
  });
});
