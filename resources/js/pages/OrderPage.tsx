import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { InfoRows } from '../components/cart/OrderSummary';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { BILLABLE, OrderDocuments } from '../components/orders/OrderDocuments';
import { OrderLines } from '../components/orders/OrderLines';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { PaymentDetails } from '../components/orders/PaymentDetails';
import { StatusBadge } from '../components/shared/StatusBadge';
import { billingRows } from '../lib/billing';
import { deliveryRows } from '../lib/delivery';
import { formatDateTime, orderStatusLabels, shortId, statusLabel } from '../lib/orders';
import { api } from '../services/api';
import { gatewayReturnNotice, onlineGateway, type OnlineGateway } from '../lib/sales';
import { money } from '../state';
import type { Payment } from '../types';
import { useData, ErrorBox, Loading } from '../ui';

const nextSteps = [
  {
    title: '1. Confirmación del pago',
    text: 'Un asesor verifica tu pago y lo registra en el pedido.',
  },
  {
    title: '2. Preparación del pedido',
    text: 'Nuestro equipo validará la disponibilidad y el despacho.',
  },
  { title: '3. Seguimiento', text: 'Podrás revisar el estado desde Mi cuenta.' },
];

export function OrderPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const isNew = params.get('nuevo') === '1';
  const fromGateway = params.get('pago') === 'retorno';
  const { data, error, loading, reload } = useData(() => api.order(id), [id]);
  const [payment, setPayment] = useState<Payment | null>(
    (location.state as { payment?: Payment | null } | null)?.payment ?? null,
  );
  const [payError, setPayError] = useState('');
  const [busy, setBusy] = useState(false);
  const methods = useData(api.paymentMethods);
  const [returned, setReturned] = useState<ReturnType<typeof gatewayReturnNotice> | null>(null);

  // Back from the gateway: success is shown only once the backend reports the order as paid.
  useEffect(() => {
    if (!fromGateway) return;
    let live = true;
    (async () => {
      let status: string | null = null;
      for (let i = 0; i < 6 && live; i++) {
        status = (await api.order(id).catch(() => null))?.status ?? null;
        if (status && status !== 'PAYMENT_PENDING') break;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      if (live) {
        setReturned(gatewayReturnNotice(status));
        reload();
      }
    })();
    return () => {
      live = false;
    };
  }, [fromGateway, id]);

  const gateway = onlineGateway(methods.data?.gateways);

  const payOnline = async (provider: OnlineGateway) => {
    setBusy(true);
    setPayError('');
    try {
      const attempt = await api.createPayment(id, provider);
      if (!attempt.paymentUrl) throw new Error('La pasarela no devolvió la página de pago.');
      window.location.assign(attempt.paymentUrl);
    } catch (e) {
      setPayError((e as Error).message);
      setBusy(false);
    }
  };

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
          text="Tu pedido fue registrado correctamente. El precio y la disponibilidad fueron confirmados."
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
              <OrderTimeline status={data.status} />
              <div className="order-info">
                <InfoRows
                  rows={[
                    {
                      label: 'Estado',
                      value: <StatusBadge status={data.status} labels={orderStatusLabels} />,
                    },
                    { label: 'Total', value: money(Number(data.total)) },
                    ...deliveryRows(data.delivery),
                    ...billingRows(data.billing),
                  ]}
                />
              </div>
              <h3 className="flow-subtitle">Productos</h3>
              <OrderLines order={data} />
            </PageSection>
            {BILLABLE.includes(data.status) && (
              <PageSection title="Comprobantes">
                <OrderDocuments orderId={data.id} />
              </PageSection>
            )}
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
              {returned && (
                <p
                  className={`notice ${returned.tone === 'success' ? 'success' : ''}`}
                  role="status"
                >
                  {returned.text}
                </p>
              )}
              {fromGateway && !returned && <p className="flow-note">Confirmando tu pago…</p>}
              {payment && <PaymentDetails payment={payment} />}
              {data.status === 'PAYMENT_PENDING' ? (
                <>
                  <p className="flow-note">
                    {gateway
                      ? 'Paga en línea o con pago manual; en el pago manual, un asesor lo confirmará tras verificarlo.'
                      : 'El método disponible es el pago manual. Un asesor confirmará el pago tras verificarlo; conserva el identificador de la solicitud.'}
                    {data.expiresAt &&
                      ` Reservamos tus productos hasta el ${formatDateTime(data.expiresAt)}; si el pago no se confirma antes, el pedido vence.`}
                  </p>
                  {payError && <ErrorBox message={payError} />}
                  {gateway && (
                    <button
                      type="button"
                      className="flow-button"
                      disabled={busy}
                      onClick={() => payOnline(gateway.provider)}
                    >
                      {busy ? 'Redirigiendo…' : gateway.label}
                    </button>
                  )}
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
