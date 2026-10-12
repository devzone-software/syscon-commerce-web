import { PageHero, PageSection } from '../components/layout/PageHero';
import { lowestPriced } from '../lib/catalog';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function Offers() {
  const { data, loading, error, reload } = useData(api.products);
  const offers = data ? lowestPriced(data, 8) : [];
  return (
    <>
      <PageHero
        eyebrow="OFERTAS"
        title="Promociones para equipar tu negocio"
        text="Los precios más bajos del catálogo en productos con stock disponible."
      />
      <PageSection title="Ofertas destacadas">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : offers.length ? (
          <div className="featured-grid">
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Empty
            title="Sin ofertas por ahora"
            text="Vuelve pronto: aquí verás los productos con mejor precio y stock disponible."
          />
        )}
      </PageSection>
    </>
  );
}
