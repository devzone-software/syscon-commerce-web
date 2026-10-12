import { Link } from 'react-router-dom';
import { catalogParams, productCount, type CatalogGroup } from '../../lib/catalog';
import { categoryIcon } from '../home/HomeSections';

/** Category cards linking to the catalog filtered by that category. */
export function CategoryGrid({ categories }: { categories: CatalogGroup[] }) {
  return (
    <ul className="category-showcase is-wrapping">
      {categories.map((category) => (
        <li key={category.name}>
          <Link to={`/catalogo?${catalogParams.category}=${encodeURIComponent(category.name)}`}>
            <span className="category-showcase-icon">
              <img src={categoryIcon(category.name)} alt="" />
            </span>
            <strong>{category.name}</strong>
            <small>{productCount(category.count)}</small>
          </Link>
        </li>
      ))}
    </ul>
  );
}
