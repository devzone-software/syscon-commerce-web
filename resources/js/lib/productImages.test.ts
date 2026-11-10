import { describe, it, expect } from 'vitest';
import { previewImages, imageUpdate } from './productImages';
import type { AdminProduct } from '../types';
const product: AdminProduct = {
  id: '1',
  sku: 'ROUTER-1',
  name: 'Router',
  price: 45,
  stock: 3,
  physicalStock: 5,
  reservedStock: 2,
  imageUrl: 'https://example.com/old.jpg',
  active: false,
  category: 'Redes',
  brand: 'Marca',
  description: 'Descripción',
  specifications: 'Wi-Fi',
};
describe('image-only CSV review', () => {
  it('preserves every existing product field and physical stock when replacing an image', () => {
    const row = previewImages('sku;imageUrl\nROUTER-1;https://example.com/new.jpg', [product])[0];
    expect(row.errors).toEqual([]);
    expect(imageUpdate(row, [product])).toEqual({
      sku: 'ROUTER-1',
      name: 'Router',
      price: 45,
      stock: 5,
      imageUrl: 'https://example.com/new.jpg',
      active: false,
      category: 'Redes',
      brand: 'Marca',
      description: 'Descripción',
      specifications: 'Wi-Fi',
    });
  });
  it('requires explicit removal, rejects unknown and repeated SKUs and non-http images', () => {
    expect(previewImages('sku;imageUrl\nROUTER-1;', [product])[0].errors.length).toBeGreaterThan(0);
    const remove = previewImages('sku;imageUrl;action\nROUTER-1;;remove', [product])[0];
    expect(remove.errors).toEqual([]);
    expect(imageUpdate(remove, [product]).imageUrl).toBeNull();
    expect(
      previewImages('sku,imageUrl\nUNKNOWN,https://example.com/a.jpg', [product])[0].errors,
    ).toContain('SKU no encontrado.');
    const rows = previewImages(
      'sku;imageUrl\nROUTER-1;javascript:bad\nROUTER-1;https://example.com/a.jpg',
      [product],
    );
    expect(rows.every((r) => r.errors.length > 0)).toBe(true);
  });
  it('rejects columns that could change unrelated data and changed reviewed products', () => {
    expect(() => previewImages('sku;imageUrl;stock\nROUTER-1;x;0', [product])).toThrow();
    const row = previewImages('sku;imageUrl\nROUTER-1;https://example.com/new.jpg', [product])[0];
    expect(() => imageUpdate(row, [{ ...product, physicalStock: 4 }])).toThrow('cambió');
    expect(() => imageUpdate(row, [])).toThrow();
  });
});
