import { useState } from 'react';
import { categoryIcon } from '../lib/categoryIcon';
import type { Product } from '../types';

/** Product photo; without one (or if it fails to load) the icon of its category and its brand. */
export function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return product.imageUrl && !failed ? (
    <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <span className="image-fallback">
      <img src={categoryIcon(product.category ?? '')} alt="" />
      {product.brand && <small>{product.brand}</small>}
    </span>
  );
}
