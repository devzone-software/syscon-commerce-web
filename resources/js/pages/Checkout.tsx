import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import { ErrorBox } from '../ui';

export function Checkout() {
  const { cart, clear, user } = useShop();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const order = await api.createOrder(
        cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      );
      clear();
      navigate(`/pedido/${order.id}?pagar=1`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!cart.length) return <Navigate to="/carrito" replace />;
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow accent">PASO 2 DE 3</span>
        <h1>Confirma tu pedido</h1>
        <p>Revisa tus datos y los productos antes de continuar al pago.</p>
      </div>
      <div className="cart-layout">
        <div className="checkout-details">
          <div className="white-card">
            <h2>Datos del cliente</h2>
            <p>
              <strong>Correo:</strong> {user?.email}
            </p>
            <p>La cuenta registrada se vinculará al pedido.</p>
          </div>
          <div className="white-card">
            <h2>Productos</h2>
            {cart.map((l) => (
              <div className="checkout-line" key={l.product.id}>
                <span>
                  {l.product.name} × {l.quantity}
                </span>
                <strong>{money(Number(l.product.price) * l.quantity)}</strong>
              </div>
            ))}
          </div>
          {error && <ErrorBox message={error} />}
        </div>
        <aside className="summary-card">
          <h2>Resumen del pedido</h2>
          <div className="summary-total">
            <span>Total estimado</span>
            <strong>
              {money(cart.reduce((n, l) => n + Number(l.product.price) * l.quantity, 0))}
            </strong>
          </div>
          <p>El backend confirmará el precio y stock al crear el pedido.</p>
          <button className="button button-primary full" disabled={busy} onClick={submit}>
            {busy ? 'Creando pedido…' : 'Confirmar pedido →'}
          </button>
        </aside>
      </div>
    </div>
  );
}
