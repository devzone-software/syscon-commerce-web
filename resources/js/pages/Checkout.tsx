import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { InfoRows, OrderSummary } from '../components/cart/OrderSummary';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { useCartReview } from '../hooks/useCartReview';
import { displayName } from '../lib/auth';
import { issueMessages } from '../lib/cart';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment } from '../types';
import { ErrorBox } from '../ui';

export function Checkout() {
  const { cart, clear, user } = useShop();
  const { issues, checking } = useCartReview();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const order = await api.createOrder(
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      );
      clear();
      // The manual payment request is idempotent; if it fails the order page offers a retry.
      let payment: Payment | null = null;
      try {
        payment = await api.createPayment(order.id);
      } catch {
        payment = null;
      }
      navigate(`/pedido/${order.id}?nuevo=1`, { state: { payment } });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (!cart.length && !busy) return <Navigate to="/carrito" replace />;
  const blocked = checking || issues.size > 0;

  return (
    <>
      <PageHero
        eyebrow="CHECKOUT SEGURO"
        title="Finaliza tu compra"
        text="Revisa tus datos, los productos y el método de pago antes de confirmar."
      />
      <PageSection title="Datos de compra">
        <InfoRows
          rows={[
            { label: 'Cliente', value: user ? displayName(user) : '—' },
            { label: 'Correo electrónico', value: user?.email ?? '—' },
            { label: 'Entrega', value: 'Coordinación con un asesor de SYSCON' },
          ]}
        />
        <p className="flow-note">
          El pedido quedará vinculado a tu cuenta y podrás seguirlo desde “Mis pedidos”.
        </p>
        <h3 className="flow-subtitle">Productos</h3>
        <ul className="checkout-lines">
          {cart.map(({ product, quantity }) => {
            const issue = issues.get(product.id);
            return (
              <li key={product.id} className="checkout-line">
                <span>
                  {product.name} × {quantity}
                  {issue && <small className="cart-line-issue">{issueMessages[issue]}</small>}
                </span>
                <strong>{money(Number(product.price) * quantity)}</strong>
              </li>
            );
          })}
        </ul>
        <Link className="link-button" to="/carrito">
          Editar carrito
        </Link>
        <h3 className="flow-subtitle">Método de pago</h3>
        <label className="payment-option">
          <input type="radio" name="payment" checked readOnly />
          <span>
            <strong>Pago manual: transferencia bancaria o pago coordinado B2B</strong>
            Tras crear el pedido se registra una solicitud de pago. Un asesor la confirma cuando
            verifica el pago.
          </span>
        </label>
        {error && <ErrorBox message={error} />}
      </PageSection>
      <PageSection title="Resumen del pedido" soft>
        <OrderSummary lines={cart} totalLabel="Total a pagar">
          {issues.size > 0 && (
            <p className="notice error" role="alert">
              Hay productos que requieren atención. <Link to="/carrito">Revisar carrito</Link>
            </p>
          )}
          <button type="button" className="flow-button" disabled={busy || blocked} onClick={submit}>
            {busy
              ? 'Creando pedido…'
              : checking
                ? 'Verificando disponibilidad…'
                : 'Confirmar compra'}
          </button>
        </OrderSummary>
      </PageSection>
    </>
  );
}
