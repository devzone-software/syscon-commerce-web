import type { Product } from '../../types';
import { ProductCard } from '../../ui';
import { SectionHeading } from './SectionHeading';

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="home-section container" aria-labelledby="home-featured">
      <SectionHeading
        id="home-featured"
        eyebrow="Productos"
        title="Selección del catálogo"
        text="Productos disponibles de distintas categorías."
        link={{ to: '/catalogo', label: 'Ver todos los productos' }}
      />
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
