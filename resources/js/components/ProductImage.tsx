import { useState } from 'react';
import { categoryIcon } from '../lib/categoryIcon';
import type { Product } from '../types';

/**
 * Photos in the platform's products/referencial folder show the kind of product, not the exact
 * item (stock photos until the real ones arrive), so the store labels them.
 */
export const isReferencePhoto = (url?: string | null) =>
  Boolean(url && /\/images\/products\/referencial\//.test(url));

/** Product photo; without one (or if it fails to load) the icon of its category and its brand. */
export function ProductImage({
  product,
  loading = 'lazy',
  badge = true,
}: {
  product: Product;
  loading?: 'lazy' | 'eager';
  /** Small thumbnails (cart lines, dialogs) hide the "Imagen referencial" label. */
  badge?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = product.imageUrl;
  const reference = isReferencePhoto(source);
  return source && failedSource !== source ? (
    <>
      <img
        src={source}
        alt={product.name}
        loading={loading}
        className={reference ? 'is-reference-photo' : undefined}
        onError={() => setFailedSource(source)}
      />
      {reference && badge && <span className="reference-badge">Imagen referencial</span>}
    </>
  ) : (
    <span className="image-fallback">
      <img src={categoryIcon(product.category ?? '')} alt="" />
      {product.brand && <small>{product.brand}</small>}
    </span>
  );
}
