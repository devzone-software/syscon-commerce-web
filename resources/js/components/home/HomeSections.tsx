import { Link } from 'react-router-dom';
import arrowIcon from '../../../images/categories/arrow-right.svg';
import componentsIcon from '../../../images/categories/components.svg';
import laptopIcon from '../../../images/categories/laptop.svg';
import officeIcon from '../../../images/categories/office.svg';
import peripheralsIcon from '../../../images/categories/peripherals.svg';
import securityIcon from '../../../images/categories/security.svg';
import serverIcon from '../../../images/categories/server.svg';
import softwareIcon from '../../../images/categories/software.svg';
import storageIcon from '../../../images/categories/storage.svg';
import b2bIcon from '../../../images/home/b2b-building.svg';
import b2bMailIcon from '../../../images/home/b2b-mail.svg';
import heroBagIcon from '../../../images/home/hero-bag.svg';
import heroFireIcon from '../../../images/home/hero-fire.svg';
import heroReceiptIcon from '../../../images/home/hero-receipt.svg';
import heroTruckIcon from '../../../images/home/hero-truck.svg';
import heroVerifiedIcon from '../../../images/home/hero-verified.svg';
import promoArrowIcon from '../../../images/home/arrow-right-dark.svg';
import promoImage from '../../../images/home/promo-security.jpg';
import trustBoltIcon from '../../../images/home/trust-bolt.svg';
import trustLockIcon from '../../../images/home/trust-lock.svg';
import trustShieldIcon from '../../../images/home/trust-shield.svg';
import trustSupportIcon from '../../../images/home/trust-support.svg';
import { catalogParams, normalize, productCount, type CatalogGroup } from '../../lib/catalog';
import type { Product } from '../../types';
import { ProductCard } from '../../ui';

const trust = [
  { icon: trustLockIcon, title: 'Compra segura', text: 'Pagos protegidos y certificados' },
  { icon: trustBoltIcon, title: 'Entrega rápida', text: 'Procesamos rápidamente tus pedidos' },
  { icon: trustSupportIcon, title: 'Soporte técnico', text: 'Atención especializada IT' },
  { icon: trustShieldIcon, title: 'Garantía oficial', text: 'Productos 100% confiables' },
];

export function TrustStrip() {
  return (
    <ul className="trust-strip">
      {trust.map((item) => (
        <li key={item.title}>
          <img src={item.icon} alt="" />
          <span>
            <strong>{item.title}</strong>
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <span className="home-hero-label">
        <i aria-hidden="true" /> Distribuidor oficial IT &amp; licenciamiento digital
      </span>
      <h1 id="home-hero-title">
        Soluciones de Cómputo, Servidores y Software Original para Empresas y Profesionales
      </h1>
      <p>
        Distribuidor oficial de licencias digitales, hardware para estaciones de trabajo,
        componentes de alto rendimiento y seguridad informática empresarial.
      </p>
      <div className="home-hero-actions">
        <Link className="home-hero-primary" to="/catalogo">
          <img src={heroBagIcon} alt="" /> Ver productos
        </Link>
        <Link className="home-hero-secondary" to="/ofertas">
          <img src={heroFireIcon} alt="" /> Ver ofertas
        </Link>
      </div>
      <ul className="home-hero-badges">
        <li>
          <img src={heroVerifiedIcon} alt="" /> Garantía Oficial Certificada
        </li>
        <li>
          <img src={heroReceiptIcon} alt="" /> Facturación electrónica inmediata
        </li>
        <li>
          <img src={heroTruckIcon} alt="" /> Envíos express a todo el país
        </li>
      </ul>
    </section>
  );
}

/** The catalog categories are free text, so each one gets the icon of the closest family. */
const categoryIcons: [RegExp, string][] = [
  [/office|ofimatic|productiv/, officeIcon],
  [/software|licenc|windows|sistema/, softwareIcon],
  [/segur|antivirus|camara|vigilan/, securityIcon],
  [/laptop|computa|\bpc\b|notebook|equipo/, laptopIcon],
  [/servidor|red|router|switch|rack|cable|conect|access/, serverIcon],
  [/almacen|ssd|disco|nas/, storageIcon],
  [/componente|memoria|ram|tarjeta|grafica|procesador/, componentsIcon],
];
export const categoryIcon = (name: string) =>
  categoryIcons.find(([pattern]) => pattern.test(normalize(name)))?.[1] ?? peripheralsIcon;

export function CategoryShowcase({ categories }: { categories: CatalogGroup[] }) {
  return (
    <section className="home-block" aria-labelledby="home-categories">
      <div className="section-head">
        <div className="section-title">
          <p className="section-eyebrow">Catálogo segmentado</p>
          <h2 id="home-categories">Explora nuestras categorías</h2>
        </div>
        <Link className="section-link" to="/categorias">
          Ver todas <img src={arrowIcon} alt="" />
        </Link>
      </div>
      <ul className="category-showcase">
        {categories.map((category) => (
          <li key={category.name}>
            <Link to={`/catalogo?${catalogParams.category}=${encodeURIComponent(category.name)}`}>
              <span className="category-showcase-icon">
                <img src={categoryIcon(category.name)} alt="" />
              </span>
              <strong>{category.name}</strong>
              <small>{productCount(category.count)}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="home-block" aria-labelledby="home-featured">
      <div className="section-head">
        <div className="section-title">
          <p className="section-eyebrow">Top ventas empresariales</p>
          <h2 id="home-featured">Productos destacados</h2>
        </div>
        <Link className="section-pill" to="/ofertas">
          Ofertas exclusivas por tiempo limitado
        </Link>
      </div>
      <div className="featured-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export function PromoBanner() {
  return (
    <section className="promo-banner" aria-labelledby="home-promo">
      <div>
        <span className="promo-banner-tag">Ofertas de temporada</span>
        <h2 id="home-promo">Precios especiales en Seguridad &amp; Almacenamiento</h2>
        <p>
          Equipa a tu empresa con soluciones de ciberseguridad y discos de alta capacidad para
          servidores y backups seguros.
        </p>
        <Link className="promo-banner-cta" to="/ofertas">
          Ver ofertas <img src={promoArrowIcon} alt="" />
        </Link>
      </div>
      <img className="promo-banner-image" src={promoImage} alt="" width={320} height={192} />
    </section>
  );
}

export function B2BBanner() {
  return (
    <section className="b2b-banner" aria-labelledby="home-b2b">
      <div className="b2b-banner-copy">
        <span className="b2b-banner-icon">
          <img src={b2bIcon} alt="" />
        </span>
        <div>
          <h2 id="home-b2b">¿Necesitas cotización corporativa por volumen?</h2>
          <p>
            Emitimos Facturas electrónicas con RUC, contratos de licenciamiento corporativo (CSP /
            Open) y descuentos especiales para instituciones públicas y privadas.
          </p>
        </div>
      </div>
      <Link className="b2b-banner-cta" to="/contacto">
        <img src={b2bMailIcon} alt="" /> Solicitar Cotización B2B
      </Link>
    </section>
  );
}
