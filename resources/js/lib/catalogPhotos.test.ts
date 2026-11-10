import { describe, expect, it } from 'vitest';
import { catalogPhotos, referencePhoto } from './catalogPhotos';
import { productGalleryPhotos } from './productGallery';
import type { Product } from '../types';

const product: Product = {
  id: 'demo',
  sku: 'DEMO-ADP-USB-ETH',
  name: 'Adaptador',
  brand: 'Demo Linkora',
  imageUrl: 'http://127.0.0.1:8000/images/products/demo-adp-usb-eth.svg',
  price: 39.9,
  stock: 4,
  active: true,
  category: 'Conectividad',
};

describe('local catalog photography', () => {
  it('covers all 25 original products with local image paths', () => {
    expect(Object.keys(catalogPhotos)).toHaveLength(25);
    for (const file of Object.values(catalogPhotos)) {
      expect(file).toMatch(/^[a-z0-9./-]+\.(jpg|png)$/);
    }
    expect(referencePhoto(product)).toBe('/examples/catalog-photos/usb-ethernet.jpg');
  });
  it('respects custom images, explicit removal, and modified original URLs', () => {
    for (const imageUrl of [null, '', '/uploads/own-photo.jpg', product.imageUrl + '?updated=1']) {
      expect(referencePhoto({ ...product, imageUrl })).toBeNull();
    }
  });
  it('does not assign example photos to real brands or unrelated products', () => {
    expect(referencePhoto({ ...product, brand: 'TP-Link' })).toBeNull();
    expect(referencePhoto({ ...product, sku: 'REAL-123' })).toBeNull();
    expect(referencePhoto({ ...product, brand: null })).toBeNull();
  });
  it('keeps the public cover first and removes repeated gallery URLs', () => {
    const cover = referencePhoto(product)!;
    expect(
      productGalleryPhotos({
        ...product,
        imageUrls: [cover, '/uploads/side.jpg', '/uploads/side.jpg'],
      }),
    ).toEqual([cover, '/uploads/side.jpg']);
    expect(
      productGalleryPhotos({
        ...product,
        imageUrl: '/uploads/custom.jpg',
        imageUrls: ['/uploads/side.jpg'],
      }),
    ).toEqual(['/uploads/custom.jpg', '/uploads/side.jpg']);
    expect(productGalleryPhotos({ ...product, imageUrl: null, imageUrls: [] })).toEqual([]);
  });
});
