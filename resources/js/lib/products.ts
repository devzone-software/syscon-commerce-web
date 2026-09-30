import type { Product } from '../types';
import { isHttpUrl } from './validation';

export type ProductInput = Omit<Product, 'id'>;

export const emptyProduct: ProductInput = {
  sku: '',
  name: '',
  price: 0,
  stock: 0,
  imageUrl: null,
  category: null,
  brand: null,
  active: true,
};

export const toProductInput = ({ id: _id, ...product }: Product): ProductInput => ({
  ...product,
  price: Number(product.price),
});

/** Mirrors the rules of CatalogGatewayController::saveProduct and CatalogService.ProductInput. */
export function validateProduct(input: ProductInput): Partial<Record<keyof ProductInput, string>> {
  const errors: Partial<Record<keyof ProductInput, string>> = {};
  if (!input.sku.trim()) errors.sku = 'El SKU es obligatorio.';
  else if (input.sku.length > 100) errors.sku = 'Máximo 100 caracteres.';
  if (!input.name.trim()) errors.name = 'El nombre es obligatorio.';
  else if (input.name.length > 255) errors.name = 'Máximo 255 caracteres.';
  if (!Number.isFinite(input.price) || input.price < 0)
    errors.price = 'Ingresa un precio mayor o igual a 0.';
  if (!Number.isInteger(input.stock) || input.stock < 0)
    errors.stock = 'Ingresa un número entero mayor o igual a 0.';
  if (input.imageUrl && !isHttpUrl(input.imageUrl))
    errors.imageUrl = 'Ingresa una URL válida (http o https).';
  if (input.category && input.category.length > 100) errors.category = 'Máximo 100 caracteres.';
  if (input.brand && input.brand.length > 100) errors.brand = 'Máximo 100 caracteres.';
  return errors;
}

export const cleanProduct = (input: ProductInput): ProductInput => ({
  ...input,
  sku: input.sku.trim(),
  name: input.name.trim(),
  imageUrl: input.imageUrl?.trim() || null,
  category: input.category?.trim() || null,
  brand: input.brand?.trim() || null,
});
