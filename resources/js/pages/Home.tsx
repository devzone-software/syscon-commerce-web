import { categoryIcon } from '../lib/categoryIcon';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  B2BBanner,
  FeaturedProducts,
  HomeHero,
  PromoBanner,
  TrustStrip,
} from '../components/home/HomeSections';
import { ArrowRightIcon } from '../components/icons';
import { groupProducts, lowestAvailablePrice, pickFeatured } from '../lib/catalog';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Home() {
  const { data, loading, error, reload } = useData(api.products);
  const summary = useMemo(
    () =>
      data && {
        categories: groupProducts(data, 'category').slice(0, 8),
        featured: pickFeatured(data, 4),
        heroProducts: ['Routers', 'Cámaras IP', 'Periféricos', 'Almacenamiento']
          .map((category) =>
            data.find((product) => product.category === category && product.stock > 0),
          )
          .filter((product): product is (typeof data)[number] => Boolean(product)),
        lowestProduct: data
          .filter((product) => product.stock > 0)
          .reduce<(typeof data)[number] | null>(
            (lowest, product) =>
              lowest === null || Number(product.price) < Number(lowest.price) ? product : lowest,
            null,
          ),
        availableFrom: lowestAvailablePrice(data),
      },
    [data],
  );

  return (
    <div className="container home">
      <HomeHero
        products={summary?.heroProducts.length ? summary.heroProducts : summary?.featured}
        lowestProduct={summary?.lowestProduct}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : summary && data?.length ? (
        <>
          <nav className="home-category-shortcuts" aria-label="Comprar por categoría">
            {summary.categories.slice(0, 6).map((category) => (
              <Link
                key={category.name}
                to={`/catalogo?categoria=${encodeURIComponent(category.name)}`}
              >
                <span>
                  <img src={categoryIcon(category.name)} alt="" />
                </span>
                <strong>{category.name}</strong>
              </Link>
            ))}
            <Link className="home-category-all" to="/categorias">
              <span>
                <ArrowRightIcon size={24} />
              </span>
              <strong>Ver categorías</strong>
            </Link>
          </nav>
          <FeaturedProducts products={summary.featured} availableFrom={summary.availableFrom} />
          <div className="home-catalog-cta">
            <Link to="/catalogo">
              Ver todo el catálogo <ArrowRightIcon size={16} />
            </Link>
          </div>
          <PromoBanner />
        </>
      ) : (
        <Empty
          title="Pronto habrá productos"
          text="El catálogo estará disponible cuando se publiquen productos desde administración."
        />
      )}
      <TrustStrip />
      <B2BBanner />
    </div>
  );
}
