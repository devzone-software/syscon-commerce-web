import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import arrowIcon from '../../../images/categories/arrow-right.svg';
import b2bIcon from '../../../images/home/b2b-building.svg';
import b2bMailIcon from '../../../images/home/b2b-mail.svg';
import complaintsBookIcon from '../../../images/home/libro-reclamaciones.svg';
import heroBagIcon from '../../../images/home/hero-bag.svg';
import heroFireIcon from '../../../images/home/hero-fire.svg';
import promoArrowIcon from '../../../images/home/arrow-right-dark.svg';
import promoImage from '../../../images/home/promo-security.jpg';
import trustBoltIcon from '../../../images/home/trust-bolt.svg';
import trustLockIcon from '../../../images/home/trust-lock.svg';
import trustShieldIcon from '../../../images/home/trust-shield.svg';
import trustSupportIcon from '../../../images/home/trust-support.svg';
import { catalogParams, normalize, type CatalogGroup } from '../../lib/catalog';
import { categoryIcon } from '../../lib/categoryIcon';
import type { Product } from '../../types';
import { money } from '../../state';
import { ProductCard } from '../../ui';
import { ProductImage } from '../ProductImage';
import {
  BoxIcon,
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StoreIcon,
  TruckIcon,
} from '../icons';
import { company } from '../layout/Header';
import '../../../css/storefront.css';

const lowPriceCatalog = `/catalogo?${catalogParams.onlyAvailable}=1&${catalogParams.sort}=precio-asc`;

const trust = [
  { icon: trustLockIcon, title: 'Compra segura', text: 'Medios de pago informados al comprar' },
  { icon: trustBoltIcon, title: 'Entrega coordinada', text: 'Consulta las opciones al comprar' },
  { icon: trustSupportIcon, title: 'Soporte técnico', text: 'Atención especializada IT' },
  {
    icon: trustShieldIcon,
    title: 'Garantía por producto',
    text: 'Consulta las condiciones por producto',
  },
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
    label: 'Tecnología y licenciamiento para empresas',
    title: 'Tecnología para tu trabajo y tu negocio',
    text: 'Licencias digitales, hardware para estaciones de trabajo, componentes de alto rendimiento y seguridad informática empresarial.',
    primary: { to: '/catalogo', label: 'Ver productos', icon: heroBagIcon },
    secondary: { to: lowPriceCatalog, label: 'Explorar por precio', icon: heroFireIcon },
  },
  {
    tone: 'is-offers',
    label: 'Selección por precio',
    title: 'Los precios más bajos del catálogo en hardware y software',
    text: 'Laptops, almacenamiento, redes y licencias: consulta las condiciones de cada producto antes de comprar.',
    primary: { to: lowPriceCatalog, label: 'Explorar por precio', icon: heroFireIcon },
    secondary: { to: '/categorias', label: 'Explorar categorías' },
  },
  {
    tone: 'is-business',
    label: 'Empresas y profesionales',
    title: 'Cotizaciones por volumen con factura electrónica',
    text: 'Atención personalizada para compras corporativas, licitaciones e instituciones públicas y privadas.',
    primary: {
      to: `/contacto?${new URLSearchParams({ proyecto: 'una compra corporativa por volumen' })}#formulario`,
      label: 'Solicitar cotización',
    },
    secondary: { to: '/catalogo', label: 'Ver productos' },
  },
  {
    tone: 'is-payment',
    label: 'Compra en línea',
    title: 'Consulta los medios de pago disponibles',
    text: 'Elige una modalidad de entrega habilitada y sigue tu pedido desde Mis pedidos.',
    primary: { to: '/catalogo', label: 'Comprar ahora', icon: heroBagIcon },
    secondary: { to: '/cuenta/pedidos', label: 'Mis pedidos' },
  },
];

/** Time each slide stays visible while the carousel plays on its own. */
const HERO_INTERVAL = 6000;

export function HomeHero({
  products = [],
  lowestProduct,
}: {
  products?: Product[];
  lowestProduct?: Product | null;
}) {
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
      <h1 className="visually-hidden">SYSCON: tecnología, redes y seguridad</h1>
      <div className="home-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {heroSlides.map((slide, i) => {
          const product =
            i === 1 ? (lowestProduct ?? products[0]) : products[i % Math.max(1, products.length)];
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
              <div className="home-hero-copy">
                <span className="home-hero-label">
                  <i aria-hidden="true" /> {slide.label}
                </span>
                <h2>{slide.title}</h2>
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
              </div>
              <div className="home-hero-feature">
                {product ? (
                  <Link className="home-hero-product" to={`/producto/${product.id}`}>
                    <span className="home-feature-media">
                      <ProductImage product={product} loading="eager" />
                    </span>
                    <span className="home-feature-details">
                      <small>DEL CATÁLOGO</small>
                      <strong>{product.name}</strong>
                      <b>{money(Number(product.price))}</b>
                      <span>Ver producto →</span>
                    </span>
                  </Link>
                ) : (
                  <div className="home-feature-placeholder" aria-hidden="true" />
                )}
              </div>
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
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeaturedProducts({
  products,
  availableFrom,
}: {
  products: Product[];
  availableFrom: number | null;
}) {
  return (
    <section className="home-block" aria-labelledby="home-featured">
      <div className="section-head">
        <div className="section-title">
          <p className="section-eyebrow">Precios actuales del catálogo</p>
          <h2 id="home-featured">Explora productos y precios</h2>
        </div>
        <Link
          className="section-pill"
          to={availableFrom === null ? '/catalogo' : lowPriceCatalog}
          aria-label={
            availableFrom === null
              ? 'Ver catálogo'
              : `Ver catálogo disponible desde ${money(availableFrom)}, de menor a mayor precio`
          }
        >
          {availableFrom === null ? 'Ver catálogo' : `Catálogo desde ${money(availableFrom)}`}
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
        <span className="promo-banner-tag">Selección por precio</span>
        <h2 id="home-promo">Tecnología para tus proyectos</h2>
        <p>
          Equipa a tu empresa con soluciones de ciberseguridad y discos de alta capacidad para
          servidores y backups seguros.
        </p>
        <Link className="promo-banner-cta" to={lowPriceCatalog}>
          Explorar por precio <img src={promoArrowIcon} alt="" />
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
            Cuéntanos qué productos y cantidades necesitas. Nuestro equipo te orienta sobre
            disponibilidad, entrega y el comprobante de tu compra.
          </p>
        </div>
      </div>
      <Link className="b2b-banner-cta" to="/contacto">
        <img src={b2bMailIcon} alt="" /> Solicitar Cotización
      </Link>
    </section>
  );
}

/** Short line under each category card; the catalog categories are free text. */
const categoryBlurbs: [RegExp, string][] = [
  [/fibra|internet/, 'Planes de Ficon para tu casa y tu empresa.'],
  [/cable/, 'Elige los metros que necesitas para tu instalación.'],
  [/access point|wifi|wi-fi/, 'Wi-Fi estable para oficinas y hogares.'],
  [/conect|adaptador/, 'Adaptadores y tarjetas para conectar tus equipos.'],
  [/accesorio/, 'Conectores, patch panels y todo para tu cableado.'],
  [/camara|vigilan|segur/, 'Videovigilancia para tu casa o negocio.'],
  [/periferic/, 'Teclados, mouse y accesorios para tu escritorio.'],
  [/memoria|ram/, 'Más velocidad para tu computadora.'],
  [/rack/, 'Orden y protección para tus equipos de red.'],
  [/router/, 'Conexión a internet rápida y segura.'],
  [/switch/, 'Más puertos para crecer tu red.'],
  [/almacen|disco|ssd/, 'Discos SSD para guardar y respaldar tus datos.'],
  [/energ|ups/, 'Protege tus equipos ante cortes de luz.'],
  [/comput|laptop/, 'Equipos para trabajar y estudiar.'],
  [/software|licenc/, 'Windows, Office y Microsoft 365 originales.'],
  [/antivirus/, 'Protege tus equipos de virus y ransomware.'],
];

const categoryBlurb = (name: string) =>
  categoryBlurbs.find(([pattern]) => pattern.test(normalize(name)))?.[1] ??
  `Descubre nuestros productos de ${name.toLowerCase()}.`;

/**
 * Category cards laid over the bottom of the hero banner (Mercado Libre style), in a row
 * that scrolls sideways with the arrows, by touch or with the keyboard.
 */
/** A row that scrolls sideways: whether each end is reached, and a step towards either side. */
function useRail(items: number) {
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => {
    const el = rail.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [items]);
  const move = (direction: 1 | -1) =>
    rail.current?.scrollBy({
      left: direction * rail.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  return { rail, edges, update, move };
}

export function CategoryCarousel({ categories }: { categories: CatalogGroup[] }) {
  const { rail, edges, update, move } = useRail(categories.length);

  return (
    <section className="home-category-rail" aria-labelledby="home-categories">
      <h2 id="home-categories" className="visually-hidden">
        Nuestras categorías
      </h2>
      <ul ref={rail} onScroll={update}>
        {categories.map((category) => (
          <li key={category.name}>
            <Link to={`/catalogo?${catalogParams.category}=${encodeURIComponent(category.name)}`}>
              <strong>{category.name}</strong>
              <span className="home-category-rail-icon">
                <img src={categoryIcon(category.name)} alt="" />
              </span>
              <p>{categoryBlurb(category.name)}</p>
              <span className="home-category-rail-cta">Ver productos</span>
            </Link>
          </li>
        ))}
      </ul>
      {!edges.start && (
        <button
          type="button"
          className="home-category-rail-arrow is-prev"
          aria-label="Ver categorías anteriores"
          onClick={() => move(-1)}
        >
          <ChevronLeftIcon size={22} />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          className="home-category-rail-arrow is-next"
          aria-label="Ver más categorías"
          onClick={() => move(1)}
        >
          <ChevronRightIcon size={22} />
        </button>
      )}
    </section>
  );
}

/** Every security camera of the catalog in a sideways carousel of product cards. */
export function CameraCarousel({ products, category }: { products: Product[]; category: string }) {
  const { rail, edges, update, move } = useRail(products.length);
  return (
    <section className="home-block home-product-rail" aria-labelledby="home-cameras">
      <div className="section-head">
        <div className="section-title">
          <p className="section-eyebrow">Videovigilancia</p>
          <h2 id="home-cameras">Cámaras de seguridad para tu hogar y negocio</h2>
        </div>
        <Link
          className="section-link"
          to={`/catalogo?${catalogParams.category}=${encodeURIComponent(category)}`}
        >
          Ver todas las cámaras <img src={arrowIcon} alt="" />
        </Link>
      </div>
      <div className="home-product-rail-frame">
        <ul ref={rail} onScroll={update}>
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        {!edges.start && (
          <button
            type="button"
            className="home-category-rail-arrow is-prev"
            aria-label="Ver cámaras anteriores"
            onClick={() => move(-1)}
          >
            <ChevronLeftIcon size={22} />
          </button>
        )}
        {!edges.end && (
          <button
            type="button"
            className="home-category-rail-arrow is-next"
            aria-label="Ver más cámaras"
            onClick={() => move(1)}
          >
            <ChevronRightIcon size={22} />
          </button>
        )}
      </div>
    </section>
  );
}

const securitySectors = [
  {
    icon: <TruckIcon size={22} />,
    title: 'Transporte y flotas',
    text: 'Cámaras en buses, terminales, cocheras y zonas de carga.',
  },
  {
    icon: <BoxIcon size={22} />,
    title: 'Almacenes y logística',
    text: 'Control de ingresos, despachos y perímetro las 24 horas.',
  },
  {
    icon: <StoreIcon size={22} />,
    title: 'Comercios y cadenas',
    text: 'Cajas, pasillos y varias sedes vistas desde un solo lugar.',
  },
  {
    icon: <BuildingIcon size={22} />,
    title: 'Oficinas e instituciones',
    text: 'Accesos, estacionamientos y áreas comunes protegidas.',
  },
];

const securitySteps = [
  'Visita técnica y diseño del sistema según tus locales o vehículos.',
  'Cámaras, grabadores, discos y cableado en una sola cotización.',
  'Precio por volumen, factura electrónica y soporte después de la instalación.',
];

/** A wall of camera feeds: the picture of a business watched from one monitor. */
function MonitoringWall() {
  const feeds = [0, 1, 2, 3, 4, 5];
  return (
    <svg
      className="business-security-wall"
      viewBox="0 0 360 250"
      role="img"
      aria-label="Monitor con seis cámaras en vivo"
    >
      <rect
        x="4"
        y="4"
        width="352"
        height="214"
        rx="14"
        fill="#0b1830"
        stroke="#29c4f0"
        strokeOpacity=".35"
        strokeWidth="2"
      />
      {feeds.map((feed) => {
        const x = 18 + (feed % 3) * 112;
        const y = 18 + Math.floor(feed / 3) * 96;
        return (
          <g key={feed}>
            <rect x={x} y={y} width="100" height="84" rx="8" fill="#13284d" />
            <circle cx={x + 12} cy={y + 12} r="4" fill="#e5484d" />
            <text
              x={x + 22}
              y={y + 16}
              fontSize="9"
              fontWeight="700"
              fill="#a1eaff"
              fontFamily="Inter, Arial, sans-serif"
            >
              {['BUS 01', 'BUS 02', 'TERMINAL', 'COCHERA', 'ALMACÉN', 'OFICINA'][feed]}
            </text>
            {feed < 2 ? (
              <g fill="#29c4f0" opacity=".85">
                <rect x={x + 18} y={y + 34} width="64" height="30" rx="6" />
                <rect x={x + 24} y={y + 39} width="12" height="10" rx="2" fill="#13284d" />
                <rect x={x + 40} y={y + 39} width="12" height="10" rx="2" fill="#13284d" />
                <rect x={x + 56} y={y + 39} width="12" height="10" rx="2" fill="#13284d" />
                <circle
                  cx={x + 32}
                  cy={y + 66}
                  r="6"
                  fill="#0b1830"
                  stroke="#29c4f0"
                  strokeWidth="3"
                />
                <circle
                  cx={x + 68}
                  cy={y + 66}
                  r="6"
                  fill="#0b1830"
                  stroke="#29c4f0"
                  strokeWidth="3"
                />
              </g>
            ) : (
              <g fill="none" stroke="#29c4f0" strokeOpacity=".7" strokeWidth="3">
                <path
                  d={`M${x + 14} ${y + 70} L${x + 40} ${y + 42} L${x + 58} ${y + 58} L${x + 86} ${y + 32}`}
                />
                <rect x={x + 14} y={y + 30} width="72" height="44" rx="4" strokeOpacity=".25" />
              </g>
            )}
          </g>
        );
      })}
      <rect x="150" y="218" width="60" height="18" fill="#13284d" />
      <rect x="110" y="234" width="140" height="10" rx="5" fill="#13284d" />
    </svg>
  );
}

/** Corporate video surveillance: many cameras for companies such as transport fleets. */
export function BusinessSecurity({ cameraCategory }: { cameraCategory: string }) {
  const quote = `/contacto?${new URLSearchParams({
    proyecto: 'un sistema de videovigilancia para mi empresa',
  })}#formulario`;
  return (
    <section className="business-security" aria-labelledby="home-business-security">
      <div className="business-security-intro">
        <div>
          <span className="business-security-tag">Soluciones para empresas</span>
          <h2 id="home-business-security">Videovigilancia para empresas con muchas cámaras</h2>
          <p>
            Una empresa de transportes, un almacén o una cadena de tiendas necesita ver todo lo que
            pasa en sus buses, locales y patios. Te ayudamos a armar el sistema completo y a
            monitorearlo desde un solo lugar.
          </p>
          <ul className="business-security-steps">
            {securitySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="business-security-actions">
            <Link className="business-security-primary" to={quote}>
              Cotizar para mi empresa <img src={promoArrowIcon} alt="" />
            </Link>
            <Link
              className="business-security-secondary"
              to={`/catalogo?${catalogParams.category}=${encodeURIComponent(cameraCategory)}`}
            >
              Ver cámaras
            </Link>
          </div>
        </div>
        <MonitoringWall />
      </div>
      <ul className="business-security-sectors">
        {securitySectors.map((sector) => (
          <li key={sector.title}>
            <span>{sector.icon}</span>
            <strong>{sector.title}</strong>
            <p>{sector.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Mercado Pago's own guide to paying online, opened in a new tab. */
const MERCADO_PAGO_GUIDE = 'https://www.mercadopago.com.pe/c/pagar-online-con-mercadopago';

/** Closing strip of the home page: how to pay and how the order arrives. */
export function StoreBenefits() {
  return (
    <section className="store-benefits" aria-label="Pagos y entregas">
      <div>
        <svg viewBox="0 0 64 48" aria-hidden="true">
          <rect
            x="2"
            y="2"
            width="60"
            height="44"
            rx="5"
            fill="none"
            stroke="#3c4a5e"
            strokeWidth="2.5"
          />
          <circle cx="12" cy="12" r="4" fill="#00a6d2" />
          <circle cx="17" cy="12" r="4" fill="none" stroke="#3c4a5e" strokeWidth="2" />
          <path
            d="M10 24h8M22 24h8M34 24h8M46 24h8M10 34h12M10 38h8"
            stroke="#3c4a5e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="44" y="32" width="12" height="8" rx="2" fill="#00a6d2" />
        </svg>
        <h2>Paga con Mercado Pago</h2>
        <p>
          Paga de forma segura con tarjeta de crédito o débito y otros medios disponibles en Mercado
          Pago, sin compartir los datos de tu tarjeta con la tienda.
        </p>
        <a href={MERCADO_PAGO_GUIDE} target="_blank" rel="noopener noreferrer">
          Cómo pagar con Mercado Pago
          <span className="visually-hidden"> (se abre en una pestaña nueva)</span>
        </a>
      </div>
      <div>
        <svg viewBox="0 0 64 48" aria-hidden="true">
          <rect
            x="6"
            y="8"
            width="52"
            height="38"
            rx="3"
            fill="none"
            stroke="#3c4a5e"
            strokeWidth="2.5"
          />
          <path
            d="M4 8h56v6H4z"
            fill="none"
            stroke="#3c4a5e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="28" y="2" width="8" height="18" fill="#00a6d2" />
          <rect
            x="14"
            y="28"
            width="22"
            height="12"
            rx="2"
            fill="none"
            stroke="#3c4a5e"
            strokeWidth="2"
          />
          <path
            d="M18 34h4M25 32h8M25 36h6"
            stroke="#3c4a5e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <h2>Recojo en local y envío a provincias</h2>
        <p>
          Recoge tu pedido en nuestra tienda de {company.city.split(',')[0]} o pide que te lo
          enviemos a cualquier provincia del Perú. El costo de envío lo ves antes de pagar.
        </p>
      </div>
      <Link className="store-benefits-complaints" to="/libro-de-reclamaciones">
        <img src={complaintsBookIcon} alt="Libro de Reclamaciones" width={120} height={72} />
      </Link>
    </section>
  );
}
