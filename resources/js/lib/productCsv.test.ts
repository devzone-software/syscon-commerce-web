import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import { parseCsv } from './csv';
import { MAX_IMPORT_ROWS, previewProductImport, productsToCsv } from './productCsv';

const header = 'sku;name;price;stock;imageUrl;brand;category;active';

describe('csv parsing', () => {
  it('handles quotes, escaped quotes, CRLF, BOM and comma delimiters', () => {
    expect(parseCsv('﻿a;b\r\n"x;1";"di ""hola"""\r\n\r\n')).toEqual([
      ['a', 'b'],
      ['x;1', 'di "hola"'],
    ]);
    expect(parseCsv('a,b\n1,"2,5"')).toEqual([
      ['a', 'b'],
      ['1', '2,5'],
    ]);
  });
});

describe('product import preview', () => {
  it('parses valid rows and tells creates from updates', () => {
    const csv = `${header}\nA1;Router;189,90;5;;Marca;Redes;sí\nB2;Switch;99.5;0;;;;false`;
    const { fileErrors, rows } = previewProductImport(csv, ['B2']);
    expect(fileErrors).toEqual([]);
    expect(rows.map((row) => [row.line, row.action, row.errors])).toEqual([
      [2, 'create', []],
      [3, 'update', []],
    ]);
    expect(rows[0].input).toMatchObject({ price: 189.9, stock: 5, active: true, imageUrl: null });
    expect(rows[1].input).toMatchObject({ active: false, brand: null, category: null });
  });
  it('accepts headers in any order and without optional columns', () => {
    const { rows } = previewProductImport('Stock,SKU,Price,Name\n3,C3,10,Cable', []);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].input).toMatchObject({ sku: 'C3', name: 'Cable', price: 10, stock: 3 });
  });
  it('reports invalid values, repeated SKUs and bad active flags per row', () => {
    const csv = `${header}\nA1;Router;1.234,50;2.5;ftp://x;;;tal vez\nA1;;10;1;;;;`;
    const [first, second] = previewProductImport(csv, []).rows;
    expect(first.errors.join(' ')).toMatch(/Precio.*Stock.*Imagen.*Activo/);
    expect(second.errors.join(' ')).toMatch(/Nombre.*SKU repetido.*línea 2/);
  });
  it('rejects files without required columns or over the row limit', () => {
    expect(previewProductImport('sku;name\nA;B', []).fileErrors[0]).toMatch(/price, stock/);
    const big = [header, ...Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `S${i};N;1;1`)];
    expect(previewProductImport(big.join('\n'), []).fileErrors[0]).toMatch(/máximo/);
    expect(previewProductImport('', []).fileErrors).toEqual(['El archivo está vacío.']);
  });
  it('round-trips the exported catalog', () => {
    const product: Product = {
      id: '1',
      sku: 'X;1',
      name: 'Cable "Cat 6"',
      price: 14.9,
      stock: 3,
      imageUrl: null,
      category: 'Cables de red',
      brand: null,
      active: true,
    };
    const { rows } = previewProductImport(productsToCsv([product]), ['X;1']);
    expect(rows[0]).toMatchObject({ action: 'update', errors: [] });
    expect(rows[0].input).toMatchObject({ sku: 'X;1', name: 'Cable "Cat 6"', price: 14.9 });
  });
});
