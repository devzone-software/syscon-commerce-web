import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { OrderSummary } from '../components/cart/OrderSummary';
import { CheckoutSteps } from '../components/checkout/CheckoutSteps';
import { useCartReview } from '../hooks/useCartReview';
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
    <div className="container page">
      <div className="page-heading">
        <CheckoutSteps current={2} />
        <h1>Confirma tu pedido</h1>
        <p>Revisa los productos y el método de pago antes de crear el pedido.</p>
      </div>
      <div className="cart-layout">
        <div className="checkout-details">
          <section className="white-card" aria-labelledby="checkout-customer">
            <h2 id="checkout-customer">Cliente</h2>
            <p>
              <strong>{user?.email}</strong>
            </p>
            <p>El pedido quedará vinculado a tu cuenta y podrás seguirlo desde “Mis pedidos”.</p>
          </section>
          <section className="white-card" aria-labelledby="checkout-products">
            <div className="checkout-card-head">
              <h2 id="checkout-products">Productos</h2>
              <Link className="link-button" to="/carrito">
                Editar carrito
              </Link>
            </div>
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
          </section>
          <section className="white-card" aria-labelledby="checkout-payment">
            <h2 id="checkout-payment">Método de pago</h2>
            <label className="payment-option">
              <input type="radio" name="payment" checked readOnly />
              <span>
                <strong>Pago manual</strong>
                Tras crear el pedido se registra una solicitud de pago. Un administrador la confirma
                cuando verifica el pago.
              </span>
            </label>
          </section>
          {error && <ErrorBox message={error} />}
        </div>
        <OrderSummary lines={cart} title="Resumen del pedido">
          {issues.size > 0 && (
            <p className="notice error" role="alert">
              Hay productos que requieren atención. <Link to="/carrito">Revisar carrito</Link>
            </p>
          )}
          <button
            type="button"
            className="button button-primary full"
            disabled={busy || blocked}
            onClick={submit}
          >
            {busy ? 'Creando pedido…' : checking ? 'Verificando disponibilidad…' : 'Crear pedido'}
          </button>
        </OrderSummary>
      </div>
    </div>
  );
}
