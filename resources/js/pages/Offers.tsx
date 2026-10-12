import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import homeIcon from '../../images/catalog/home.svg';
import b2bIcon from '../../images/home/b2b-building.svg';
import promoImage from '../../images/home/promo-security.jpg';
import trustBoltIcon from '../../images/home/trust-bolt.svg';
import trustLockIcon from '../../images/home/trust-lock.svg';
import trustShieldIcon from '../../images/home/trust-shield.svg';
import trustSupportIcon from '../../images/home/trust-support.svg';
import { LOW_STOCK } from '../components/catalog/CatalogCard';
import { ProductImage } from '../components/ProductImage';
import {
  ArrowRightIcon,
  BoltIcon,
  BoxIcon,
  CartIcon,
  GridIcon,
  ReceiptIcon,
  ShieldIcon,
  TruckIcon,
} from '../components/icons';
import { groupProducts, pageNumbers, paginate } from '../lib/catalog';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Product } from '../types';
import { useData, ErrorBox, Loading, Empty } from '../ui';

const PAGE_SIZE = 8;
const priceRanges = [
  { value: '', label: 'Todos los precios' },
  { value: '0-50', label: 'Hasta S/ 50' },
  { value: '50-200', label: 'S/ 50 - S/ 200' },
  { value: '200-1000', label: 'S/ 200 - S/ 1,000' },
  { value: '1000-', label: 'Más de S/ 1,000' },
];
const sorts = [
  { value: 'asc', label: 'Menor precio (Por defecto)' },
  { value: 'desc', label: 'Mayor precio' },
  { value: 'stock', label: 'Menos unidades disponibles' },
];
const trust = [
  {
    icon: trustLockIcon,
    title: 'Compra 100% Segura',
    text: 'Pagos verificados por nuestro equipo y factura electrónica autorizada por SUNAT.',
  },
  {
    icon: trustBoltIcon,
    title: 'Entrega Rápida',
    text: 'Despachos coordinados en Lima y provincias con seguimiento del pedido.',
  },
  {
    icon: trustSupportIcon,
    title: 'Soporte Técnico IT',
    text: 'Asesoría de instalación y configuración guiada por ingenieros certificados.',
  },
  {
    icon: trustShieldIcon,
    title: 'Garantía Oficial',
    text: 'Productos originales con respaldo directo del fabricante.',
  },
];

function stockNote(product: Product) {
  if (product.stock <= LOW_STOCK)
    return { tone: 'is-low', text: `Solo ${product.stock} en almacén` };
  return { tone: '', text: 'En almacén' };
}

/** Offer card of the "Ofertas Destacadas del Mes" row and the paged grid. */
function OfferCard({ product, tag }: { product: Product; tag?: string }) {
  const { add } = useShop();
  const url = `/producto/${product.id}`;
  const note = stockNote(product);
  return (
    <article className="offer-card">
      <Link to={url} className="offer-card-media" tabIndex={-1} aria-hidden="true">
        {tag && <span className="offer-card-tag">{tag}</span>}
        <ProductImage product={product} />
      </Link>
      <code className="offer-card-sku">SKU: {product.sku}</code>
      <Link to={url} className="offer-card-title">
        {product.name}
      </Link>
      <p className="offer-card-desc">
        {[product.brand, product.category].filter(Boolean).join(' · ') || 'Catálogo SYSCON'}
      </p>
      <div className="offer-card-price">
        <strong>{money(Number(product.price))}</strong>
        <span className={note.tone}>
          {note.tone ? <BoxIcon size={13} /> : <TruckIcon size={13} />} {note.text}
        </span>
      </div>
      <div className="offer-card-actions">
        <Link to={url}>Ver Detalle</Link>
        <button
          type="button"
          onClick={() => add(product)}
          aria-label={`Agregar ${product.name} al carrito`}
        >
          <CartIcon size={15} /> Agregar
        </button>
      </div>
    </article>
  );
}

/** Figma "Client / Ofertas": the cheapest products in stock, as the backend has no promotions. */
export function Offers() {
  const { data, loading, error, reload } = useData(api.products);
  const { add } = useShop();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [range, setRange] = useState('');
  const [sort, setSort] = useState('asc');
  const [page, setPage] = useState(1);

  const offers = useMemo(
    () =>
      (data ?? [])
        .filter((product) => product.stock > 0)
        .sort((a, b) => Number(a.price) - Number(b.price)),
    [data],
  );
  const categories = groupProducts(offers, 'category');
  const inCategory = offers.filter((product) => !category || product.category === category);
  const brands = groupProducts(inCategory, 'brand');
  const filtered = useMemo(() => {
    const [low, high] = range.split('-').map((value) => (value ? Number(value) : null));
    const list = inCategory.filter(
      (product) =>
        (!brand || product.brand === brand) &&
        (low == null || Number(product.price) >= low) &&
        (high == null || Number(product.price) <= high),
    );
    if (sort === 'desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'stock') list.sort((a, b) => a.stock - b.stock);
    return list;
  }, [inCategory, brand, range, sort]);
  const current = paginate(filtered, page, PAGE_SIZE);
  const spotlight = offers[0];
  const lastUnits = offers.filter((product) => product.stock <= LOW_STOCK).slice(0, 4);
  const choose = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const chips = [
    brand && { label: 'Marca', value: brand, clear: () => choose(setBrand)('') },
    range && {
      label: 'Precio',
      value: priceRanges.find((option) => option.value === range)?.label ?? range,
      clear: () => choose(setRange)(''),
    },
    category && { label: 'Categoría', value: category, clear: () => choose(setCategory)('') },
  ].filter((chip): chip is { label: string; value: string; clear: () => void } => Boolean(chip));

  return (
    <div className="offers-page">
      <div className="categories-crumb">
        <div className="container">
          <nav aria-label="Ruta de navegación">
            <Link to="/">
              <img src={homeIcon} alt="" /> Inicio
            </Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Ofertas Especiales</span>
          </nav>
          <span className="categories-crumb-tag is-teal">
            <i aria-hidden="true" /> PRECIOS DEL CATÁLOGO // STOCK REAL
          </span>
        </div>
      </div>

      <div className="container">
        <section className="offers-hero" aria-labelledby="offers-title">
          <div>
            <span className="offers-hero-pill">
              <BoltIcon size={13} /> PROMOCIONES ACTIVAS // PRECIOS MÁS BAJOS
            </span>
            <h1 id="offers-title">Ofertas Especiales y Mejores Precios Corporativos</h1>
            <p>
              Los productos con los precios más bajos del catálogo, con stock disponible y
              facturación electrónica SUNAT con RUC 20.
            </p>
            <div className="offers-hero-actions">
              <a href="#ofertas" className="is-cyan">
                <BoltIcon size={15} /> Ver ofertas destacadas
              </a>
              <Link to="/catalogo">
                <GridIcon size={15} /> Explorar catálogo completo
              </Link>
            </div>
          </div>
          <figure>
            <img src={promoImage} alt="" />
            <figcaption>
              <ShieldIcon size={18} />
              <span>
                <strong>Garantía SYSCON Oficial</strong>
                Productos originales con respaldo del fabricante
              </span>
              <em>100% Legal</em>
            </figcaption>
          </figure>
        </section>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : !offers.length ? (
          <Empty
            title="Sin ofertas por ahora"
            text="Vuelve pronto: aquí verás los productos con mejor precio y stock disponible."
          />
        ) : (
          <>
            {spotlight && (
              <section className="offers-spotlight" aria-labelledby="offers-spotlight-title">
                <div className="offers-spotlight-bar">
                  <span className="offers-flash">
                    <BoltIcon size={13} /> PRECIO MÁS BAJO DEL CATÁLOGO
                  </span>
                  <code>SKU: {spotlight.sku}</code>
                  <span className="offers-spotlight-stock">
                    <BoxIcon size={14} /> {spotlight.stock} unidades en stock
                  </span>
                </div>
                <div className="offers-spotlight-body">
                  <Link to={`/producto/${spotlight.id}`} className="offers-spotlight-media">
                    <ProductImage product={spotlight} />
                  </Link>
                  <div>
                    <p className="offers-spotlight-cat">
                      {[spotlight.category, spotlight.brand].filter(Boolean).join(' • ')}
                    </p>
                    <h2 id="offers-spotlight-title">{spotlight.name}</h2>
                    <p className="offers-spotlight-text">
                      Producto original con el precio más bajo de nuestro catálogo actual. El precio
                      y el stock se confirman al crear tu pedido.
                    </p>
                    <p className="offers-spotlight-price">
                      <strong>{money(Number(spotlight.price))}</strong> Inc. IGV / Factura RUC
                    </p>
                    <div className="offers-spotlight-actions">
                      <Link to={`/producto/${spotlight.id}`} className="is-soft">
                        <ReceiptIcon size={16} /> Ver Ficha Técnica
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          add(spotlight);
                          navigate('/carrito');
                        }}
                      >
                        <CartIcon size={16} /> Comprar Ahora
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="offers-tabs" role="group" aria-label="Categorías">
              <button
                type="button"
                className={!category ? 'is-active' : undefined}
                aria-pressed={!category}
                onClick={() => choose(setCategory)('')}
              >
                Todas las ofertas <small>{offers.length}</small>
              </button>
              {categories.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={category === option.name ? 'is-active' : undefined}
                  aria-pressed={category === option.name}
                  onClick={() => choose(setCategory)(option.name)}
                >
                  {option.name} <small>{option.count}</small>
                </button>
              ))}
            </div>

            <section id="ofertas" className="offers-block" aria-labelledby="offers-month">
              <div className="offers-heading">
                <h2 id="offers-month">
                  Ofertas Destacadas del Mes <span>MÁS AHORRO</span>
                </h2>
                <p>Los cuatro precios más bajos con stock disponible</p>
              </div>
              <div className="offers-grid">
                {inCategory.slice(0, 4).map((product, index) => (
                  <OfferCard
                    key={product.id}
                    product={product}
                    tag={
                      product.stock <= LOW_STOCK
                        ? 'ÚLTIMAS UNIDADES'
                        : index === 0
                          ? 'PRECIO MÁS BAJO'
                          : undefined
                    }
                  />
                ))}
              </div>
            </section>

            <section className="offers-filters" aria-label="Filtros de ofertas">
              <div className="offers-filters-row">
                <label>
                  Rango de Precio
                  <select value={range} onChange={(event) => choose(setRange)(event.target.value)}>
                    {priceRanges.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Fabricante / Marca
                  <select value={brand} onChange={(event) => choose(setBrand)(event.target.value)}>
                    <option value="">Todas las marcas</option>
                    {brands.map((option) => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ordenar por
                  <select value={sort} onChange={(event) => choose(setSort)(event.target.value)}>
                    {sorts.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Mostrando{' '}
                  {filtered.length
                    ? `${(current.page - 1) * PAGE_SIZE + 1} - ${(current.page - 1) * PAGE_SIZE + current.items.length}`
                    : '0'}{' '}
                  de {filtered.length} ofertas
                </p>
              </div>
              {chips.length > 0 && (
                <div className="offers-applied">
                  <span>Filtros aplicados:</span>
                  {chips.map((chip) => (
                    <button key={chip.label} type="button" onClick={chip.clear}>
                      {chip.label}: {chip.value} ×
                    </button>
                  ))}
                  <button
                    type="button"
                    className="offers-applied-clear"
                    onClick={() => {
                      setBrand('');
                      setRange('');
                      setCategory('');
                      setPage(1);
                    }}
                  >
                    ↻ Limpiar todos los filtros
                  </button>
                </div>
              )}
            </section>

            {current.items.length ? (
              <div className="offers-grid">
                {current.items.map((product) => (
                  <OfferCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Empty
                title="Sin ofertas con estos filtros"
                text="Prueba con otro rango de precio o marca."
              />
            )}

            {lastUnits.length > 0 && (
              <section className="offers-ending" aria-labelledby="offers-ending-title">
                <div className="offers-ending-head">
                  <h2 id="offers-ending-title">
                    <BoxIcon size={20} /> Últimas unidades en stock
                  </h2>
                  <p>Precios válidos hasta agotar el stock disponible</p>
                </div>
                <ul>
                  {lastUnits.map((product) => (
                    <li key={product.id}>
                      <Link to={`/producto/${product.id}`}>
                        <span className="offers-ending-media">
                          <ProductImage product={product} />
                        </span>
                        <span>
                          <em>
                            QUEDAN {product.stock} {product.stock === 1 ? 'UNIDAD' : 'UNIDADES'}
                          </em>
                          <strong>{product.name}</strong>
                          <b>{money(Number(product.price))}</b>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <nav className="offers-pager" aria-label="Paginación">
              <p>
                Mostrando{' '}
                <strong>
                  {filtered.length ? (current.page - 1) * PAGE_SIZE + 1 : 0} -{' '}
                  {(current.page - 1) * PAGE_SIZE + current.items.length}
                </strong>{' '}
                de <strong>{filtered.length}</strong> ofertas vigentes
              </p>
              <div>
                <button
                  type="button"
                  disabled={current.page <= 1}
                  onClick={() => setPage(current.page - 1)}
                >
                  ← Anterior
                </button>
                {pageNumbers(current.page, current.pages).map((n, index) =>
                  n === null ? (
                    <span key={`gap-${index}`}>···</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={n === current.page ? 'is-current' : undefined}
                      aria-current={n === current.page ? 'page' : undefined}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="is-next"
                  disabled={current.page >= current.pages}
                  onClick={() => setPage(current.page + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </nav>
          </>
        )}

        <section className="offers-b2b" aria-labelledby="offers-b2b-title">
          <span className="offers-b2b-icon">
            <img src={b2bIcon} alt="" />
          </span>
          <div>
            <h2 id="offers-b2b-title">
              ¿Buscas descuentos corporativos por volumen o licencias en lote?
            </h2>
            <p>
              Atendemos cotizaciones directas para empresas, colegios, universidades y entidades del
              Estado con facturación electrónica SUNAT.
            </p>
          </div>
          <Link to="/contacto">
            <ReceiptIcon size={16} /> Solicitar Cotización Corporativa B2B
          </Link>
        </section>
      </div>
      <section className="offers-trust">
        <ul className="container">
          {trust.map((item) => (
            <li key={item.title}>
              <i>
                <img src={item.icon} alt="" />
              </i>
              <span>
                <strong>{item.title}</strong>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="container offers-more">
        <Link to="/catalogo">
          Ver todo el catálogo <ArrowRightIcon size={14} />
        </Link>
      </div>
    </div>
  );
}
