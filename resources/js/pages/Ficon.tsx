import { Link } from 'react-router-dom';
import { FiconWordmark } from '../components/home/FiconBanner';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { catalogParams } from '../lib/catalog';
import { api } from '../services/api';
import { ProductCard, useData, Loading, ErrorBox, Empty } from '../ui';
import '../../css/storefront.css';

const FICON_BRAND = 'Ficon';

const perks = [
  { title: 'Fibra hasta tu casa', text: 'Conexión estable aunque todos usen internet a la vez.' },
  { title: 'Router Wi-Fi incluido', text: 'Se entrega en comodato con la instalación.' },
  { title: 'Plan para empresas', text: '1 Gbps simétrico con IP pública y soporte 24/7.' },
];

const coverageUrl = `/contacto?${new URLSearchParams({
  proyecto: 'internet de fibra óptica Ficon',
})}#formulario`;

/** Special page of Ficon, the partner company: its fibre optic internet plans. */
export function Ficon() {
  const { data, loading, error, reload } = useData(api.products);
  const plans = (data ?? [])
    .filter((product) => product.brand === FICON_BRAND)
    .sort((a, b) => Number(a.price) - Number(b.price));

  return (
    <>
      <PageHero
        eyebrow="Empresa aliada"
        title="Internet de fibra óptica con Ficon"
        text="Elige el plan para tu casa o tu empresa. Te ayudamos a contratarlo junto con tus equipos de red y cámaras."
      >
        <div className="ficon-hero-brand">
          <FiconWordmark />
        </div>
      </PageHero>
      <PageSection title="Planes disponibles">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : plans.length ? (
          <div className="featured-grid ficon-plans">
            {plans.map((plan) => (
              <ProductCard key={plan.id} product={plan} />
            ))}
          </div>
        ) : (
          <Empty title="Pronto habrá planes" text="Los planes de Ficon se publicarán aquí." />
        )}
        <p className="flow-note">
          Precios mensuales referenciales. El servicio lo brinda Ficon; la cobertura y la fecha de
          instalación se confirman antes de contratar.
        </p>
      </PageSection>
      <PageSection soft title="¿Por qué fibra óptica?">
        <ul className="ficon-perks">
          {perks.map((perk) => (
            <li key={perk.title}>
              <strong>{perk.title}</strong>
              <span>{perk.text}</span>
            </li>
          ))}
        </ul>
        <div className="ficon-actions">
          <Link className="button button-primary" to={coverageUrl}>
            Consultar cobertura en mi zona
          </Link>
          <Link
            className="button button-secondary"
            to={`/catalogo?${catalogParams.category}=Routers`}
          >
            Ver routers y Wi-Fi
          </Link>
        </div>
      </PageSection>
    </>
  );
}
