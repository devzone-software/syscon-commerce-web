import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { PaymentDetails } from '../../components/orders/PaymentDetails';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { can, permissions } from '../../lib/auth';
import {
  formatDateTime,
  orderStatusLabels,
  paymentStatusLabels,
  shortId,
  statusLabel,
} from '../../lib/orders';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import type { Payment } from '../../types';
import { useData, Empty, ErrorBox, Loading } from '../../ui';

const paymentTabs = ['PENDING', 'APPROVED', 'CANCELLED'];

function PaymentDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { user } = useShop();
  const { data, loading, error, reload } = useData<Payment>(() => api.payment(id), [id]);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!reference.trim()) {
      setActionError('Ingresa la referencia verificada del pago.');
      return;
    }
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      await api.confirmPayment(id, reference.trim());
      setMessage('Pago confirmado. El pedido quedó como pagado.');
      reload();
      onChanged();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error || 'Pago no encontrado.'} retry={reload} />;
  const confirmable =
    data.status === 'PENDING' &&
    data.provider === 'MANUAL' &&
    can(user, permissions.paymentsConfirm);

  return (
    <div className="bo-detail-grid">
      <section className="bo-card" aria-labelledby="payment-title">
        <h2 id="payment-title">Solicitud de pago</h2>
        <PaymentDetails payment={{ ...data, instructions: null }} />
        {can(user, permissions.ordersManage) && (
          <Link className="link-button" to={`/admin/pedidos?id=${data.orderId}`}>
            Ver pedido {shortId(data.orderId)}
          </Link>
        )}
      </section>
      <aside className="bo-card" aria-labelledby="payment-confirm-title">
        <h2 id="payment-confirm-title">Confirmación</h2>
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {confirmable ? (
          <form className="form-stack" onSubmit={confirm} noValidate>
            <p className="muted">
              Confirma solo después de verificar el pago fuera de este sistema (por ejemplo, en el
              estado de cuenta bancario).
            </p>
            <label className="field">
              Referencia verificada
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={255}
                required
              />
            </label>
            {actionError && <ErrorBox message={actionError} />}
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? 'Confirmando…' : 'Confirmar pago'}
            </button>
          </form>
        ) : (
          <p className="muted">
            {data.status === 'APPROVED'
              ? 'Este pago ya fue confirmado.'
              : data.status === 'CANCELLED'
                ? 'Este pago se anuló porque su pedido fue cancelado o venció.'
                : 'Este pago no admite confirmación manual.'}
          </p>
        )}
      </aside>
    </div>
  );
}

export function PaymentsAdmin() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const status = params.get('estado') || 'PENDING';
  const q = params.get('q') ?? '';
  const page = Number(params.get('pagina') || 1);
  const [search, setSearch] = useState(q);
  const { data, loading, error, reload } = useData(
    () => api.adminPayments({ status, q, page }),
    [status, q, page],
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
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;

  return (
    <>
      <PageHeader
        title="Pagos"
        description="Solicitudes de pago manual por verificar, las más antiguas primero. Confirma solo después de comprobar el abono en el banco."
      />
      {id && <PaymentDetail key={id} id={id} onChanged={reload} />}
      <section className="bo-card" aria-labelledby="payments-count">
        <div className="bo-tabs" role="group" aria-label="Estado del pago">
          {paymentTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={status === tab}
              onClick={() => update({ estado: tab === 'PENDING' ? '' : tab })}
            >
              {statusLabel(paymentStatusLabels, tab)}
            </button>
          ))}
        </div>
        <form className="bo-filters bo-filters-compact" onSubmit={submitSearch}>
          <label className="field">
            Buscar
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={() => search.trim() !== q && update({ q: search.trim() })}
              placeholder="Correo, referencia o ID del pago o pedido"
              maxLength={120}
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
              <p id="payments-count" className="catalog-count">
                {data.total} {data.total === 1 ? 'pago' : 'pagos'}
              </p>
              {data.items.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Solicitud</th>
                        <th scope="col">Cliente</th>
                        <th scope="col" className="num">
                          Monto
                        </th>
                        <th scope="col">Pedido</th>
                        <th scope="col">{status === 'APPROVED' ? 'Referencia' : 'Estado'}</th>
                        <th scope="col">
                          <span className="visually-hidden">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((payment) => (
                        <tr
                          key={payment.id}
                          className={payment.id === id ? 'bo-row-active' : undefined}
                        >
                          <td>
                            <strong>#{shortId(payment.id)}</strong>
                            <small>{formatDateTime(payment.createdAt ?? null)}</small>
                          </td>
                          <td>{payment.customerEmail}</td>
                          <td className="num">{money(Number(payment.amount))}</td>
                          <td>
                            <strong>#{shortId(payment.orderId)}</strong>
                            <small>
                              {statusLabel(orderStatusLabels, payment.orderStatus)}
                              {payment.orderExpiresAt &&
                                ` · vence ${formatDateTime(payment.orderExpiresAt)}`}
                            </small>
                          </td>
                          <td>
                            {status === 'APPROVED' ? (
                              <>
                                {payment.externalReference}
                                <small>{formatDateTime(payment.confirmedAt ?? null)}</small>
                              </>
                            ) : (
                              <StatusBadge status={payment.status} labels={paymentStatusLabels} />
                            )}
                          </td>
                          <td className="num">
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => {
                                update({ id: payment.id, pagina: params.get('pagina') ?? '' });
                                window.scrollTo({ top: 0 });
                              }}
                            >
                              {payment.status === 'PENDING' ? 'Verificar' : 'Ver'}
                              <span className="visually-hidden"> pago {shortId(payment.id)}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Sin pagos"
                  text={
                    status === 'PENDING'
                      ? 'No hay pagos pendientes de verificar.'
                      : 'No hay pagos que coincidan con los filtros.'
                  }
                />
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
