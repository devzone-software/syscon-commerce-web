import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  B2BBanner,
  CategoryCarousel,
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
        categories: groupProducts(data, 'category'),
        featured: pickFeatured(data, 4),
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
      <div className="home-top">
        <HomeHero products={summary?.featured} lowestProduct={summary?.lowestProduct} />
        {summary && summary.categories.length > 0 && (
          <CategoryCarousel categories={summary.categories} />
        )}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : summary && data?.length ? (
        <>
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
