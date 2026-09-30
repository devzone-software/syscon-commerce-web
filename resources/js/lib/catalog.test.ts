import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import { filterProducts, groupProducts, paginate, pickFeatured, readFilters } from './catalog';

const product = (id: string, patch: Partial<Product> = {}): Product => ({
  id,
  sku: `SKU-${id}`,
  name: `Producto ${id}`,
  price: 10,
  stock: 1,
  imageUrl: null,
  category: null,
  brand: null,
  active: true,
  ...patch,
});
const catalog = [
  product('1', { name: 'Cámara IP', price: 300, category: 'Seguridad', brand: 'Hikvision' }),
  product('2', { name: 'Router AX', price: 150, category: 'Redes', brand: 'TP-Link', stock: 0 }),
  product('3', { name: 'Switch 8 puertos', price: 90, category: 'Redes', brand: 'TP-Link' }),
];
const base = readFilters(new URLSearchParams());

describe('catalog filters', () => {
  it('reads defaults and ignores unknown sort values', () => {
    expect(base).toEqual({
      query: '',
      category: '',
      brand: '',
      onlyAvailable: false,
      sort: 'relevancia',
    });
    expect(readFilters(new URLSearchParams('orden=otro&disponible=1')).onlyAvailable).toBe(true);
    expect(readFilters(new URLSearchParams('orden=otro')).sort).toBe('relevancia');
  });
  it('searches without accents across name, sku, brand and category', () => {
    expect(filterProducts(catalog, { ...base, query: 'camara' }).map((p) => p.id)).toEqual(['1']);
    expect(filterProducts(catalog, { ...base, query: 'tp-link redes' })).toHaveLength(2);
    expect(filterProducts(catalog, { ...base, query: 'sku-3' }).map((p) => p.id)).toEqual(['3']);
  });
  it('combines category, brand and availability', () => {
    const filters = { ...base, category: 'Redes', brand: 'TP-Link', onlyAvailable: true };
    expect(filterProducts(catalog, filters).map((p) => p.id)).toEqual(['3']);
  });
  it('sorts by price and name without mutating the source', () => {
    expect(filterProducts(catalog, { ...base, sort: 'precio-asc' }).map((p) => p.id)).toEqual([
      '3',
      '2',
      '1',
    ]);
    expect(filterProducts(catalog, { ...base, sort: 'precio-desc' })[0].id).toBe('1');
    expect(filterProducts(catalog, { ...base, sort: 'nombre' })[0].id).toBe('1');
    expect(catalog.map((p) => p.id)).toEqual(['1', '2', '3']);
  });
  it('clamps pagination', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 3, 12)).toEqual({ items: [24], page: 3, pages: 3 });
    expect(paginate(items, 99, 12).page).toBe(3);
    expect(paginate([], 1, 12)).toEqual({ items: [], page: 1, pages: 1 });
  });
});

describe('catalog summary', () => {
  it('groups by category and prefers stocked products across categories', () => {
    expect(groupProducts(catalog, 'category')).toEqual([
      { name: 'Redes', count: 2 },
      { name: 'Seguridad', count: 1 },
    ]);
    expect(pickFeatured(catalog, 8).map((p) => p.id)).toEqual(['1', '3']);
  });
});
