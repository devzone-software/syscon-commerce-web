import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  B2BBanner,
  CategoryShowcase,
  FeaturedProducts,
  HomeHero,
  PromoBanner,
  TrustStrip,
} from '../components/home/HomeSections';
import { ArrowRightIcon } from '../components/icons';
import { groupProducts, pickFeatured } from '../lib/catalog';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Home() {
  const { data, loading, error, reload } = useData(api.products);
  const summary = useMemo(
    () =>
      data && {
        categories: groupProducts(data, 'category').slice(0, 8),
        featured: pickFeatured(data, 8),
      },
    [data],
  );

  return (
    <div className="container home">
      <HomeHero />
      <TrustStrip />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : summary && data?.length ? (
        <>
          <CategoryShowcase categories={summary.categories} />
          <FeaturedProducts products={summary.featured} />
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
      <B2BBanner />
    </div>
  );
}
