import { Link } from 'react-router-dom';
import { ArrowIcon } from '../icons';
import { productCount, type CatalogGroup } from '../../lib/catalog';
import { SectionHeading } from './SectionHeading';

export function CategorySection({ categories }: { categories: CatalogGroup[] }) {
  if (!categories.length) return null;
  return (
    <section id="categorias" className="home-section container" aria-labelledby="home-categories">
      <SectionHeading
        id="home-categories"
        eyebrow="Categorías"
        title="Explora por categoría"
        text="Accede directamente a los productos de cada categoría del catálogo."
        link={{ to: '/catalogo', label: 'Ver todo el catálogo' }}
      />
      <ul className="home-category-grid">
        {categories.slice(0, 8).map((category) => (
          <li key={category.name}>
            <Link
              className="home-category"
              to={`/catalogo?categoria=${encodeURIComponent(category.name)}`}
            >
              <span className="home-category-initial" aria-hidden="true">
                {category.name.charAt(0).toUpperCase()}
              </span>
              <span className="home-category-copy">
                <strong>{category.name}</strong>
                <span>{productCount(category.count)}</span>
              </span>
              <ArrowIcon size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
