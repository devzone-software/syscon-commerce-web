import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BusinessSecurity,
  CameraCarousel,
  CategoryCarousel,
  HomeHero,
  StoreBenefits,
} from '../components/home/HomeSections';
import { ArrowRightIcon } from '../components/icons';
import { FiconBanner } from '../components/home/FiconBanner';
import { groupProducts, normalize, pickFeatured } from '../lib/catalog';
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
        // Security cameras, in stock first and then from the lowest price.
        cameras: data
          .filter((product) => /camara/.test(normalize(product.category ?? '')))
          .sort(
            (a, b) =>
              Number(b.stock > 0) - Number(a.stock > 0) || Number(a.price) - Number(b.price),
          ),
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
          {summary.cameras.length > 0 && (
            <CameraCarousel
              products={summary.cameras}
              category={summary.cameras[0].category ?? 'Cámaras IP'}
            />
          )}
          <div className="home-catalog-cta">
            <Link to="/catalogo">
              Ver todo el catálogo <ArrowRightIcon size={16} />
            </Link>
          </div>
          <BusinessSecurity cameraCategory={summary.cameras[0]?.category ?? 'Cámaras IP'} />
          <FiconBanner />
        </>
      ) : (
        <Empty
          title="Pronto habrá productos"
          text="El catálogo estará disponible cuando se publiquen productos desde administración."
        />
      )}
      <StoreBenefits />
    </div>
  );
}
