import type { Product } from '../types';
import { parseCsv, toCsv } from './csv';
import { cleanProduct, validateProduct, type ProductInput } from './products';

/**
 * Column order of the product CSV. The first seven match the supplier feed accepted by
 * supplier-service; `active` is optional and defaults to published.
 */
export const productCsvColumns = [
  'sku',
  'name',
  'price',
  'stock',
  'imageUrl',
  'brand',
  'category',
  'active',
] as const;
type Column = (typeof productCsvColumns)[number];
const required: Column[] = ['sku', 'name', 'price', 'stock'];

export const MAX_IMPORT_ROWS = 500;

export type ImportRow = {
  /** Line number in the file, counting the header as line 1. */
  line: number;
  input: ProductInput;
  errors: string[];
  action: 'create' | 'update';
};

export type ImportPreview = { fileErrors: string[]; rows: ImportRow[] };

/** Accepts 1234.5 and 1234,50 (decimal comma); rejects thousands separators. */
function parseNumber(value: string) {
  const text = value.trim();
  if (!/^-?\d+([.,]\d+)?$/.test(text)) return Number.NaN;
  return Number(text.replace(',', '.'));
}

function parseActive(value: string | undefined) {
  const text = (value ?? '').trim().toLowerCase();
  if (!text || ['true', '1', 'si', 'sí', 'yes'].includes(text)) return true;
  if (['false', '0', 'no'].includes(text)) return false;
  return null;
}

const fieldLabels: Record<string, string> = {
  sku: 'SKU',
  name: 'Nombre',
  price: 'Precio',
  stock: 'Stock',
  imageUrl: 'Imagen',
  category: 'Categoría',
  brand: 'Marca',
};

/** Reads a product CSV and checks every row before anything is sent to the backend. */
export function previewProductImport(text: string, publishedSkus: Iterable<string>): ImportPreview {
  const table = parseCsv(text);
  if (!table.length) return { fileErrors: ['El archivo está vacío.'], rows: [] };
  const header = table[0].map((name) => name.trim());
  const index = new Map<string, number>();
  header.forEach((name, position) => {
    const column = productCsvColumns.find((item) => item.toLowerCase() === name.toLowerCase());
    if (column) index.set(column, position);
  });
  const missing = required.filter((column) => !index.has(column));
  if (missing.length)
    return {
      fileErrors: [`Faltan columnas obligatorias: ${missing.join(', ')}.`],
      rows: [],
    };
  const fileErrors: string[] = [];
  const unknown = header.filter(
    (name) => name && !productCsvColumns.some((item) => item.toLowerCase() === name.toLowerCase()),
  );
  if (unknown.length)
    fileErrors.push(`Se ignorarán las columnas desconocidas: ${unknown.join(', ')}.`);
  const body = table.slice(1);
  if (body.length > MAX_IMPORT_ROWS)
    return {
      fileErrors: [
        `El archivo tiene ${body.length} filas; el máximo por importación es ${MAX_IMPORT_ROWS}.`,
      ],
      rows: [],
    };

  const published = new Set(publishedSkus);
  const seen = new Map<string, number>();
  const cell = (row: string[], column: Column) => {
    const position = index.get(column);
    return position === undefined ? '' : (row[position] ?? '');
  };
  const rows = body.map((row, offset): ImportRow => {
    const line = offset + 2;
    const active = parseActive(cell(row, 'active'));
    const input = cleanProduct({
      sku: cell(row, 'sku'),
      name: cell(row, 'name'),
      price: parseNumber(cell(row, 'price')),
      stock: parseNumber(cell(row, 'stock')),
      imageUrl: cell(row, 'imageUrl'),
      category: cell(row, 'category'),
      brand: cell(row, 'brand'),
      active: active ?? true,
    });
    const errors = Object.entries(validateProduct(input)).map(
      ([field, message]) => `${fieldLabels[field] ?? field}: ${message}`,
    );
    if (active === null) errors.push('Activo: usa true/false, sí/no o 1/0.');
    if (input.sku) {
      const first = seen.get(input.sku);
      if (first)
        errors.push(`SKU repetido en el archivo (primera aparición en la línea ${first}).`);
      else seen.set(input.sku, line);
    }
    return { line, input, errors, action: published.has(input.sku) ? 'update' : 'create' };
  });
  if (!rows.length) fileErrors.push('El archivo solo contiene la cabecera.');
  return { fileErrors, rows };
}

/** Exports products in the same format the importer reads, so files can round-trip. */
export function productsToCsv(products: Product[]) {
  return toCsv(
    [...productCsvColumns],
    products.map((product) => [
      product.sku,
      product.name,
      Number(product.price).toFixed(2),
      product.stock,
      product.imageUrl ?? '',
      product.brand ?? '',
      product.category ?? '',
      product.active,
    ]),
  );
}

export const productCsvTemplate = () =>
  toCsv(
    [...productCsvColumns],
    [['SKU-001', 'Nombre del producto', '99.90', 10, '', 'Marca', 'Categoría', 'true']],
  );
