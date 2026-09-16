import type { Product } from '../types';

export function ProductImage({ product }: { product: Product }) {
  return product.imageUrl
    ? <img src={product.imageUrl} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
    : <span className="image-fallback">SYSCON</span>;
}
