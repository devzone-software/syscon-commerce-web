import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BusinessSecurity,
  CameraCarousel,
  CategoryCarousel,
  HomeHero,
  ProductRail,
  StoreBenefits,
} from '../components/home/HomeSections';
import { ArrowRightIcon } from '../components/icons';
import { FiconBanner } from '../components/home/FiconBanner';
import { groupProducts, normalize, pickFeatured } from '../lib/catalog';
import { api } from '../services/api';
import type { Product } from '../types';
import { useData, ErrorBox, Loading, Empty } from '../ui';

/** In stock first, then from the lowest price. */
const inCategories = (products: Product[], pattern: RegExp) =>
  products
    .filter((product) => pattern.test(normalize(product.category ?? '')))
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(a.price) - Number(b.price));

/** Product carousels shown before the Ficon banner; categories match by name. */
const homeRails = [
  {
    id: 'home-network',
    eyebrow: 'Redes',
    title: 'Switches, routers y Wi-Fi para tu red',
    pattern: /switch|router|access|conect/,
    linkLabel: 'Ver productos de redes',
    noun: 'productos de redes',
  },
  {
    id: 'home-cabling',
    eyebrow: 'Cableado',
    title: 'Cables y accesorios para tu instalación',
    pattern: /cable|accesorio|rack/,
    linkLabel: 'Ver cables y accesorios',
    noun: 'cables y accesorios',
  },
  {
    id: 'home-software',
    eyebrow: 'Software',
    title: 'Licencias originales y antivirus',
    pattern: /licenc|software|antivirus/,
    linkLabel: 'Ver licencias y antivirus',
    noun: 'licencias',
  },
  {
    id: 'home-computing',
    eyebrow: 'Computación',
    title: 'Computación y accesorios para tu equipo',
    pattern: /comput|laptop|memoria|almacen|disco|periferic|energ|ups/,
    linkLabel: 'Ver computación',
    noun: 'productos de computación',
  },
];

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
        cameras: inCategories(data, /camara/),
        rails: homeRails
          .map((rail) => ({ ...rail, products: inCategories(data, rail.pattern) }))
          .filter((rail) => rail.products.length > 0),
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
          {summary.rails.map((rail) => (
            <ProductRail
              key={rail.id}
              id={rail.id}
              eyebrow={rail.eyebrow}
              title={rail.title}
              products={rail.products}
              // A family spans several categories: one category opens the filtered catalog.
              link={
                new Set(rail.products.map((product) => product.category)).size === 1
                  ? `/catalogo?categoria=${encodeURIComponent(rail.products[0].category ?? '')}`
                  : '/categorias'
              }
              linkLabel={rail.linkLabel}
              noun={rail.noun}
            />
          ))}
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
