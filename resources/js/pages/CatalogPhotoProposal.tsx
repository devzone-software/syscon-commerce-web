import { Link } from 'react-router-dom';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { ShoppingBackLink } from '../components/shared/ShoppingBackLink';

const examples = [
  {
    model: 'Archer C6',
    name: 'Router Wi-Fi TP-Link Archer C6',
    category: 'Routers',
    description: 'Router inalámbrico AC1200 Gigabit.',
    file: 'archer-c6.jpg',
    source: 'https://www.tp-link.com/us/home-networking/wifi-router/archer-c6/',
  },
  {
    model: 'Archer T3U',
    name: 'Adaptador USB TP-Link Archer T3U',
    category: 'Conectividad',
    description: 'Adaptador Wi-Fi USB AC1300.',
    file: 'archer-t3u.jpg',
    source: 'https://www.tp-link.com/us/home-networking/usb-adapter/archer-t3u/',
  },
  {
    model: 'TL-SG108',
    name: 'Switch Gigabit TP-Link TL-SG108',
    category: 'Switches',
    description: 'Switch de escritorio con 8 puertos Gigabit.',
    file: 'tl-sg108.jpg',
    source: 'https://www.tp-link.com/us/business-networking/soho-switch-unmanaged/tl-sg108/',
  },
];

/** Separate visual proposal: these examples are not products available for purchase. */
export function CatalogPhotoProposal() {
  return (
    <>
      <PageHero
        eyebrow="FOTOGRAFÍA DE PRODUCTO"
        title="Así se vería tu catálogo"
        text="Tres modelos reales para comparar la presentación de las fotos."
      />
      <div className="container shopping-navigation">
        <ShoppingBackLink to="/catalogo">Volver al catálogo actual</ShoppingBackLink>
      </div>
      <PageSection>
        <div className="photo-proposal-grid">
          {examples.map((item) => (
            <article key={item.model} className="photo-proposal-card">
              <div className="photo-proposal-image">
                <img
                  src={'/examples/product-photos/' + item.file}
                  alt={item.name}
                  width="640"
                  height="480"
                />
              </div>
              <div className="photo-proposal-copy">
                <span>{item.category} · TP-Link</span>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <a
                  className="button button-secondary"
                  href={item.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver modelo del fabricante
                  <span className="visually-hidden"> (abre otra pestaña)</span>
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="photo-proposal-note">
          Fotos oficiales de TP-Link. Esta propuesta no modifica tus productos ni indica precio o
          disponibilidad de venta.
        </p>
        <Link className="link-button" to="/admin/imagenes">
          Ir a imágenes por lote
        </Link>
      </PageSection>
    </>
  );
}
