import type { Product } from '../types';
import { normalize } from './catalog';

/**
 * Fibre optic internet plans of Ficon, the partner company. They are monthly services
 * contracted with Ficon, so the store shows them without "Agregar" and with a monthly price.
 */
export function isServicePlan(product: Pick<Product, 'category' | 'brand'>) {
  return /internet|fibra/.test(normalize(product.category ?? '')) || product.brand === 'Ficon';
}

/** Suffix after the price of a monthly plan. */
export const planPriceSuffix = (product: Pick<Product, 'category' | 'brand'>) =>
  isServicePlan(product) ? ' /mes' : '';

/** Contact form prefilled to check the plan's coverage. */
export function planInquiryUrl(product: Pick<Product, 'name'>) {
  return `/contacto?${new URLSearchParams({
    proyecto: `internet de fibra óptica Ficon (${product.name})`,
  })}#formulario`;
}
