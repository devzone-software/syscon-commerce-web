import { Link } from 'react-router-dom';
import { productCount, type CatalogGroup } from './catalogSummary';
import { SectionHeading } from './SectionHeading';

export function BrandSection({ brands }: { brands: CatalogGroup[] }) {
  if (!brands.length) return null;
  return (
    <section className="home-section container" aria-labelledby="home-brands">
      <SectionHeading
        id="home-brands"
        eyebrow="Marcas"
        title="Explora por marca"
        text="Marcas con productos publicados en el catálogo."
      />
      <ul className="home-brand-grid">
        {brands.slice(0, 12).map((brand) => (
          <li key={brand.name}>
            <Link className="home-brand" to={`/catalogo?marca=${encodeURIComponent(brand.name)}`}>
              <strong>{brand.name}</strong>
              <span>{productCount(brand.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
