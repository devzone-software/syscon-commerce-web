import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import arrowIcon from '../../../images/categories/arrow-right.svg';
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
import { catalogParams, productCount, type CatalogGroup } from '../../lib/catalog';
import { categoryIcon } from '../../lib/categoryIcon';
import type { Product } from '../../types';
import { ProductCard } from '../../ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import '../../../css/storefront.css';

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

/** The bag icon is drawn for the light primary button; secondary buttons use light icons only. */
type HeroAction = { to: string; label: string; icon?: string };

const heroSlides: {
  tone: string;
  label: string;
  title: string;
  text: string;
  primary: HeroAction;
  secondary: HeroAction;
}[] = [
  {
    tone: '',
    label: 'Distribuidor oficial IT & licenciamiento digital',
    title: 'Soluciones de Cómputo, Servidores y Software Original para Empresas y Profesionales',
    text: 'Distribuidor oficial de licencias digitales, hardware para estaciones de trabajo, componentes de alto rendimiento y seguridad informática empresarial.',
    primary: { to: '/catalogo', label: 'Ver productos', icon: heroBagIcon },
    secondary: { to: '/ofertas', label: 'Ver ofertas', icon: heroFireIcon },
  },
  {
    tone: 'is-offers',
    label: 'Ofertas de temporada',
    title: 'Los precios más bajos del catálogo en hardware y software',
    text: 'Laptops, almacenamiento, redes y licencias originales con garantía oficial y factura electrónica.',
    primary: { to: '/ofertas', label: 'Ver ofertas', icon: heroFireIcon },
    secondary: { to: '/categorias', label: 'Explorar categorías' },
  },
  {
    tone: 'is-business',
    label: 'Empresas y profesionales',
    title: 'Cotizaciones por volumen con factura electrónica',
    text: 'Atención personalizada para compras corporativas, licitaciones e instituciones públicas y privadas.',
    primary: { to: '/contacto', label: 'Solicitar cotización' },
    secondary: { to: '/catalogo', label: 'Ver productos' },
  },
  {
    tone: 'is-payment',
    label: 'Compra en línea',
    title: 'Paga con Mercado Pago o por transferencia',
    text: 'Retira en tienda o recibe tu pedido en casa, y sigue cada paso desde Mis compras.',
    primary: { to: '/catalogo', label: 'Comprar ahora', icon: heroBagIcon },
    secondary: { to: '/cuenta/pedidos', label: 'Mis compras' },
  },
];

/** Time each slide stays visible while the carousel plays on its own. */
const HERO_INTERVAL = 6000;

export function HomeHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const total = heroSlides.length;
  const go = (next: number) => setIndex((next + total) % total);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduced) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % total), HERO_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [index, paused, total]);

  return (
    <section
      className="home-carousel"
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(index - 1);
        if (event.key === 'ArrowRight') go(index + 1);
      }}
      onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="home-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {heroSlides.map((slide, i) => {
          const Title = i === 0 ? 'h1' : 'h2';
          return (
            <div
              key={slide.title}
              className={`home-hero ${slide.tone}`}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={i !== index}
              inert={i !== index}
            >
              <span className="home-hero-label">
                <i aria-hidden="true" /> {slide.label}
              </span>
              <Title>{slide.title}</Title>
              <p>{slide.text}</p>
              <div className="home-hero-actions">
                {[slide.primary, slide.secondary].map((action, n) => (
                  <Link
                    key={action.to}
                    className={n === 0 ? 'home-hero-primary' : 'home-hero-secondary'}
                    to={action.to}
                  >
                    {action.icon && <img src={action.icon} alt="" />} {action.label}
                  </Link>
                ))}
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
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="home-carousel-arrow is-prev"
        aria-label="Diapositiva anterior"
        onClick={() => go(index - 1)}
      >
        <ChevronLeftIcon size={22} />
      </button>
      <button
        type="button"
        className="home-carousel-arrow is-next"
        aria-label="Diapositiva siguiente"
        onClick={() => go(index + 1)}
      >
        <ChevronRightIcon size={22} />
      </button>
      <div className="home-carousel-dots">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Ir a la diapositiva ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}

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
        <img src={b2bMailIcon} alt="" /> Solicitar Cotización
      </Link>
    </section>
  );
}
