import { publicBrand, publicProductCode } from '../lib/productPresentation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import { useConfirmAdd } from '../components/cart/AddToCartDialog';
import { ProductPhotoViewer } from '../components/product/ProductPhotoViewer';
import { InfoRows } from '../components/cart/OrderSummary';
import { PageSection } from '../components/layout/PageHero';
import { QuantityStepper } from '../components/shared/QuantityStepper';
import { DeliveryPreview } from '../components/product/DeliveryPreview';
import { ProductComparison } from '../components/product/ProductComparison';
import { CartIcon, HeadsetIcon, ReceiptIcon, ShieldIcon } from '../components/icons';
import { relatedProducts, productSpecifications, productInquiryUrl } from '../lib/catalog';
import { useData, Loading, Empty, ProductCard } from '../ui';
import '../../css/storefront.css';
import { ShoppingBackLink } from '../components/shared/ShoppingBackLink';

const perks = [
  { icon: <ReceiptIcon size={18} />, text: 'Boleta o factura electrónica con tu compra' },
  { icon: <ShieldIcon size={18} />, text: 'Consulta las condiciones de garantía por producto' },
];

export function ProductPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const requestedBack = (location.state as { from?: unknown } | null)?.from;
  const backTo =
    typeof requestedBack === 'string' &&
    /^\/(?:catalogo|carrito|cuenta\/(?:productos|carrito))(?:\?|$)/.test(requestedBack)
      ? requestedBack
      : '/catalogo';
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
  const inquiryUrl = productInquiryUrl(data);
  const addToCart = () => {
    confirmAdd(data, units);
    setQuantity(1);
  };

  return (
    <div className="product-view">
      <section className="product-hero">
        <div className="container">
          {backTo.includes('carrito') && (
            <div className="shopping-navigation">
              <ShoppingBackLink to={backTo}>Volver al carrito</ShoppingBackLink>
            </div>
          )}
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
                {[publicBrand(data), `Código ${publicProductCode(data)}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <a className="product-info-link" href="#product-information">
                Ver descripción y características
              </a>
            </header>
            <ProductPhotoViewer key={data.id} product={data} />
            <div className="product-detail-info">
              <div className="product-price-row">
                <p className="product-detail-price">{money(Number(data.price))}</p>
                <p className={`product-detail-stock${data.stock < 1 ? ' out' : ''}`}>
                  <i aria-hidden="true" /> {data.stock < 1 ? 'Agotado' : 'Disponible'}
                </p>
              </div>
              <p className="product-price-note">
                Precio por unidad. La entrega se elige en el checkout.
              </p>
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
                {remaining > 0 ? (
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
              <Link className="product-info-link product-consult" to={inquiryUrl}>
                <HeadsetIcon size={16} /> Consultar este producto
              </Link>
              <DeliveryPreview />
              <details className="product-purchase-details">
                <summary>Comprobante y garantía</summary>
                <ul className="product-perks">
                  {perks.map(({ icon, text }) => (
                    <li key={text}>
                      {icon}
                      {text}
                    </li>
                  ))}
                </ul>
              <Link className="product-info-link" to="/informacion-de-compra">
                Ver información de compra y garantía
              </Link>
              </details>
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
            { label: 'Marca', value: publicBrand(data) || '—' },
            { label: 'Categoría', value: data.category || '—' },
            { label: 'Código', value: publicProductCode(data) },
          ]}
        />
        <p className="flow-note">El precio y la disponibilidad se confirman al crear el pedido.</p>
      </PageSection>
      {related.length > 0 && (
        <PageSection title={data.category ? `Más en ${data.category}` : 'Productos relacionados'}>
          <ProductComparison product={data} alternatives={related} />
          <div className="featured-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </PageSection>
      )}
      {showQuickBuy && remaining > 0 && (
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
