import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { AdminOrderDetail } from '../../components/backoffice/AdminOrderDetail';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { invoiceTypeLabel } from '../../lib/billing';
import { deliveryMethodLabels } from '../../lib/delivery';
import {
  formatDateTime,
  orderInboxTabs,
  orderFilterLabels,
  orderLabelsForDelivery,
  paymentStatusLabels,
  shortId,
  statusLabel,
} from '../../lib/orders';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, Empty, ErrorBox, Loading } from '../../ui';

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
      {id && <AdminOrderDetail key={id} id={id} onChanged={reload} />}
      <section className="bo-card" aria-labelledby="orders-count">
        <div className="bo-tabs" role="group" aria-label="Estado del pedido">
          {orderInboxTabs.map((tab) => (
            <button
              key={tab || 'all'}
              type="button"
              aria-pressed={status === tab}
              onClick={() => update({ estado: tab })}
            >
              {tab ? statusLabel(orderFilterLabels, tab) : 'Todos'}
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
                <div className="table-wrap responsive-table">
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
                          <td data-label="Pedido">
                            <strong>#{shortId(order.id)}</strong>
                            <small>{formatDateTime(order.createdAt)}</small>
                          </td>
                          <td data-label="Cliente">
                            <strong>{order.billing?.name ?? order.customer.name ?? '—'}</strong>
                            <small>
                              {order.billing
                                ? `${invoiceTypeLabel(order.billing.type)} · ${order.billing.documentNumber}`
                                : order.customer.email}
                            </small>
                          </td>
                          <td data-label="Entrega">
                            {order.deliveryMethod
                              ? deliveryMethodLabels[order.deliveryMethod]
                              : '—'}
                          </td>
                          <td data-label="Total" className="num">
                            {money(Number(order.total))}
                          </td>
                          <td data-label="Estado">
                            <StatusBadge
                              status={order.status}
                              labels={orderLabelsForDelivery(order.deliveryMethod)}
                            />
                            {order.expiresAt && (
                              <small>Vence {formatDateTime(order.expiresAt)}</small>
                            )}
                          </td>
                          <td data-label="Pago">
                            {order.payment ? (
                              <StatusBadge
                                status={order.payment.status}
                                labels={paymentStatusLabels}
                              />
                            ) : (
                              <span className="muted">Sin solicitar</span>
                            )}
                          </td>
                          <td data-label="Comprobante">{order.invoice?.serialNumber ?? '—'}</td>
                          <td data-label="Acciones" className="num">
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
