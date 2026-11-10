import type { Product } from '../types';

export type CatalogGroup = { name: string; count: number };

/** Preserve free text while separating published "label: value" characteristics. */
export function productSpecifications(value?: string | null) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => {
      const colon = text.indexOf(':');
      const label = text.slice(0, colon).trim();
      const value = text.slice(colon + 1).trim();
      return colon > 0 && value ? { text, label, value } : { text, label: null, value: text };
    });
}

export function productInquiryUrl(product: Pick<Product, 'name' | 'sku'>) {
  return `/contacto?${new URLSearchParams({ producto: product.name, sku: product.sku })}#formulario`;
}

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

/** Lowest current price among purchasable products; this is not a promotional discount. */
export function lowestAvailablePrice(products: Product[]): number | null {
  let lowest: number | null = null;
  for (const product of products) {
    const price = Number(product.price);
    if (
      product.active &&
      product.stock > 0 &&
      Number.isFinite(price) &&
      price >= 0 &&
      (lowest === null || price < lowest)
    )
      lowest = price;
  }
  return lowest;
}

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

/** Search changes reset pagination while preserving the user's other filters. */
export function catalogSearchQuery(search: string, query: string): string {
  const params = new URLSearchParams(search);
  const value = query.trim();
  if (value) params.set(catalogParams.query, value);
  else params.delete(catalogParams.query);
  params.delete(catalogParams.page);
  const result = params.toString();
  return result ? `?${result}` : '';
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

/** Page numbers with gaps, e.g. 1 2 3 4 5 … 12. */
export function pageNumbers(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const around = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach((n) => around.add(n));
  if (page >= pages - 3) [pages - 4, pages - 3, pages - 2, pages - 1].forEach((n) => around.add(n));
  const sorted = [...around].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return sorted.flatMap((n, index) => (index && n - sorted[index - 1] > 1 ? [null, n] : [n]));
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

/** "Cable UTP Cat 6 de 5 metros" → 5 m and the name without the length. */
const LENGTH = /\s*(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(?:m|mts?|metros?)\b\.?/i;

export function productLength(name: string): { meters: number; base: string } | null {
  const match = name.match(LENGTH);
  if (!match) return null;
  const meters = Number(match[1].replace(',', '.'));
  const base = normalize(name.replace(LENGTH, ' ')).replace(/\s+/g, ' ').trim();
  return meters > 0 ? { meters, base } : null;
}

export type LengthVariant = { product: Product; meters: number };

/**
 * Lengths the customer can choose for a product sold per length (cables): the same
 * product name and category published with other lengths. Empty when there is only one.
 */
export function lengthVariants(product: Product, products: Product[]): LengthVariant[] {
  const own = productLength(product.name);
  if (!own) return [];
  const seen = new Set<number>();
  const variants = [product, ...products.filter((other) => other.id !== product.id)]
    .filter((other) => other.active !== false && other.category === product.category)
    .map((other) => ({ product: other, length: productLength(other.name) }))
    .filter(
      (item): item is { product: Product; length: { meters: number; base: string } } =>
        item.length !== null && item.length.base === own.base,
    )
    .filter(({ length }) => !seen.has(length.meters) && seen.add(length.meters))
    .map(({ product: item, length }) => ({ product: item, meters: length.meters }))
    .sort((a, b) => a.meters - b.meters);
  return variants.length > 1 ? variants : [];
}

/** Searches suggested next to the results, built from the catalog the customer is browsing. */
export function relatedSearches(products: Product[], query: string, limit = 8): string[] {
  const asked = normalize(query).trim();
  const matches = asked ? products.filter((product) => matchesQuery(product, query)) : [];
  const categories = new Set(matches.map((product) => product.category).filter(Boolean));
  const pool = matches.length
    ? products.filter((product) => matches.includes(product) || categories.has(product.category))
    : products;
  const terms = new Map<string, string>();
  const add = (text?: string | null) => {
    const value = (text ?? '')
      .replace(/\(.*?\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const key = normalize(value);
    if (value && key !== asked && !terms.has(key)) terms.set(key, value);
  };
  // Products sharing a word with the matches, e.g. "Cat 6" links cables with RJ45 connectors.
  const words = new Set(
    matches.flatMap((product) =>
      normalize(product.name.replace(LENGTH, ' '))
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !asked.includes(word)),
    ),
  );
  const nearby = products.filter(
    (product) =>
      !pool.includes(product) &&
      normalize(product.name)
        .split(/[^a-z0-9]+/)
        .some((word) => words.has(word)),
  );
  for (const product of pool) add(product.name.replace(LENGTH, ' ').replace(/\s+/g, ' '));
  for (const product of pool) add(product.category);
  for (const product of nearby) add(product.name);
  for (const product of nearby) add(product.category);
  for (const product of pool) add(product.brand);
  return [...terms.values()].slice(0, limit);
}
