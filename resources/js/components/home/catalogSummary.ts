import type { Product } from '../../types';

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

export const productCount = (count: number) => `${count} ${count === 1 ? 'producto' : 'productos'}`;
