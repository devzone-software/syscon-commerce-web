import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartLineItem } from '../components/cart/CartLineItem';
import { OrderSummary } from '../components/cart/OrderSummary';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { useCartReview } from '../hooks/useCartReview';
import { useShop } from '../state';
import { Empty } from '../ui';

const hero = (
  <PageHero
    eyebrow="TU COMPRA"
    title="Carrito de compras"
    text="Revisa tus productos antes de continuar al pago."
  />
);

export function Cart() {
  const { cart, setQuantity, clear } = useShop();
  const { issues, checking, error } = useCartReview();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!cart.length)
    return (
      <>
        {hero}
        <PageSection>
          <Empty
            title="Tu carrito está vacío"
            text="Explora el catálogo y agrega los productos que necesitas."
            action={
              <Link className="button button-primary" to="/catalogo">
                Ir al catálogo
              </Link>
            }
          />
        </PageSection>
      </>
    );

  return (
    <>
      {hero}
      <PageSection
        title="Productos en tu carrito"
        action={
          confirmClear ? (
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
          )
        }
      >
        {error && (
          <p className="notice" role="status">
            No se pudo verificar la disponibilidad actual: {error} El stock se validará al crear el
            pedido.
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
      </PageSection>
      <PageSection title="Resumen de compra" soft>
        <OrderSummary lines={cart}>
          {issues.size > 0 && (
            <p className="notice error" role="alert">
              Revisa los productos marcados antes de continuar.
            </p>
          )}
          {checking ? (
            <button type="button" className="flow-button" disabled>
              Verificando disponibilidad…
            </button>
          ) : issues.size > 0 ? (
            <button type="button" className="flow-button" disabled>
              Continuar al checkout
            </button>
          ) : (
            <Link className="flow-button" to="/checkout">
              Continuar al checkout
            </Link>
          )}
        </OrderSummary>
      </PageSection>
    </>
  );
}
