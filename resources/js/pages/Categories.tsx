import { CategoryGrid } from '../components/catalog/CategoryGrid';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { groupProducts } from '../lib/catalog';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Categories() {
  const { data, loading, error, reload } = useData(api.products);
  const categories = data ? groupProducts(data, 'category') : [];
  return (
    <>
      <PageHero
        eyebrow="CATEGORÍAS"
        title="Encuentra la tecnología que necesitas"
        text="Explora nuestras líneas de cómputo, seguridad, redes, energía y accesorios."
      />
      <PageSection title="Todas las categorías">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : categories.length ? (
          <CategoryGrid categories={categories} />
        ) : (
          <Empty
            title="Aún no hay categorías"
            text="Las categorías aparecerán cuando se publiquen productos desde administración."
          />
        )}
      </PageSection>
    </>
  );
}
