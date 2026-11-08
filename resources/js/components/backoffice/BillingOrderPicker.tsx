import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from '../shared/Pagination';
import { StatusBadge } from '../shared/StatusBadge';
import { BILLABLE } from '../orders/OrderDocuments';
import { formatDateTime, orderStatusLabels, shortId } from '../../lib/orders';
import { invoiceStatusLabels } from '../../lib/billing';
import { api } from '../../services/api';
import { money } from '../../state';
import { Empty, ErrorBox, Loading, useData } from '../../ui';

/** Uses the existing order inbox; choosing an order does not issue a document. */
export function BillingOrderPicker() {
  const [status, setStatus] = useState('PAID');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, refreshing, error, reload } = useData(
    () => api.adminOrders({ status, q: query, page }),
    [status, query, page],
    { keepPreviousData: true },
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setQuery(search.trim());
    setPage(1);
  };
  return (
    <section className="bo-card" aria-labelledby="billing-orders-title" aria-busy={refreshing}>
      <h2 id="billing-orders-title">Elige el pedido</h2>
      <p className="muted">
        Busca al cliente y revisa su compra. Seleccionar un pedido no emite ningún documento.
      </p>
      <form className="bo-filters" onSubmit={submit}>
        <label className="field">
          Cliente, documento o pedido
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, correo, documento o número de pedido"
            maxLength={120}
          />
        </label>
        <label className="field">
          Estado del pedido
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {BILLABLE.map((value) => (
              <option key={value} value={value}>
                {orderStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-secondary" type="submit">
          Buscar
        </button>
      </form>
      <p className="billing-update" role="status">
        {refreshing
          ? 'Actualizando pedidos…'
          : data
            ? `${data.total} pedidos encontrados`
            : 'Consultando pedidos…'}
      </p>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        data && (
          <>
            {data.items.length ? (
              <ul className="billing-order-list">
                {data.items.map((order) => (
                  <li key={order.id}>
                    <div>
                      <strong>Pedido #{shortId(order.id)}</strong>
                      <span>
                        {order.billing?.name || order.customer.name || order.customer.email}
                      </span>
                      {order.billing && <small>Documento: {order.billing.documentNumber}</small>}
                      <small>{formatDateTime(order.createdAt)}</small>
                    </div>
                    <div>
                      <strong>{money(Number(order.total))}</strong>
                      <StatusBadge status={order.status} labels={orderStatusLabels} />
                      {order.invoice ? (
                        <>
                          <span>{order.invoice.serialNumber}</span>
                          <StatusBadge status={order.invoice.status} labels={invoiceStatusLabels} />
                        </>
                      ) : (
                        <span>Sin comprobante registrado</span>
                      )}
                    </div>
                    <div className="billing-order-actions">
                      <Link
                        className="button button-primary"
                        to={
                          order.invoice
                            ? `/admin/facturacion?id=${order.invoice.id}`
                            : `/admin/facturacion?pedido=${order.id}`
                        }
                      >
                        {order.invoice ? 'Ver comprobante' : 'Revisar y preparar'}
                        <span className="visually-hidden"> del pedido {shortId(order.id)}</span>
                      </Link>
                      <Link className="link-button" to={`/admin/pedidos?id=${order.id}`}>
                        Ver pedido<span className="visually-hidden"> {shortId(order.id)}</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                title="Sin pedidos para esta búsqueda"
                text="Prueba otro cliente o estado. Aquí se muestran pedidos pagados, en preparación, enviados o entregados."
              />
            )}
            <Pagination
              page={data.page}
              pages={Math.max(1, Math.ceil(data.total / data.perPage))}
              onChange={setPage}
            />
          </>
        )
      )}
    </section>
  );
}
