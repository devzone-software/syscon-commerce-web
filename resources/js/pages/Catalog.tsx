import { ProductBrowser } from '../components/catalog/ProductBrowser';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Catalog() {
  const { data, loading, error, reload } = useData(api.products);
  return (
    <div className="container page catalog-page">
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : !data?.length ? (
        <Empty
          title="Aún no hay productos publicados"
          text="El catálogo se mostrará aquí cuando se publiquen productos desde administración."
        />
      ) : (
        <ProductBrowser
          products={data}
          eyebrow="Catálogo oficial SYSCON"
          title="Nuestros productos"
          headingLevel="h1"
        />
      )}
    </div>
  );
}
