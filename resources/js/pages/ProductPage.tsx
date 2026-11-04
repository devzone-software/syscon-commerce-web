import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import { useConfirmAdd } from '../components/cart/AddToCartDialog';
import { ProductImage } from '../components/ProductImage';
import { InfoRows } from '../components/cart/OrderSummary';
import { PageSection } from '../components/layout/PageHero';
import { QuantityStepper } from '../components/shared/QuantityStepper';
import { CartIcon, HeadsetIcon, ReceiptIcon, ShieldIcon, TruckIcon } from '../components/icons';
import { relatedProducts } from '../lib/catalog';
import { useData, Loading, Empty, ProductCard } from '../ui';
import '../../css/storefront.css';

const perks = [
  { icon: <ReceiptIcon size={18} />, text: 'Boleta o factura electrónica con tu compra' },
  { icon: <ShieldIcon size={18} />, text: 'Garantía oficial del fabricante' },
  { icon: <TruckIcon size={18} />, text: 'Recojo en tienda o envío coordinado' },
  { icon: <HeadsetIcon size={18} />, text: 'Asesoría técnica antes y después de comprar' },
];

export function ProductPage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useData(() => api.product(id), [id]);
  const catalog = useData(api.products);
  const { cart } = useShop();
  const confirmAdd = useConfirmAdd();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [id]);

  const related = useMemo(
    () => (data && catalog.data ? relatedProducts(data, catalog.data) : []),
    [data, catalog.data],
  );

  if (loading)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (error || !data)
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
  const addToCart = () => {
    confirmAdd(data, units);
    setQuantity(1);
  };

  return (
    <>
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
            <div className="product-detail-media">
              <ProductImage product={data} />
            </div>
            <div className="product-detail-info">
              <p className="product-detail-eyebrow">
                {[data.category, data.stock < 1 && 'Agotado'].filter(Boolean).join(' · ')}
              </p>
              <h1>{data.name}</h1>
              <p className="product-detail-sub">
                {[data.brand, `SKU ${data.sku}`].filter(Boolean).join(' · ')}
              </p>
              <p className="product-detail-price">{money(Number(data.price))}</p>
              <div className="product-buy">
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
              <ul className="product-perks">
                {perks.map(({ icon, text }) => (
                  <li key={text}>
                    {icon}
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <PageSection title="Especificaciones y descripción">
        <InfoRows
          rows={[
            { label: 'Marca', value: data.brand ?? '—' },
            { label: 'Categoría', value: data.category ?? '—' },
            { label: 'SKU', value: data.sku },
          ]}
        />
        <p className="flow-note">El precio y la disponibilidad se confirman al crear el pedido.</p>
      </PageSection>
      {related.length > 0 && (
        <PageSection title={data.category ? `Más en ${data.category}` : `Más de ${data.brand}`}>
          <div className="featured-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </PageSection>
      )}
    </>
  );
}
