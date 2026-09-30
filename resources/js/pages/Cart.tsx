import { Link } from 'react-router-dom';
import { money, useShop } from '../state';
import { ProductImage } from '../components/ProductImage';
import { Empty } from '../ui';

export function Cart() {
  const { cart, setQuantity } = useShop();
  const total = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow accent">TU SELECCIÓN</span>
        <h1>Carrito de compras</h1>
      </div>
      {!cart.length ? (
        <Empty
          title="Tu carrito está vacío"
          text="Explora nuestro catálogo para encontrar productos."
          action={
            <Link className="button button-primary" to="/catalogo">
              Ir al catálogo
            </Link>
          }
        />
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map(({ product, quantity }) => (
              <div className="cart-row" key={product.id}>
                <div className="cart-thumb">
                  <ProductImage product={product} />
                </div>
                <div className="cart-info">
                  <Link to={`/producto/${product.id}`}>{product.name}</Link>
                  <span>
                    {product.brand || 'SYSCON'} · SKU {product.sku}
                  </span>
                  <button className="link-button" onClick={() => setQuantity(product.id, 0)}>
                    Eliminar
                  </button>
                </div>
                <div className="cart-controls">
                  <strong>{money(Number(product.price) * quantity)}</strong>
                  <div className="stepper">
                    <button
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      aria-label="Reducir cantidad"
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="summary-card">
            <h2>Resumen</h2>
            <div>
              <span>Productos ({cart.reduce((n, l) => n + l.quantity, 0)})</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="summary-total">
              <span>Total estimado</span>
              <strong>{money(total)}</strong>
            </div>
            <p>El precio y el stock se confirman al crear el pedido.</p>
            <Link className="button button-primary full" to="/checkout">
              Continuar compra →
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
