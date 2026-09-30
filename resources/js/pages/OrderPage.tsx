import { useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { CheckoutSteps } from '../components/checkout/CheckoutSteps';
import { OrderLines } from '../components/orders/OrderLines';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { PaymentDetails } from '../components/orders/PaymentDetails';
import { StatusBadge } from '../components/shared/StatusBadge';
import { orderStatusLabels, shortId, statusLabel } from '../lib/orders';
import { api } from '../services/api';
import type { Payment } from '../types';
import { useData, ErrorBox, Loading } from '../ui';

export function OrderPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const isNew = params.get('nuevo') === '1';
  const { data, error, loading, reload } = useData(() => api.order(id), [id]);
  const [payment, setPayment] = useState<Payment | null>(
    (location.state as { payment?: Payment | null } | null)?.payment ?? null,
  );
  const [payError, setPayError] = useState('');
  const [busy, setBusy] = useState(false);

  // POST /payments returns the existing MANUAL request for the order when there is one.
  const requestPayment = async () => {
    setBusy(true);
    setPayError('');
    try {
      setPayment(await api.createPayment(id));
    } catch (e) {
      setPayError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-heading">
        {isNew && <CheckoutSteps current={3} />}
        <span className="eyebrow accent">{isNew ? 'PEDIDO CREADO' : 'MI PEDIDO'}</span>
        <h1>Pedido {shortId(id)}</h1>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        data && (
          <div className="order-layout">
            <div>
              {isNew && (
                <p className="notice success" role="status">
                  Tu pedido se creó correctamente. El precio y el stock fueron confirmados.
                </p>
              )}
              <section className="white-card" aria-labelledby="order-status-title">
                <div className="order-top">
                  <h2 id="order-status-title">Estado</h2>
                  <StatusBadge status={data.status} labels={orderStatusLabels} />
                </div>
                <OrderTimeline status={data.status} />
              </section>
              <section className="white-card" aria-labelledby="order-lines-title">
                <h2 id="order-lines-title">Productos</h2>
                <OrderLines order={data} />
              </section>
            </div>
            <aside className="summary-card" aria-labelledby="order-payment-title">
              <h2 id="order-payment-title">Pago</h2>
              {payment && <PaymentDetails payment={payment} />}
              {data.status === 'PAYMENT_PENDING' ? (
                <>
                  <p>
                    El método disponible es el pago manual. Un administrador confirmará el pago tras
                    verificarlo; conserva el identificador de la solicitud.
                  </p>
                  {payError && <ErrorBox message={payError} />}
                  {!payment && (
                    <button
                      type="button"
                      className="button button-primary full"
                      disabled={busy}
                      onClick={requestPayment}
                    >
                      {busy ? 'Procesando…' : 'Ver o solicitar pago manual'}
                    </button>
                  )}
                </>
              ) : (
                !payment && (
                  <p>
                    Estado del pedido:{' '}
                    <strong>{statusLabel(orderStatusLabels, data.status)}</strong>.
                  </p>
                )
              )}
              <Link className="arrow-link" to="/cuenta/pedidos">
                Ver todos mis pedidos →
              </Link>
            </aside>
          </div>
        )
      )}
    </div>
  );
}
