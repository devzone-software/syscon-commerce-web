import { useEffect, useRef, useState } from 'react';
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
import {
  customerOrderHint,
  formatDateTime,
  orderLabelsForDelivery,
  shortId,
  statusLabel,
} from '../lib/orders';
import { api } from '../services/api';
import {
  gatewayReturnNotice,
  onlineGateway,
  paymentMethodLabel,
  type OnlineGateway,
} from '../lib/sales';
import { money } from '../state';
import type { Payment } from '../types';
import { useData, ErrorBox, Loading } from '../ui';
import { ShoppingBackLink } from '../components/shared/ShoppingBackLink';

export function OrderPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const isNew = params.get('nuevo') === '1';
  const fromGateway = params.get('pago') === 'retorno';
  const { data, error, loading, refreshing, reload } = useData(() => api.order(id), [id], {
    keepPreviousData: true,
  });
  const refresh = useRef(reload);
  refresh.current = reload;
  const refreshingRef = useRef(refreshing);
  refreshingRef.current = refreshing;
  const polls = useRef(0);
  useEffect(() => {
    polls.current = 0;
  }, [id]);
  useEffect(() => {
    if (
      data?.status !== 'PAYMENT_PENDING' &&
      !['PENDING', 'PROCESSING'].includes(data?.invoiceAutomation ?? '')
    )
      return;
    const timer = window.setInterval(() => {
      if (polls.current >= 24) {
        window.clearInterval(timer);
        return;
      }
      if (document.hidden || refreshingRef.current) return;
      polls.current++;
      refresh.current();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [id, data?.status, data?.invoiceAutomation]);
  const [payment, setPayment] = useState<Payment | null>(
    (location.state as { payment?: Payment | null } | null)?.payment ?? null,
  );
  const [payError, setPayError] = useState('');
  const [busy, setBusy] = useState(false);
  const methods = useData(api.paymentMethods);
  const deliveryOptions = useData(api.deliveryOptions);
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
  const returnNotice = returned && data ? gatewayReturnNotice(data.status) : returned;
  const labels = orderLabelsForDelivery(data?.delivery?.method);
  const pendingPayment =
    data?.status === 'PAYMENT_PENDING' && payment?.orderId === id ? payment : null;
  const methodsReady = !methods.loading && !methods.error && Boolean(methods.data);

  const payOnline = async (provider: OnlineGateway) => {
    if (!methodsReady || !methods.data?.gateways.includes(provider) || busy) return;
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
    if (!methodsReady || !methods.data?.manual || busy) return;
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
    <div className="customer-order-page">
      {isNew ? (
        <PageHero
          large
          eyebrow="PEDIDO REGISTRADO"
          title="Tu pedido fue registrado"
          text="Recibimos tu pedido. Revisa aquí el estado del pago y la coordinación de entrega."
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
      <div className="container shopping-navigation">
        <ShoppingBackLink to="/cuenta/pedidos">Volver a mis pedidos</ShoppingBackLink>
        <button
          type="button"
          className="button button-secondary"
          onClick={reload}
          disabled={refreshing}
        >
          {refreshing ? 'Actualizando…' : 'Actualizar estado'}
        </button>
      </div>
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
          <div className="container customer-order-layout">
            <PageSection title="Tu pedido">
              <div className="customer-order-overview">
                <StatusBadge status={data.status} labels={labels} />
                <strong>{money(Number(data.total))}</strong>
              </div>
              <p className="notice" role="status">
                {customerOrderHint(data.status, data.delivery?.method)}
              </p>
              {BILLABLE.includes(data.status) && (
                <section className="order-receipt" aria-labelledby="order-receipt-title">
                  <h3 id="order-receipt-title" className="flow-subtitle">
                    Tu comprobante
                  </h3>
                  <OrderDocuments orderId={data.id} automation={data.invoiceAutomation} />
                </section>
              )}
              <h3 className="flow-subtitle">Seguimiento de tu pedido</h3>
              <OrderTimeline status={data.status} method={data.delivery?.method} />
              <div className="order-info">
                <InfoRows
                  rows={[
                    ...deliveryRows(data.delivery),
                    ...(data.delivery?.method === 'PICKUP'
                      ? [
                          ...(deliveryOptions.data?.pickup.address
                            ? [
                                {
                                  label: 'Punto de retiro',
                                  value: deliveryOptions.data.pickup.address,
                                },
                              ]
                            : []),
                          ...(deliveryOptions.data?.pickup.hours
                            ? [
                                {
                                  label: 'Horario de retiro',
                                  value: deliveryOptions.data.pickup.hours,
                                },
                              ]
                            : []),
                        ]
                      : []),
                  ]}
                />
              </div>
              <details className="customer-order-billing">
                <summary>Datos del comprobante</summary>
                <InfoRows rows={billingRows(data.billing)} />
              </details>
              <h3 className="flow-subtitle">Productos</h3>
              <OrderLines order={data} />
            </PageSection>
            <PageSection title="Pago" soft>
              {returnNotice && (
                <p
                  className={`notice ${returnNotice.tone === 'success' ? 'success' : ''}`}
                  role="status"
                >
                  {returnNotice.text}
                </p>
              )}
              {fromGateway && !returned && <p className="flow-note">Confirmando tu pago…</p>}
              {BILLABLE.includes(data.status) && (
                <InfoRows
                  rows={[
                    { label: 'Pago', value: 'Confirmado' },
                    {
                      label: 'Medio de pago',
                      value: data.paymentMethods?.length
                        ? data.paymentMethods.map(paymentMethodLabel).join(', ')
                        : 'No informado',
                    },
                    { label: 'Total del pedido', value: money(Number(data.total)) },
                  ]}
                />
              )}
              {pendingPayment && <PaymentDetails payment={pendingPayment} />}
              {data.status === 'PAYMENT_PENDING' ? (
                <>
                  {methods.loading ? (
                    <p className="flow-note" role="status">
                      Consultando medios de pago…
                    </p>
                  ) : methods.error ? (
                    <ErrorBox
                      message={`No pudimos consultar los medios de pago. ${methods.error}`}
                      retry={methods.reload}
                    />
                  ) : !methods.data?.manual && !gateway ? (
                    <ErrorBox
                      message="No hay medios de pago disponibles. Reintenta la consulta o contacta con SYSCON."
                      retry={methods.reload}
                    />
                  ) : null}
                  {methodsReady && (methods.data?.manual || gateway) && (
                    <p className="flow-note">
                      {gateway
                        ? methods.data?.manual
                          ? 'Paga en línea o coordina el pago con un asesor.'
                          : 'Paga en línea con la pasarela disponible. El estado se actualizará cuando se confirme el pago.'
                        : 'Coordina el pago con un asesor. Conserva el identificador de tu solicitud.'}
                      {data.expiresAt &&
                        ` Reservamos tus productos hasta el ${formatDateTime(data.expiresAt)}; si el pago no se confirma antes, el pedido vence.`}
                    </p>
                  )}
                  {payError && <ErrorBox message={payError} />}
                  {methodsReady && gateway && (
                    <button
                      type="button"
                      className="flow-button"
                      disabled={busy}
                      onClick={() => payOnline(gateway.provider)}
                    >
                      {busy ? 'Redirigiendo…' : gateway.label}
                    </button>
                  )}
                  {methodsReady && methods.data?.manual && !pendingPayment && (
                    <button
                      type="button"
                      className="flow-button"
                      disabled={busy}
                      onClick={requestPayment}
                    >
                      {busy ? 'Procesando…' : 'Pagar con un asesor'}
                    </button>
                  )}
                </>
              ) : (
                !BILLABLE.includes(data.status) && (
                  <p className="flow-note">
                    Estado del pedido: <strong>{statusLabel(labels, data.status)}</strong>.
                  </p>
                )
              )}
              <Link
                className="link-button"
                to={`/cuenta/soporte?${new URLSearchParams({ pedido: data.id })}#formulario`}
              >
                Consultar sobre este pedido
              </Link>
            </PageSection>
          </div>
        )
      )}
    </div>
  );
}
