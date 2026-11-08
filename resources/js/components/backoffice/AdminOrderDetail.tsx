import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InfoRows } from '../cart/OrderSummary';
import { OrderLines } from '../orders/OrderLines';
import { OrderTimeline } from '../orders/OrderTimeline';
import { StatusBadge } from '../shared/StatusBadge';
import { OrderNotifications } from './OrderNotifications';
import { OrderHistory } from './OrderHistory';
import { can, permissions } from '../../lib/auth';
import {
  billingRows,
  invoiceFileUrl,
  invoiceStatusLabels,
  invoiceTypeLabel,
} from '../../lib/billing';
import { deliveryRows } from '../../lib/delivery';
import {
  allowedTransitions,
  formatDateTime,
  orderStatusLabels,
  paymentStatusLabels,
  shortId,
  statusLabel,
} from '../../lib/orders';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import type { AdminOrder } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

/** Main documents (factura, boleta); notes reference them. */
const MAIN_INVOICES = ['01', '03'];

export function AdminOrderDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { user } = useShop();
  const { data, loading, error, reload } = useData<AdminOrder>(() => api.adminOrder(id), [id]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const transition = async (status: string) => {
    setBusy(status);
    setMessage('');
    setActionError('');
    try {
      await api.setOrderStatus(id, status);
      setMessage(`Estado actualizado a “${statusLabel(orderStatusLabels, status)}”.`);
      setConfirmCancel(false);
      reload();
      onChanged();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error || 'Pedido no encontrado.'} retry={reload} />;
  const options = allowedTransitions(data.status);
  const hasMainInvoice = data.invoices.some((invoice) => MAIN_INVOICES.includes(invoice.type));
  // The platform only bills paid orders, once per main document.
  const invoiceable =
    can(user, permissions.invoicesSubmit) &&
    !hasMainInvoice &&
    ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(data.status);
  const pendingPayment = data.payments.find((payment) => payment.status === 'PENDING');

  return (
    <div className="bo-detail-grid">
      <section className="bo-card" aria-labelledby="order-detail-title">
        <div className="order-top">
          <h2 id="order-detail-title">Pedido {shortId(data.id)}</h2>
          <StatusBadge status={data.status} labels={orderStatusLabels} />
        </div>
        <OrderTimeline status={data.status} />
        <InfoRows
          rows={[
            { label: 'Registrado', value: formatDateTime(data.createdAt ?? null) },
            ...(data.expiresAt
              ? [{ label: 'Reserva vence', value: formatDateTime(data.expiresAt) }]
              : []),
            {
              label: 'Cliente',
              value: data.customer
                ? [data.customer.name, data.customer.email].filter(Boolean).join(' · ')
                : '—',
            },
            ...(data.customer?.phone ? [{ label: 'Teléfono', value: data.customer.phone }] : []),
            ...deliveryRows(data.delivery),
            ...billingRows(data.billing),
            { label: 'Total', value: money(Number(data.total)), tone: 'total' as const },
          ]}
        />
        <h3 className="flow-subtitle">Productos</h3>
        <OrderLines order={data} />
        <h3 className="flow-subtitle">Historial</h3>
        <OrderHistory events={data.events} />
      </section>
      <aside className="bo-card" aria-labelledby="order-actions-title">
        <h2 id="order-actions-title">Gestión</h2>
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {actionError && <ErrorBox message={actionError} />}

        <h3 className="flow-subtitle">Pagos</h3>
        {data.payments.length ? (
          <ul className="bo-simple-list">
            {data.payments.map((payment) => (
              <li key={payment.id}>
                <span>
                  <strong>{money(Number(payment.amount))}</strong>
                  <small>
                    {payment.externalReference
                      ? `Ref. ${payment.externalReference}`
                      : `Solicitado ${formatDateTime(payment.createdAt ?? null)}`}
                    {payment.confirmedBy && ` · ${payment.confirmedBy}`}
                  </small>
                </span>
                <StatusBadge status={payment.status} labels={paymentStatusLabels} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">El cliente aún no solicitó el pago.</p>
        )}
        {pendingPayment && can(user, permissions.paymentsConfirm) && (
          <Link
            className="button button-secondary full"
            to={`/admin/pagos?id=${pendingPayment.id}`}
          >
            Verificar pago
          </Link>
        )}

        <h3 className="flow-subtitle">Comprobantes</h3>
        {data.invoices.length ? (
          <ul className="bo-simple-list">
            {data.invoices.map((invoice) => (
              <li key={invoice.id}>
                <span>
                  <strong>{invoice.serialNumber}</strong>
                  <small>
                    {invoiceTypeLabel(invoice.type)} · {money(Number(invoice.total))}
                  </small>
                </span>
                {can(user, permissions.invoicesSubmit) ? (
                  <span>
                    <Link className="link-button" to={`/admin/facturacion?id=${invoice.id}`}>
                      {statusLabel(invoiceStatusLabels, invoice.status)}
                    </Link>{' '}
                    <a
                      className="link-button"
                      href={invoiceFileUrl(invoice.id, 'pdf')}
                      target="_blank"
                      rel="noopener"
                    >
                      PDF<span className="visually-hidden"> de {invoice.serialNumber}</span>
                    </a>
                  </span>
                ) : (
                  <span>{statusLabel(invoiceStatusLabels, invoice.status)}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Sin comprobantes emitidos.</p>
        )}
        {invoiceable && (
          <Link
            className="button button-secondary full"
            to={`/admin/facturacion?pedido=${data.id}`}
          >
            Revisar y preparar comprobante
          </Link>
        )}

        {data.notifications && (
          <OrderNotifications
            notifications={data.notifications}
            canResend={can(user, permissions.ordersManage)}
            onResent={reload}
          />
        )}

        <h3 className="flow-subtitle">Estado</h3>
        {data.status === 'PAYMENT_PENDING' && (
          <p className="notice">
            El pedido pasa a “Pagado” cuando se confirma su pago manual en la sección Pagos.
            {data.expiresAt &&
              ` Si no se confirma antes del ${formatDateTime(data.expiresAt)}, vence y libera su stock.`}
          </p>
        )}
        {options.length ? (
          <div className="form-stack">
            {options
              .filter((status) => status !== 'CANCELLED')
              .map((status) => (
                <button
                  key={status}
                  type="button"
                  className="button button-primary"
                  disabled={Boolean(busy)}
                  onClick={() => transition(status)}
                >
                  {busy === status
                    ? 'Actualizando…'
                    : `Marcar como ${statusLabel(orderStatusLabels, status).toLowerCase()}`}
                </button>
              ))}
            {options.includes('CANCELLED') &&
              (confirmCancel ? (
                <div className="bo-confirm" role="group" aria-label="Confirmar cancelación">
                  <span>¿Cancelar este pedido? Se libera su stock y no se puede deshacer.</span>
                  <button
                    type="button"
                    className="button button-danger"
                    disabled={Boolean(busy)}
                    onClick={() => transition('CANCELLED')}
                  >
                    {busy === 'CANCELLED' ? 'Cancelando…' : 'Sí, cancelar pedido'}
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Volver
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancelar pedido
                </button>
              ))}
          </div>
        ) : (
          <p className="muted">No hay cambios de estado disponibles para este pedido.</p>
        )}
      </aside>
    </div>
  );
}
