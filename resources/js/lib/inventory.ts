import type { Product } from '../types';

/**
 * catalog-service keeps one stock figure per product (Inventory.available): there are no
 * warehouses or movements yet, so every figure here is a global, current snapshot.
 */
export type StockSummary = {
  name: string;
  products: number;
  units: number;
  outOfStock: number;
  /** Units × current sale price; not a cost valuation. */
  saleValue: number;
};

export function stockTotals(products: Product[]): Omit<StockSummary, 'name'> {
  return products.reduce(
    (total, product) => ({
      products: total.products + 1,
      units: total.units + Math.max(0, product.stock),
      outOfStock: total.outOfStock + (product.stock < 1 ? 1 : 0),
      saleValue: total.saleValue + Math.max(0, product.stock) * Number(product.price),
    }),
    { products: 0, units: 0, outOfStock: 0, saleValue: 0 },
  );
}

export function stockBy(products: Product[], key: 'category' | 'brand'): StockSummary[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const name = product[key] ?? 'Sin asignar';
    groups.set(name, [...(groups.get(name) ?? []), product]);
  }
  return [...groups]
    .map(([name, items]) => ({ name, ...stockTotals(items) }))
    .sort((a, b) => b.saleValue - a.saleValue || a.name.localeCompare(b.name, 'es'));
}

/** Builds a CSV (semicolon separated, as used in Peru's spreadsheet locale) with quoting. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  // The BOM lets spreadsheet applications detect UTF-8 accents.
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
