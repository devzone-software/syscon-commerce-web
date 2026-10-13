import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { InfoRows } from '../../components/cart/OrderSummary';
import { OrderLines } from '../../components/orders/OrderLines';
import { OrderTimeline } from '../../components/orders/OrderTimeline';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { can, permissions } from '../../lib/auth';
import { billingRows, invoiceTypeLabel } from '../../lib/billing';
import { deliveryMethodLabels, deliveryRows } from '../../lib/delivery';
import {
  allowedTransitions,
  formatDateTime,
  orderEventLabels,
  orderInboxTabs,
  orderStatusLabels,
  paymentStatusLabels,
  shortId,
  statusLabel,
} from '../../lib/orders';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import type { AdminOrder, OrderEvent } from '../../types';
import { useData, Empty, ErrorBox, Loading } from '../../ui';

/** Main documents (factura, boleta); notes reference them. */
const MAIN_INVOICES = ['01', '03'];

function eventText(event: OrderEvent) {
  const label = statusLabel(orderEventLabels, event.type);
  if (event.type === 'STATUS_CHANGED' && event.to)
    return `${label}: ${statusLabel(orderStatusLabels, event.to)}`;
  return label;
}

function OrderHistory({ events }: { events: OrderEvent[] }) {
  if (!events.length) return <p className="muted">Sin eventos registrados.</p>;
  return (
    <ol className="bo-history">
      {events.map((event, index) => (
        <li key={index}>
          <strong>{eventText(event)}</strong>
          <small>
            {formatDateTime(event.at)} · {event.system ? 'Sistema' : (event.actor ?? 'Usuario')}
            {event.reference && ` · Ref. ${event.reference}`}
          </small>
        </li>
      ))}
    </ol>
  );
}

function OrderDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
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
                  <Link className="link-button" to={`/admin/facturacion?id=${invoice.id}`}>
                    {invoice.status}
                  </Link>
                ) : (
                  <span>{invoice.status}</span>
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
            Emitir comprobante
          </Link>
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

export function OrdersAdmin() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const status = params.get('estado') ?? '';
  const q = params.get('q') ?? '';
  const from = params.get('desde') ?? '';
  const to = params.get('hasta') ?? '';
  const page = Number(params.get('pagina') || 1);
  const [search, setSearch] = useState(q);
  const { data, loading, error, reload } = useData(
    () => api.adminOrders({ status, q, from, to, page }),
    [status, q, from, to, page],
  );

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: search.trim() });
  };
  const counts = data?.counts ?? {};
  const all = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Pedidos de todos los clientes. Filtra por estado, busca por cliente, documento o ID y abre un pedido para ver su pago, comprobante e historial."
      />
      {id && <OrderDetail key={id} id={id} onChanged={reload} />}
      <section className="bo-card" aria-labelledby="orders-count">
        <div className="bo-tabs" role="group" aria-label="Estado del pedido">
          {orderInboxTabs.map((tab) => (
            <button
              key={tab || 'all'}
              type="button"
              aria-pressed={status === tab}
              onClick={() => update({ estado: tab })}
            >
              {tab ? statusLabel(orderStatusLabels, tab) : 'Todos'}
              {data && <small>{tab ? (counts[tab] ?? 0) : all}</small>}
            </button>
          ))}
        </div>
        <form className="bo-filters bo-filters-dates" onSubmit={submitSearch}>
          <label className="field">
            Buscar
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={() => search.trim() !== q && update({ q: search.trim() })}
              placeholder="Correo, nombre, DNI/RUC o ID del pedido"
              maxLength={120}
            />
          </label>
          <label className="field">
            Desde
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => update({ desde: event.target.value })}
            />
          </label>
          <label className="field">
            Hasta
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => update({ hasta: event.target.value })}
            />
          </label>
        </form>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : (
          data && (
            <>
              <p id="orders-count" className="catalog-count">
                {data.total} {data.total === 1 ? 'pedido' : 'pedidos'}
              </p>
              {data.items.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Pedido</th>
                        <th scope="col">Cliente</th>
                        <th scope="col">Entrega</th>
                        <th scope="col" className="num">
                          Total
                        </th>
                        <th scope="col">Estado</th>
                        <th scope="col">Pago</th>
                        <th scope="col">Comprobante</th>
                        <th scope="col">
                          <span className="visually-hidden">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((order) => (
                        <tr
                          key={order.id}
                          className={order.id === id ? 'bo-row-active' : undefined}
                        >
                          <td>
                            <strong>#{shortId(order.id)}</strong>
                            <small>{formatDateTime(order.createdAt)}</small>
                          </td>
                          <td>
                            <strong>{order.billing?.name ?? order.customer.name ?? '—'}</strong>
                            <small>
                              {order.billing
                                ? `${invoiceTypeLabel(order.billing.type)} · ${order.billing.documentNumber}`
                                : order.customer.email}
                            </small>
                          </td>
                          <td>
                            {order.deliveryMethod
                              ? deliveryMethodLabels[order.deliveryMethod]
                              : '—'}
                          </td>
                          <td className="num">{money(Number(order.total))}</td>
                          <td>
                            <StatusBadge status={order.status} labels={orderStatusLabels} />
                            {order.expiresAt && (
                              <small>Vence {formatDateTime(order.expiresAt)}</small>
                            )}
                          </td>
                          <td>
                            {order.payment ? (
                              <StatusBadge
                                status={order.payment.status}
                                labels={paymentStatusLabels}
                              />
                            ) : (
                              <span className="muted">Sin solicitar</span>
                            )}
                          </td>
                          <td>{order.invoice?.serialNumber ?? '—'}</td>
                          <td className="num">
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => {
                                update({ id: order.id, pagina: params.get('pagina') ?? '' });
                                window.scrollTo({ top: 0 });
                              }}
                            >
                              Ver
                              <span className="visually-hidden"> pedido {shortId(order.id)}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="Sin pedidos" text="No hay pedidos que coincidan con los filtros." />
              )}
              <Pagination
                page={data.page}
                pages={pages}
                onChange={(target) => update({ pagina: String(target) })}
              />
            </>
          )
        )}
      </section>
    </>
  );
}
