import type { Product } from '../types';

export type CatalogGroup = { name: string; count: number };

/** Groups the catalog by category or brand, most populated first. */
export function groupProducts(products: Product[], key: 'category' | 'brand'): CatalogGroup[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const value = product[key];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
}

/**
 * The backend has no "featured" flag, so the selection prefers products in stock and
 * spreads them across categories before repeating one.
 */
export function pickFeatured(products: Product[], limit: number): Product[] {
  const inStock = products.filter((product) => product.stock > 0);
  const pool = inStock.length ? inStock : products;
  const seen = new Set<string | null>();
  const firstOfCategory: Product[] = [];
  const rest: Product[] = [];
  for (const product of pool) {
    if (seen.has(product.category)) rest.push(product);
    else {
      seen.add(product.category);
      firstOfCategory.push(product);
    }
  }
  return [...firstOfCategory, ...rest].slice(0, limit);
}

/** The backend has no promotions, so "Ofertas" lists the cheapest products in stock. */
export function lowestPriced(products: Product[], limit: number): Product[] {
  return products
    .filter((product) => product.stock > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, limit);
}

export const productCount = (count: number) => `${count} ${count === 1 ? 'producto' : 'productos'}`;

export type SortKey = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre';
export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'relevancia', label: 'Recomendados' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre: A a Z' },
];

export type CatalogFilters = {
  query: string;
  category: string;
  brand: string;
  onlyAvailable: boolean;
  /** Price range in soles; null when that bound is not set. */
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
};

/** URL parameters shared by the header search, the Home links and the catalog. */
export const catalogParams = {
  query: 'q',
  category: 'categoria',
  brand: 'marca',
  onlyAvailable: 'disponible',
  minPrice: 'desde',
  maxPrice: 'hasta',
  sort: 'orden',
  page: 'pagina',
} as const;

const readPrice = (value: string | null) => {
  const amount = value ? Number(value) : NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

export function readFilters(params: URLSearchParams): CatalogFilters {
  const sort = params.get(catalogParams.sort);
  return {
    query: params.get(catalogParams.query) ?? '',
    category: params.get(catalogParams.category) ?? '',
    brand: params.get(catalogParams.brand) ?? '',
    onlyAvailable: params.get(catalogParams.onlyAvailable) === '1',
    minPrice: readPrice(params.get(catalogParams.minPrice)),
    maxPrice: readPrice(params.get(catalogParams.maxPrice)),
    sort: sortOptions.some((option) => option.value === sort) ? (sort as SortKey) : 'relevancia',
  };
}

/** Lowercases and removes accents so "camara" also finds "Cámara". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function matchesQuery(product: Product, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalize(
    [product.name, product.sku, product.brand ?? '', product.category ?? ''].join(' '),
  );
  return terms.every((term) => haystack.includes(term));
}

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const result = products.filter(
    (product) =>
      matchesQuery(product, filters.query) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.brand || product.brand === filters.brand) &&
      (!filters.onlyAvailable || product.stock > 0) &&
      (filters.minPrice === null || Number(product.price) >= filters.minPrice) &&
      (filters.maxPrice === null || Number(product.price) <= filters.maxPrice),
  );
  const byPrice = (a: Product, b: Product) => Number(a.price) - Number(b.price);
  if (filters.sort === 'precio-asc') result.sort(byPrice);
  if (filters.sort === 'precio-desc') result.sort((a, b) => byPrice(b, a));
  if (filters.sort === 'nombre') result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return result;
}

export function paginate<T>(items: T[], requestedPage: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), pages);
  return { items: items.slice((page - 1) * size, page * size), page, pages };
}

/** Products sharing the category (or the brand when there is no category), in stock first. */
export function relatedProducts(product: Product, products: Product[], limit = 4): Product[] {
  const key: 'category' | 'brand' | null = product.category
    ? 'category'
    : product.brand
      ? 'brand'
      : null;
  if (!key) return [];
  return products
    .filter((other) => other.id !== product.id && other[key] === product[key])
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
    .slice(0, limit);
}
