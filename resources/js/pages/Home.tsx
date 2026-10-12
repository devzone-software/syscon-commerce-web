import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductBrowser } from '../components/catalog/ProductBrowser';
import {
  B2BBanner,
  CategoryShowcase,
  FeaturedProducts,
  HomeHero,
  PromoBanner,
  TrustStrip,
} from '../components/home/HomeSections';
import { groupProducts, pickFeatured } from '../lib/catalog';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Home() {
  const { data, loading, error, reload } = useData(api.products);
  const { hash } = useLocation();
  const summary = useMemo(
    () =>
      data && {
        categories: groupProducts(data, 'category').slice(0, 8),
        featured: pickFeatured(data, 4),
      },
    [data],
  );

  // Links such as /#productos point at sections that only exist once the catalog loads.
  useEffect(() => {
    if (hash && summary) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, summary]);

  return (
    <div className="container home">
      <TrustStrip />
      <HomeHero />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : summary && data?.length ? (
        <>
          <CategoryShowcase categories={summary.categories} />
          <FeaturedProducts products={summary.featured} />
          <PromoBanner />
          <div id="productos">
            <ProductBrowser
              products={data}
              eyebrow="Catálogo oficial SYSCON"
              title="Nuestros productos"
            />
          </div>
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
