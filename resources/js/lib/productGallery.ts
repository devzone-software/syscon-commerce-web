import type { Product } from '../types';
import { referencePhoto } from './catalogPhotos';

/** Public gallery order: cover first, then additional photos without duplicate URLs. */
export function productGalleryPhotos(product: Product): string[] {
  return [
    ...new Set(
      [referencePhoto(product) || product.imageUrl, ...(product.imageUrls ?? [])].filter(
        (url): url is string => Boolean(url),
      ),
    ),
  ];
}
