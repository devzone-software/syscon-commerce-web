import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { Pagination } from '../../components/shared/Pagination';
import { invoiceStatusLabels, invoiceTypeLabel } from '../../lib/billing';
import { formatDateTime, orderStatusLabels, shortId, statusLabel } from '../../lib/orders';
import { defaultPeriod, issueLabels, periodError } from '../../lib/reports';
import { paymentMethodLabel } from '../../lib/sales';
import { api } from '../../services/api';
import { money } from '../../state';
import type { SalesSummary } from '../../types';
import { useData, Empty, ErrorBox, Loading } from '../../ui';

const PER_PAGE = 20;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Summary({ data }: { data: SalesSummary }) {
  const max = Math.max(...data.sales.byDay.map((day) => Number(day.total)), 0);
  const r = data.reconciliation;
  return (
    <>
      <div className="bo-stats">
        <StatCard
          label="Ventas"
          value={money(Number(data.sales.total))}
          hint={`${plural(data.sales.orders, 'pedido pagado', 'pedidos pagados')} · ticket ${money(Number(data.sales.averageTicket))}`}
        />
        <StatCard
          label="Op. gravada / IGV"
          value={money(Number(data.sales.taxableAmount))}
          hint={`IGV ${money(Number(data.sales.taxAmount))} · envíos ${money(Number(data.sales.deliveryTotal))}`}
        />
        <StatCard
          label="Pagos pendientes (ahora)"
          value={money(Number(data.pendingPayments.total))}
          hint={`${plural(data.pendingPayments.orders, 'pedido', 'pedidos')} · ${data.pendingPayments.expiringIn24h} vencen en 24 h`}
        />
        <StatCard
          label="Stock reservado (ahora)"
          value={`${data.reservations.units} u.`}
          hint={`${data.reservations.products} productos · ${money(Number(data.reservations.value))}`}
        />
      </div>

      <section className="bo-card" aria-labelledby="reconciliation-title">
        <h2 id="reconciliation-title">Conciliación del período</h2>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr>
                <th scope="row">Pedidos pagados</th>
                <td className="num">{money(Number(r.paidOrdersTotal))}</td>
              </tr>
              <tr>
                <th scope="row">Pagos aprobados de esos pedidos</th>
                <td className="num">{money(Number(r.approvedPaymentsTotal))}</td>
              </tr>
              <tr>
                <th scope="row">Facturado neto (comprobantes aceptados ± notas)</th>
                <td className="num">{money(Number(r.netInvoicedTotal))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={r.mismatchedOrders ? 'notice error' : 'notice success'} role="status">
          {r.mismatchedOrders
            ? `${plural(r.mismatchedOrders, 'pedido no concilia', 'pedidos no concilian')} (${r.ordersWithoutInvoice} sin comprobante aceptado). Revisa el detalle filtrando “Solo con diferencias”.`
            : 'Todos los pedidos pagados del período concilian con su pago y su comprobante.'}
        </p>
        <p className="muted">
          Reglas: días de Lima; una venta es un pedido cuyo pago se confirmó en el período, por su
          total con IGV y envío. Los pedidos cancelados o vencidos nunca se pagaron y se informan
          aparte: {data.releasedOrders.CANCELLED.orders} cancelados (
          {money(Number(data.releasedOrders.CANCELLED.total))}) y{' '}
          {data.releasedOrders.EXPIRED.orders} vencidos (
          {money(Number(data.releasedOrders.EXPIRED.total))}).
        </p>
      </section>

      <div className="bo-detail-grid">
        <section className="bo-card" aria-labelledby="by-day-title">
          <h2 id="by-day-title">Ventas por día</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col" className="num">
                    Pedidos
                  </th>
                  <th scope="col" className="num">
                    Total
                  </th>
                  <th scope="col">
                    <span className="visually-hidden">Proporción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.sales.byDay
                  .filter((day) => day.orders > 0)
                  .map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td className="num">{day.orders}</td>
                      <td className="num">{money(Number(day.total))}</td>
                      <td className="bo-bar-cell" aria-hidden="true">
                        <span
                          className="bo-bar"
                          style={{ width: `${max ? (Number(day.total) / max) * 100 : 0}%` }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data.sales.orders === 0 && <p className="muted">Sin ventas en el período.</p>}
          <h3 className="flow-subtitle">Por canal y medio de pago</h3>
          <div className="table-wrap">
            <table className="data-table">
              <tbody>
                <tr>
                  <th scope="row">Web</th>
                  <td className="num">{data.sales.byChannel.WEB.orders}</td>
                  <td className="num">{money(Number(data.sales.byChannel.WEB.total))}</td>
                </tr>
                <tr>
                  <th scope="row">Venta directa (tienda)</th>
                  <td className="num">{data.sales.byChannel.STORE.orders}</td>
                  <td className="num">{money(Number(data.sales.byChannel.STORE.total))}</td>
                </tr>
                {data.sales.byPaymentMethod.map((row) => (
                  <tr key={row.method}>
                    <th scope="row">Cobrado con {paymentMethodLabel(row.method)}</th>
                    <td className="num">{row.payments}</td>
                    <td className="num">{money(Number(row.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="bo-card" aria-labelledby="documents-title">
          <h2 id="documents-title">Comprobantes generados</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  {Object.keys(invoiceStatusLabels).map((status) => (
                    <th key={status} scope="col" className="num">
                      {invoiceStatusLabels[status]}
                    </th>
                  ))}
                  <th scope="col" className="num">
                    Total aceptado
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((row) => (
                  <tr key={row.type}>
                    <td>{invoiceTypeLabel(row.type)}</td>
                    {Object.keys(invoiceStatusLabels).map((status) => (
                      <td key={status} className="num">
                        {row.byStatus[status] ?? 0}
                      </td>
                    ))}
                    <td className="num">{money(Number(row.acceptedTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function SalesTable({
  period,
  mismatched,
}: {
  period: { from: string; to: string };
  mismatched: boolean;
}) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useData(
    () => api.sales({ ...period, page, mismatched: mismatched ? '1' : undefined }),
    [period.from, period.to, mismatched, page],
  );
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data?.items.length)
    return (
      <Empty
        title={mismatched ? 'Sin diferencias' : 'Sin ventas'}
        text={
          mismatched
            ? 'Todos los pedidos del período concilian.'
            : 'No hay pedidos pagados en el período.'
        }
      />
    );
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Ventas del período</caption>
          <thead>
            <tr>
              <th scope="col">Pago confirmado</th>
              <th scope="col">Pedido</th>
              <th scope="col">Cliente</th>
              <th scope="col" className="num">
                Total
              </th>
              <th scope="col" className="num">
                Pago aprobado
              </th>
              <th scope="col">Comprobantes</th>
              <th scope="col" className="num">
                Facturado neto
              </th>
              <th scope="col">Conciliación</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.orderId}>
                <td>{formatDateTime(row.paidAt)}</td>
                <td>
                  <Link className="link-button" to={`/admin/pedidos?id=${row.orderId}`}>
                    {shortId(row.orderId)}
                  </Link>
                  <small>{statusLabel(orderStatusLabels, row.status)}</small>
                </td>
                <td>
                  {row.billingName ?? row.customerEmail}
                  {row.billingDocument && <small>{row.billingDocument}</small>}
                </td>
                <td className="num">{money(Number(row.total))}</td>
                <td className="num">{money(Number(row.paidAmount))}</td>
                <td>
                  {row.invoices.length
                    ? row.invoices.map((invoice) => (
                        <small key={invoice.id}>
                          {invoice.serialNumber} ·{' '}
                          {statusLabel(invoiceStatusLabels, invoice.status)}
                        </small>
                      ))
                    : '—'}
                </td>
                <td className="num">{money(Number(row.netInvoiced))}</td>
                <td>
                  {row.reconciled ? (
                    <span className="muted">Concilia</span>
                  ) : (
                    row.issues.map((issue) => (
                      <small key={issue} className="field-error">
                        {issueLabels[issue] ?? issue}
                      </small>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(data.total / PER_PAGE)} onChange={setPage} />
    </>
  );
}

export function SalesReport() {
  const [draft, setDraft] = useState(defaultPeriod);
  const [period, setPeriod] = useState(defaultPeriod);
  const [mismatched, setMismatched] = useState(false);
  const [formError, setFormError] = useState('');
  const summary = useData(() => api.salesSummary(period), [period.from, period.to]);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    const error = periodError(draft.from, draft.to);
    setFormError(error ?? '');
    if (!error) setPeriod({ ...draft });
  };

  return (
    <>
      <PageHeader
        title="Ventas y conciliación"
        description="Ventas por fecha de pago confirmado, pagos pendientes, comprobantes y reservas, con la conciliación entre pedido, pago y comprobante."
        actions={
          <a
            className="button button-secondary"
            href={api.salesCsvUrl({ ...period, mismatched: mismatched ? '1' : undefined })}
            download
          >
            Exportar CSV
          </a>
        }
      />
      <form
        className="bo-card bo-lookup"
        onSubmit={apply}
        noValidate
        aria-label="Período del reporte"
      >
        <label className="field">
          Desde
          <input
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </label>
        <label className="field">
          Hasta
          <input
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </label>
        <button type="submit" className="button button-primary">
          Aplicar
        </button>
        {formError && <small className="field-error">{formError}</small>}
      </form>
      {summary.loading && !summary.data ? (
        <Loading />
      ) : summary.error ? (
        <ErrorBox message={summary.error} retry={summary.reload} />
      ) : (
        summary.data && <Summary data={summary.data} />
      )}
      <section className="bo-card" aria-labelledby="sales-title">
        <div className="checkout-card-head">
          <h2 id="sales-title">Pedidos vendidos</h2>
          <label className="catalog-sort">
            <input
              type="checkbox"
              checked={mismatched}
              onChange={(e) => setMismatched(e.target.checked)}
            />
            <span>Solo con diferencias</span>
          </label>
        </div>
        <SalesTable
          key={`${period.from}${period.to}${mismatched}`}
          period={period}
          mismatched={mismatched}
        />
      </section>
    </>
  );
}
