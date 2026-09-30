import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import { toCsv } from './csv';
import { stockBy, stockTotals } from './inventory';

const product = (id: string, patch: Partial<Product>): Product => ({
  id,
  sku: id,
  name: id,
  price: 10,
  stock: 1,
  imageUrl: null,
  category: null,
  brand: null,
  active: true,
  ...patch,
});
const products = [
  product('a', { stock: 3, price: 20, category: 'Redes' }),
  product('b', { stock: 0, price: 99, category: 'Redes' }),
  product('c', { stock: 2, price: 5 }),
];

describe('inventory figures', () => {
  it('totals units, sold out products and value at sale price', () => {
    expect(stockTotals(products)).toEqual({ products: 3, units: 5, outOfStock: 1, saleValue: 70 });
  });
  it('groups by category with a bucket for unassigned products', () => {
    expect(stockBy(products, 'category')).toEqual([
      { name: 'Redes', products: 2, units: 3, outOfStock: 1, saleValue: 60 },
      { name: 'Sin asignar', products: 1, units: 2, outOfStock: 0, saleValue: 10 },
    ]);
  });
  it('quotes CSV cells that contain separators or quotes', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'di "hola"']])).toBe('a;b\r\n"x;y";"di ""hola"""');
  });
});
