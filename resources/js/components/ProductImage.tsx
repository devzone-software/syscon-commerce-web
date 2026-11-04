import { useState } from 'react';
import { categoryIcon } from '../lib/categoryIcon';
import type { Product } from '../types';

/** Product photo; without one (or if it fails to load) the icon of its category and its brand. */
export function ProductImage({
  product,
  loading = 'lazy',
}: {
  product: Product;
  loading?: 'lazy' | 'eager';
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = product.imageUrl;
  return source && failedSource !== source ? (
    <img
      src={source}
      alt={product.name}
      loading={loading}
      onError={() => setFailedSource(source)}
    />
  ) : (
    <span className="image-fallback">
      <img src={categoryIcon(product.category ?? '')} alt="" />
      {product.brand && <small>{product.brand}</small>}
    </span>
  );
}
