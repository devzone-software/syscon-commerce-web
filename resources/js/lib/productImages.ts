import type { AdminProduct } from '../types';
import { parseCsv } from './csv';
import { toProductInput } from './products';
import { isHttpUrl } from './validation';

export type ImageRow = {
  line: number;
  sku: string;
  imageUrl: string | null;
  product?: AdminProduct;
  errors: string[];
};
export function previewImages(text: string, products: AdminProduct[]): ImageRow[] {
  const table = parseCsv(text);
  const headers = table.shift()?.map((s) => s.trim()) ?? [];
  if (
    !headers.includes('sku') ||
    !headers.includes('imageUrl') ||
    new Set(headers).size !== headers.length ||
    headers.some((h) => !['sku', 'imageUrl', 'action'].includes(h))
  )
    throw Error(
      'Usa las columnas sku, imageUrl y, opcionalmente, action. No incluyas precios ni stock.',
    );
  if (!table.length || table.length > 500)
    throw Error('El archivo debe contener entre 1 y 500 productos.');
  const seen = new Set<string>();
  return table.map((cells, index) => {
    const sku = cells[headers.indexOf('sku')]?.trim() ?? '';
    const url = cells[headers.indexOf('imageUrl')]?.trim() ?? '';
    const action = headers.includes('action')
      ? cells[headers.indexOf('action')]?.trim() || 'replace'
      : 'replace';
    const product = products.find((p) => p.sku === sku);
    const errors: string[] = [];
    if (cells.length !== headers.length) errors.push('Cantidad de columnas incorrecta.');
    if (!product) errors.push('SKU no encontrado.');
    if (seen.has(sku)) errors.push('SKU repetido en el archivo.');
    seen.add(sku);
    if (!['replace', 'remove'].includes(action)) errors.push('action debe ser replace o remove.');
    if (action === 'remove' && url) errors.push('Para quitar, deja imageUrl vacío.');
    if (action !== 'remove' && (!isHttpUrl(url) || url.length > 2048))
      errors.push('Ingresa un enlace http o https. Para quitar usa action=remove.');
    return { line: index + 2, sku, imageUrl: action === 'remove' ? null : url, product, errors };
  });
}

/** Existing API updates the whole product: refuse if the reviewed record has changed. */
export function imageUpdate(row: ImageRow, current: AdminProduct[]) {
  const fresh = current.find((p) => p.sku === row.sku);
  if (!fresh || !row.product || row.errors.length)
    throw Error('Producto no disponible para actualizar.');
  if (JSON.stringify(fresh) !== JSON.stringify(row.product))
    throw Error('El producto cambió desde la revisión. Vuelve a cargar el archivo.');
  return { ...toProductInput(fresh), imageUrl: row.imageUrl };
}
