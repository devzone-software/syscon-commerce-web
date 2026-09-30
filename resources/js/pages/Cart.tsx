import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartLineItem } from '../components/cart/CartLineItem';
import { OrderSummary } from '../components/cart/OrderSummary';
import { useCartReview } from '../hooks/useCartReview';
import { useShop } from '../state';
import { Empty } from '../ui';

export function Cart() {
  const { cart, setQuantity, clear } = useShop();
  const { issues, checking, error } = useCartReview();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!cart.length)
    return (
      <div className="container page">
        <div className="page-heading">
          <span className="eyebrow accent">TU SELECCIÓN</span>
          <h1>Carrito de compras</h1>
        </div>
        <Empty
          title="Tu carrito está vacío"
          text="Explora el catálogo y agrega los productos que necesitas."
          action={
            <Link className="button button-primary" to="/catalogo">
              Ir al catálogo
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="container page">
      <div className="page-heading cart-heading">
        <div>
          <span className="eyebrow accent">TU SELECCIÓN</span>
          <h1>Carrito de compras</h1>
        </div>
        {confirmClear ? (
          <div className="cart-clear-confirm" role="group" aria-label="Confirmar vaciado">
            <span>¿Vaciar el carrito?</span>
            <button type="button" className="link-button" onClick={clear}>
              Sí, vaciar
            </button>
            <button type="button" className="link-button" onClick={() => setConfirmClear(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="link-button" onClick={() => setConfirmClear(true)}>
            Vaciar carrito
          </button>
        )}
      </div>
      <div className="cart-layout">
        <div>
          {error && (
            <p className="notice" role="status">
              No se pudo verificar la disponibilidad actual: {error} El stock se validará al crear
              el pedido.
            </p>
          )}
          <ul className="cart-lines">
            {cart.map((line) => (
              <CartLineItem
                key={line.product.id}
                line={line}
                issue={issues.get(line.product.id)}
                onQuantity={(quantity) => setQuantity(line.product.id, quantity)}
                onRemove={() => setQuantity(line.product.id, 0)}
              />
            ))}
          </ul>
          <Link className="arrow-link cart-continue" to="/catalogo">
            ← Seguir comprando
          </Link>
        </div>
        <OrderSummary lines={cart}>
          {issues.size > 0 && (
            <p className="notice error" role="alert">
              Revisa los productos marcados antes de continuar.
            </p>
          )}
          {checking ? (
            <button type="button" className="button button-primary full" disabled>
              Verificando disponibilidad…
            </button>
          ) : issues.size > 0 ? (
            <button type="button" className="button button-primary full" disabled>
              Continuar compra
            </button>
          ) : (
            <Link className="button button-primary full" to="/checkout">
              Continuar compra →
            </Link>
          )}
        </OrderSummary>
      </div>
    </div>
  );
}
