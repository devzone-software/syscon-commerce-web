import { productSpecifications } from './catalog';
import type { Product } from '../types';

/** Seed identifiers stay intact for storage and imports; public views omit fictitious brands. */
export const publicBrand = (product: Pick<Product, 'brand'>) =>
  product.brand && !/^demo\b/i.test(product.brand.trim()) ? product.brand : null;
export const publicProductCode = (product: Pick<Product, 'sku'>) =>
  product.sku.replace(/^DEMO-/i, '');

export const productHighlights = (product: Pick<Product, 'specifications'>) =>
  productSpecifications(product.specifications)
    .filter((entry) => entry.label && !/^(marca|sku)$/i.test(entry.label))
    .slice(0, 2)
    .map((entry) => entry.text);
