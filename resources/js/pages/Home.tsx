import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';
import { BenefitsSection } from '../components/home/BenefitsSection';
import { BrandSection } from '../components/home/BrandSection';
import { CallToAction } from '../components/home/CallToAction';
import { CategorySection } from '../components/home/CategorySection';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { Hero } from '../components/home/Hero';
import { groupProducts, pickFeatured } from '../components/home/catalogSummary';

export function Home() {
  const { data, loading, error, reload } = useData(api.products);
  const { hash } = useLocation();
  const summary = useMemo(
    () =>
      data && {
        categories: groupProducts(data, 'category'),
        brands: groupProducts(data, 'brand'),
        featured: pickFeatured(data, 8),
      },
    [data],
  );

  // Links such as /#categorias point at sections that only exist once the catalog loads.
  useEffect(() => {
    if (hash && summary) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, summary]);

  return (
    <>
      <Hero
        stats={
          data && summary
            ? {
                products: data.length,
                categories: summary.categories.length,
                brands: summary.brands.length,
              }
            : null
        }
      />
      <BenefitsSection />
      {loading ? (
        <div className="container home-section">
          <Loading />
        </div>
      ) : error ? (
        <div className="container home-section">
          <ErrorBox message={error} retry={reload} />
        </div>
      ) : summary && data?.length ? (
        <>
          <CategorySection categories={summary.categories} />
          <FeaturedProducts products={summary.featured} />
          <BrandSection brands={summary.brands} />
        </>
      ) : (
        <div className="container home-section">
          <Empty
            title="Pronto habrá productos"
            text="El catálogo estará disponible cuando se publiquen productos desde administración."
          />
        </div>
      )}
      <CallToAction />
    </>
  );
}
