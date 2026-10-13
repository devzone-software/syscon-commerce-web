import { useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { InfoRows } from '../components/cart/OrderSummary';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { OrderLines } from '../components/orders/OrderLines';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { PaymentDetails } from '../components/orders/PaymentDetails';
import { StatusBadge } from '../components/shared/StatusBadge';
import { billingRows } from '../lib/billing';
import { orderStatusLabels, shortId, statusLabel } from '../lib/orders';
import { api } from '../services/api';
import { money } from '../state';
import type { Payment } from '../types';
import { useData, ErrorBox, Loading } from '../ui';

const nextSteps = [
  {
    title: '1. Confirmación del pago',
    text: 'Un asesor verifica tu pago y lo registra en el pedido.',
  },
  { title: '2. Preparación del pedido', text: 'Nuestro equipo validará stock y despacho.' },
  { title: '3. Seguimiento', text: 'Podrás revisar el estado desde Mi cuenta.' },
];

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
    <>
      {isNew ? (
        <PageHero
          large
          eyebrow="COMPRA CONFIRMADA"
          title="¡Gracias por tu compra!"
          text="Tu pedido fue registrado correctamente. El precio y el stock fueron confirmados."
        >
          <p className="page-hero-order">Orden #{shortId(id)}</p>
        </PageHero>
      ) : (
        <PageHero
          eyebrow="MI PEDIDO"
          title={`Pedido ${shortId(id)}`}
          text="Estado, productos y pago de tu pedido."
        />
      )}
      {loading ? (
        <PageSection>
          <Loading />
        </PageSection>
      ) : error ? (
        <PageSection>
          <ErrorBox message={error} retry={reload} />
        </PageSection>
      ) : (
        data && (
          <>
            <PageSection title="Resumen de la compra">
              <InfoRows
                rows={[
                  {
                    label: 'Estado',
                    value: <StatusBadge status={data.status} labels={orderStatusLabels} />,
                  },
                  { label: 'Total', value: money(Number(data.total)) },
                  { label: 'Entrega', value: 'Coordinación con asesor' },
                  ...billingRows(data.billing),
                ]}
              />
              <OrderTimeline status={data.status} />
              <h3 className="flow-subtitle">Productos</h3>
              <OrderLines order={data} />
            </PageSection>
            <PageSection title={isNew ? '¿Qué sigue ahora?' : 'Pago'} soft>
              {isNew && (
                <ol className="flow-steps">
                  {nextSteps.map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}</strong>
                      {step.text}
                    </li>
                  ))}
                </ol>
              )}
              {payment && <PaymentDetails payment={payment} />}
              {data.status === 'PAYMENT_PENDING' ? (
                <>
                  <p className="flow-note">
                    El método disponible es el pago manual. Un asesor confirmará el pago tras
                    verificarlo; conserva el identificador de la solicitud.
                  </p>
                  {payError && <ErrorBox message={payError} />}
                  {!payment && (
                    <button
                      type="button"
                      className="flow-button"
                      disabled={busy}
                      onClick={requestPayment}
                    >
                      {busy ? 'Procesando…' : 'Ver o solicitar pago manual'}
                    </button>
                  )}
                </>
              ) : (
                !payment && (
                  <p className="flow-note">
                    Estado del pedido:{' '}
                    <strong>{statusLabel(orderStatusLabels, data.status)}</strong>.
                  </p>
                )
              )}
              <Link className="flow-button is-secondary" to="/cuenta/pedidos">
                Ver mis pedidos
              </Link>
            </PageSection>
          </>
        )
      )}
    </>
  );
}
