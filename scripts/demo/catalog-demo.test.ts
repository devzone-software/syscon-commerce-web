import { describe, expect, it } from 'vitest';
import { validateProduct, type ProductInput } from '../../resources/js/lib/products';
import raw from './catalog-demo.jsonl?raw';

const products = raw
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line) as ProductInput);

describe('demo catalog data', () => {
  it('has 25 products that are easy to identify and unique by SKU', () => {
    expect(products).toHaveLength(25);
    expect(products.every((product) => product.sku.startsWith('DEMO-'))).toBe(true);
    expect(new Set(products.map((product) => product.sku)).size).toBe(products.length);
  });
  it('only uses the fields accepted by CatalogService.ProductInput', () => {
    const fields = ['sku', 'name', 'price', 'stock', 'imageUrl', 'category', 'brand', 'active'];
    for (const product of products) expect(Object.keys(product)).toEqual(fields);
  });
  it('passes the same validation as the backoffice form', () => {
    for (const product of products) expect(validateProduct(product), product.sku).toEqual({});
  });
  it('covers high, low and zero stock plus an unpublished product', () => {
    expect(products.some((product) => product.stock >= 100)).toBe(true);
    expect(products.some((product) => product.stock > 0 && product.stock <= 3)).toBe(true);
    expect(products.some((product) => product.stock === 0 && product.active)).toBe(true);
    expect(products.some((product) => !product.active)).toBe(true);
  });
});
