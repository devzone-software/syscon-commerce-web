import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import { ProductImage } from '../components/ProductImage';
import { useData, ErrorBox, Loading } from '../ui';

export function ProductPage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useData(() => api.product(id), [id]);
  const { add } = useShop();
  const [added, setAdded] = useState(false);
  if (loading)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (error || !data)
    return (
      <div className="container page">
        <ErrorBox message={error || 'Producto no encontrado.'} retry={reload} />
      </div>
    );
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/catalogo">Catálogo</Link> / {data.category || 'Producto'} / {data.name}
      </div>
      <div className="detail-grid">
        <div className="detail-image">
          <ProductImage product={data} />
        </div>
        <div className="detail-copy">
          <span className="eyebrow accent">
            {data.brand || 'SYSCON'} · {data.category || 'Tecnología'}
          </span>
          <h1>{data.name}</h1>
          <p className="muted">Código: {data.sku}</p>
          <div className="detail-price">{money(Number(data.price))}</div>
          <div className={`stock ${data.stock > 0 ? '' : 'out'}`}>
            {data.stock > 0 ? `● Disponible · ${data.stock} unidades` : '○ Sin stock'}
          </div>
          <p className="detail-description">
            Consulta la disponibilidad y completa tu pedido en línea. El precio y el stock se
            validan nuevamente al confirmar la compra.
          </p>
          <button
            className="button button-primary"
            disabled={data.stock < 1}
            onClick={() => {
              add(data);
              setAdded(true);
            }}
          >
            {data.stock > 0 ? 'Agregar al carrito  ↗' : 'No disponible'}
          </button>
          {added && (
            <p className="success-text">
              Producto agregado. <Link to="/carrito">Ver carrito →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
