import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import {
  filterProducts,
  catalogSearchQuery,
  groupProducts,
  pageNumbers,
  paginate,
  pickFeatured,
  lowestAvailablePrice,
  readFilters,
  productSpecifications,
  productInquiryUrl,
  catalogPriceBounds,
  cableLength,
} from './catalog';

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

describe('contextual product presentation', () => {
  it('uses category and availability for prices without shrinking the range to an active price filter', () => {
    expect(catalogPriceBounds(catalog, { ...base, category: 'Redes', minPrice: 100 })).toEqual([
      90, 150,
    ]);
    expect(
      catalogPriceBounds(catalog, { ...base, category: 'Redes', onlyAvailable: true }),
    ).toEqual([90, 90]);
    expect(catalogPriceBounds(catalog, { ...base, category: 'Missing' })).toEqual([0, 0]);
  });
  it('does not invent cable lengths from SKUs or other product categories', () => {
    expect(cableLength({ category: 'Cables de red', name: 'Cable Cat 6 de 5 metros' })).toBe('5 m');
    expect(cableLength({ category: 'Cables de red', name: 'Cable de 1.5m' })).toBe('1,5 m');
    expect(cableLength({ category: 'Cables de red', name: 'Cable Cat 6' })).toBeNull();
    expect(cableLength({ category: 'Memorias', name: 'Memoria 5 metros' })).toBeNull();
  });
});

describe('published product information', () => {
  it('keeps free text and separates only complete label/value pairs', () => {
    expect(productSpecifications(null)).toEqual([]);
    expect(
      productSpecifications(
        ' \r\n Puertos: 8 \r\n Compatible con: A:B\nSin datos estructurados\nModelo: ',
      ),
    ).toEqual([
      { text: 'Puertos: 8', label: 'Puertos', value: '8' },
      { text: 'Compatible con: A:B', label: 'Compatible con', value: 'A:B' },
      { text: 'Sin datos estructurados', label: null, value: 'Sin datos estructurados' },
      { text: 'Modelo:', label: null, value: 'Modelo:' },
    ]);
  });
  it('preserves product names and SKUs containing query characters in an inquiry', () => {
    const input = { name: 'Router A&B / Wi-Fi + 6', sku: 'R#01?x=2' };
    const url = new URL(productInquiryUrl(input), 'https://example.test');
    expect(url.pathname).toBe('/contacto');
    expect(url.searchParams.get('producto')).toBe(input.name);
    expect(url.searchParams.get('sku')).toBe(input.sku);
    expect(url.hash).toBe('#formulario');
  });
});

describe('catalog filters', () => {
  it('preserves category, availability and sorting when searching, and resets the page', () => {
    const query = catalogSearchQuery(
      '?categoria=Redes&disponible=1&orden=precio-asc&pagina=3',
      ' cable ',
    );
    expect(query).toBe('?categoria=Redes&disponible=1&orden=precio-asc&q=cable');
  });
  it('clears only the search and page while keeping other filters', () => {
    expect(catalogSearchQuery('?q=cable&marca=MarcaA&pagina=2', '  ')).toBe('?marca=MarcaA');
    expect(catalogSearchQuery('?q=cable&pagina=2', '')).toBe('');
  });
  it('reads defaults and ignores unknown sort values', () => {
    expect(base).toEqual({
      query: '',
      category: '',
      brand: '',
      onlyAvailable: false,
      minPrice: null,
      maxPrice: null,
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
  it('filters by price range and ignores invalid bounds', () => {
    const range = readFilters(new URLSearchParams('desde=100&hasta=200'));
    expect(filterProducts(catalog, range).map((p) => p.id)).toEqual(['2']);
    expect(readFilters(new URLSearchParams('desde=abc&hasta=-5'))).toMatchObject({
      minPrice: null,
      maxPrice: null,
    });
  });
  it('combines category, brand and availability', () => {
    const filters = { ...base, category: 'Redes', brand: 'TP-Link', onlyAvailable: true };
    expect(filterProducts(catalog, filters).map((p) => p.id)).toEqual(['3']);
  });
  it('sorts by price and name without mutating the source', () => {
    expect(filterProducts(catalog, base).map((p) => p.id)).toEqual(['1', '3', '2']);
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

describe('catalog pagination', () => {
  it('lists every page when there are few and adds gaps otherwise', () => {
    expect(pageNumbers(1, 3)).toEqual([1, 2, 3]);
    expect(pageNumbers(1, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
    expect(pageNumbers(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(pageNumbers(12, 12)).toEqual([1, null, 8, 9, 10, 11, 12]);
  });
});

describe('home catalog price', () => {
  it('excludes unavailable and inactive products from the advertised starting price', () => {
    expect(
      lowestAvailablePrice([
        product('hidden', { active: false, price: 1 }),
        product('out', { stock: 0, price: 2 }),
        product('available', { price: 49.9 }),
        product('higher', { price: 100 }),
      ]),
    ).toBe(49.9);
  });
  it('does not advertise a starting price without a valid available product', () => {
    expect(lowestAvailablePrice([])).toBeNull();
    expect(lowestAvailablePrice([product('out', { stock: 0 })])).toBeNull();
    expect(lowestAvailablePrice([product('invalid', { price: NaN })])).toBeNull();
    expect(lowestAvailablePrice([product('free', { price: 0 })])).toBe(0);
  });
});
