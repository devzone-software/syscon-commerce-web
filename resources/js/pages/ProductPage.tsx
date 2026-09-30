import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import { ProductImage } from '../components/ProductImage';
import { StockBadge } from '../components/product/StockBadge';
import { QuantityStepper } from '../components/shared/QuantityStepper';
import { CartIcon } from '../components/icons';
import { relatedProducts } from '../lib/catalog';
import { useData, Loading, Empty, ProductCard } from '../ui';

export function ProductPage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useData(() => api.product(id), [id]);
  const catalog = useData(api.products);
  const { add, cart } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(0);

  useEffect(() => {
    setQuantity(1);
    setAdded(0);
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
    add(data, units);
    setAdded(units);
    setQuantity(1);
  };

  return (
    <div className="container page product-page">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link> <span aria-hidden="true">/</span>{' '}
        <Link to="/catalogo">Catálogo</Link>
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
          {data.brand && (
            <Link
              className="product-detail-brand"
              to={`/catalogo?marca=${encodeURIComponent(data.brand)}`}
            >
              {data.brand}
            </Link>
          )}
          <h1>{data.name}</h1>
          <dl className="product-detail-meta">
            <div>
              <dt>SKU</dt>
              <dd>{data.sku}</dd>
            </div>
            {data.category && (
              <div>
                <dt>Categoría</dt>
                <dd>{data.category}</dd>
              </div>
            )}
          </dl>
          <p className="product-detail-price">{money(Number(data.price))}</p>
          <StockBadge stock={data.stock} showUnits />
          <div className="product-buy">
            {remaining > 0 ? (
              <>
                <QuantityStepper
                  label="Cantidad"
                  value={units}
                  max={remaining}
                  onChange={setQuantity}
                />
                <button type="button" className="button button-primary" onClick={addToCart}>
                  <CartIcon /> Agregar al carrito
                </button>
              </>
            ) : (
              <p className="notice">
                {data.stock < 1
                  ? 'Este producto no tiene stock disponible por ahora.'
                  : 'Ya tienes en tu carrito todas las unidades disponibles.'}
              </p>
            )}
          </div>
          {inCart > 0 && (
            <p className="product-in-cart">
              Tienes {inCart} {inCart === 1 ? 'unidad' : 'unidades'} en tu carrito.
            </p>
          )}
          {added > 0 && (
            <div className="notice success" role="status">
              {added === 1 ? 'Se agregó 1 unidad' : `Se agregaron ${added} unidades`} al carrito.{' '}
              <Link to="/carrito">Ver carrito</Link>
            </div>
          )}
          <p className="product-detail-note">
            El precio y el stock se validan nuevamente al confirmar el pedido.
          </p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="product-related" aria-labelledby="related-title">
          <h2 id="related-title">
            {data.category ? `Más en ${data.category}` : `Más de ${data.brand}`}
          </h2>
          <div className="product-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
