import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import { useConfirmAdd } from '../components/cart/AddToCartDialog';
import { ProductImage } from '../components/ProductImage';
import { InfoRows } from '../components/cart/OrderSummary';
import { PageSection } from '../components/layout/PageHero';
import { QuantityStepper } from '../components/shared/QuantityStepper';
import { DeliveryPreview } from '../components/product/DeliveryPreview';
import { ProductComparison } from '../components/product/ProductComparison';
import { CartIcon, HeadsetIcon, ReceiptIcon, ShieldIcon, TruckIcon } from '../components/icons';
import {
  lengthVariants,
  relatedProducts,
  productSpecifications,
  productInquiryUrl,
} from '../lib/catalog';
import { isServicePlan, planInquiryUrl } from '../lib/servicePlans';
import { useData, Loading, Empty, ProductCard } from '../ui';
import '../../css/storefront.css';

const perks = [
  { icon: <ReceiptIcon size={18} />, text: 'Boleta o factura electrónica con tu compra' },
  { icon: <ShieldIcon size={18} />, text: 'Consulta las condiciones de garantía por producto' },
  { icon: <TruckIcon size={18} />, text: 'Recojo en tienda o envío coordinado' },
  { icon: <HeadsetIcon size={18} />, text: 'Asesoría técnica antes y después de comprar' },
];

/** What a Ficon internet plan includes, instead of the delivery details of a product. */
const planPerks = [
  { icon: <ShieldIcon size={18} />, text: 'Servicio de Ficon, nuestra empresa aliada' },
  { icon: <TruckIcon size={18} />, text: 'Instalación coordinada en tu domicilio u oficina' },
  { icon: <HeadsetIcon size={18} />, text: 'Te ayudamos a revisar la cobertura en tu zona' },
];

export function ProductPage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useData(() => api.product(id), [id]);
  const catalog = useData(api.products);
  const { cart } = useShop();
  const confirmAdd = useConfirmAdd();
  const [quantity, setQuantity] = useState(1);
  const buyRef = useRef<HTMLDivElement>(null);
  const [showQuickBuy, setShowQuickBuy] = useState(false);

  useEffect(() => {
    setQuantity(1);
  }, [id]);

  const related = useMemo(
    () => (data && catalog.data ? relatedProducts(data, catalog.data) : []),
    [data, catalog.data],
  );

  const lengths = useMemo(
    () => (data && catalog.data ? lengthVariants(data, catalog.data) : []),
    [data, catalog.data],
  );
  const metersLabel = (meters: number) =>
    `${meters.toLocaleString('es-PE')} ${meters === 1 ? 'metro' : 'metros'}`;

  useEffect(() => {
    const target = buyRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setShowQuickBuy(!entry.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [data?.id]);

  if (loading)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (error || !data || !data.active)
    return (
      <div className="container page">
        <Empty
          title="No pudimos mostrar este producto"
          text={error || 'El producto no existe o ya no está publicado.'}
          action={
            <div className="empty-actions">
              <button type="button" className="button button-secondary" onClick={reload}>
                Reintentar
              </button>
              <Link className="button button-primary" to="/catalogo">
                Ir al catálogo
              </Link>
            </div>
          }
        />
      </div>
    );

  const inCart = cart.find((line) => line.product.id === data.id)?.quantity ?? 0;
  const remaining = Math.max(0, data.stock - inCart);
  const units = Math.min(quantity, Math.max(1, remaining));
  const description = data.description?.trim();
  const specifications = productSpecifications(data.specifications);
  const plan = isServicePlan(data);
  const inquiryUrl = plan ? planInquiryUrl(data) : productInquiryUrl(data);
  const addToCart = () => {
    confirmAdd(data, units);
    setQuantity(1);
  };

  return (
    <div className="product-view">
      <section className="product-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Ruta de navegación">
            <Link to="/">Inicio</Link> <span aria-hidden="true">/</span>{' '}
            <Link to="/catalogo">Productos</Link>
            {data.category && (
              <>
                {' '}
                <span aria-hidden="true">/</span>{' '}
                <Link to={`/catalogo?categoria=${encodeURIComponent(data.category)}`}>
                  {data.category}
                </Link>
              </>
            )}{' '}
            <span aria-hidden="true">/</span> <span aria-current="page">{data.name}</span>
          </nav>
          <div className="product-detail">
            <header className="product-detail-heading">
              <p className="product-detail-eyebrow">{data.category}</p>
              <h1>{data.name}</h1>
              <p className="product-detail-sub">
                {[data.brand, `SKU ${data.sku}`].filter(Boolean).join(' · ')}
              </p>
              <a className="product-info-link" href="#product-information">
                Ver descripción y características
              </a>
            </header>
            <div className="product-detail-media">
              <ProductImage product={data} loading="eager" />
            </div>
            <div className="product-detail-info">
              <div className="product-price-row">
                <p className="product-detail-price">
                  {money(Number(data.price))}
                  {plan && <small> /mes</small>}
                </p>
                {!plan && (
                  <p className={`product-detail-stock${data.stock < 1 ? ' out' : ''}`}>
                    <i aria-hidden="true" /> {data.stock < 1 ? 'Agotado' : 'Disponible'}
                  </p>
                )}
              </div>
              <p className="product-price-note">
                {plan
                  ? 'Precio mensual referencial. El servicio lo brinda Ficon, empresa aliada.'
                  : 'Precio por unidad. La entrega se elige en el checkout.'}
              </p>
              {lengths.length > 0 && (
                <fieldset className="product-lengths">
                  <legend>
                    ¿Cuántos metros necesitas?{' '}
                    <strong>
                      {metersLabel(
                        lengths.find(({ product }) => product.id === data.id)?.meters ?? 0,
                      )}
                    </strong>
                  </legend>
                  <div className="product-lengths-options">
                    {lengths.map(({ product, meters }) => (
                      <Link
                        key={product.id}
                        to={`/producto/${product.id}`}
                        replace
                        className={`product-length${product.id === data.id ? ' is-current' : ''}${
                          product.stock < 1 ? ' is-out' : ''
                        }`}
                        aria-current={product.id === data.id ? 'true' : undefined}
                        aria-label={`${metersLabel(meters)}, ${money(Number(product.price))}${
                          product.stock < 1 ? ', agotado' : ''
                        }`}
                      >
                        <strong>{meters.toLocaleString('es-PE')} m</strong>
                        <small>{money(Number(product.price))}</small>
                      </Link>
                    ))}
                  </div>
                  <Link className="product-lengths-other" to={inquiryUrl}>
                    ¿Necesitas otra medida? Cotízala con un asesor
                  </Link>
                </fieldset>
              )}
              {specifications.length > 0 && (
                <ul
                  className="product-highlights"
                  aria-label="Características publicadas destacadas"
                >
                  {specifications.slice(0, 3).map((line, index) => (
                    <li key={index}>{line.text}</li>
                  ))}
                </ul>
              )}
              <div className="product-buy" ref={buyRef}>
                {plan ? (
                  <Link className="flow-button" to={inquiryUrl}>
                    Consultar cobertura
                  </Link>
                ) : remaining > 0 ? (
                  <>
                    <QuantityStepper
                      label="Cantidad"
                      value={units}
                      max={remaining}
                      onChange={setQuantity}
                    />
                    <button type="button" className="flow-button" onClick={addToCart}>
                      <CartIcon /> Agregar al carrito
                    </button>
                  </>
                ) : (
                  <p className="notice">
                    {data.stock < 1
                      ? 'Este producto está agotado por ahora.'
                      : 'Alcanzaste la cantidad máxima disponible para este producto.'}
                  </p>
                )}
              </div>
              {inCart > 0 && (
                <p className="product-in-cart">
                  Tienes {inCart} {inCart === 1 ? 'unidad' : 'unidades'} en tu carrito.
                </p>
              )}
              {plan ? (
                <ul className="product-perks">
                  {planPerks.map(({ icon, text }) => (
                    <li key={text}>
                      {icon}
                      {text}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <Link className="product-info-link product-consult" to={inquiryUrl}>
                    <HeadsetIcon size={16} /> Consultar este producto
                  </Link>
                  <DeliveryPreview />
                  <ul className="product-perks">
                    {perks.map(({ icon, text }) => (
                      <li key={text}>
                        {icon}
                        {text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <PageSection id="product-information" title="Información del producto">
        {description && <p className="product-description">{description}</p>}
        {specifications.length > 0 && (
          <section aria-label="Características técnicas">
            <h3>Características técnicas</h3>
            <table className="product-specifications">
              <caption className="visually-hidden">Características técnicas de {data.name}</caption>
              <tbody>
                {specifications.map(({ label, value, text }, index) =>
                  label ? (
                    <tr key={index}>
                      <th scope="row">{label}</th>
                      <td>{value}</td>
                    </tr>
                  ) : (
                    <tr key={index}>
                      <td colSpan={2}>{text}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </section>
        )}
        {!description && !specifications.length && (
          <p className="product-information-empty">
            Las características técnicas todavía no están publicadas.{' '}
            <Link to={inquiryUrl}>Consulta con nuestro equipo antes de comprar.</Link>
          </p>
        )}
        <InfoRows
          rows={[
            { label: 'Marca', value: data.brand || '—' },
            { label: 'Categoría', value: data.category || '—' },
            { label: 'SKU', value: data.sku },
          ]}
        />
        <p className="flow-note">El precio y la disponibilidad se confirman al crear el pedido.</p>
      </PageSection>
      {related.length > 0 && (
        <PageSection title={data.category ? `Más en ${data.category}` : `Más de ${data.brand}`}>
          <ProductComparison product={data} alternatives={related} />
          <div className="featured-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </PageSection>
      )}
      {showQuickBuy && !plan && remaining > 0 && (
        <aside className="product-quick-buy" aria-label="Compra rápida">
          <span>
            <small>Precio por unidad</small>
            <strong>{money(Number(data.price))}</strong>
          </span>
          <button type="button" className="flow-button" onClick={addToCart}>
            <CartIcon /> Agregar
          </button>
        </aside>
      )}
    </div>
  );
}
