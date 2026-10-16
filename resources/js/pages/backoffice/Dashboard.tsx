import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { can, permissions } from '../../lib/auth';
import { groupProducts } from '../../lib/catalog';
import { defaultPeriod, periodDays } from '../../lib/reports';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import type { SalesSummary } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const dayLabel = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Paid sales of the last seven days: headline figures and one bar per day. */
function WeekSales() {
  const [period] = useState(() => defaultPeriod(new Date(), 7));
  const { data, loading, error, reload } = useData(() => api.salesSummary(period));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data) return null;
  return <WeekSalesView data={data} days={periodDays(period)} />;
}

function WeekSalesView({ data, days }: { data: SalesSummary; days: string[] }) {
  const byDay = new Map(data.sales.byDay.map((day) => [day.date, day]));
  const bars = days.map((date) => ({
    date,
    label: dayLabel.format(new Date(`${date}T12:00:00Z`)),
    orders: byDay.get(date)?.orders ?? 0,
    total: Number(byDay.get(date)?.total ?? 0),
  }));
  const max = Math.max(...bars.map((bar) => bar.total), 0);
  const pending = data.pendingPayments;
  return (
    <>
      <div className="bo-stats">
        <StatCard
          label="Ventas · 7 días"
          value={money(Number(data.sales.total))}
          hint={plural(data.sales.orders, 'pedido pagado', 'pedidos pagados')}
        />
        <StatCard label="Ticket promedio" value={money(Number(data.sales.averageTicket))} />
        <StatCard
          label="Pagos por confirmar"
          value={pending.orders}
          hint={pending.orders ? money(Number(pending.total)) : 'Nada pendiente'}
        />
        <StatCard
          label="Reservas que vencen en 24 h"
          value={pending.expiringIn24h}
          hint={`${data.reservations.units} u. reservadas ahora`}
        />
      </div>
      <section className="bo-card" aria-labelledby="week-sales-title">
        <div className="checkout-card-head">
          <h2 id="week-sales-title">Ventas por día</h2>
          <Link className="link-button" to="/admin/reportes/ventas">
            Ver reporte
          </Link>
        </div>
        {max === 0 ? (
          <p className="muted">Sin ventas pagadas en los últimos 7 días.</p>
        ) : (
          <ol className="bo-week-chart" aria-label="Ventas pagadas por día">
            {bars.map((bar) => (
              <li
                key={bar.date}
                tabIndex={0}
                aria-label={`${bar.label}: ${money(bar.total)}, ${plural(bar.orders, 'pedido', 'pedidos')}`}
              >
                <span className="bo-week-tip" aria-hidden="true">
                  <strong>{money(bar.total)}</strong>
                  {plural(bar.orders, 'pedido', 'pedidos')}
                </span>
                <span className="bo-week-track" aria-hidden="true">
                  {bar.total === max && <span className="bo-week-value">{money(bar.total)}</span>}
                  {bar.total > 0 && (
                    <span
                      className="bo-week-bar"
                      style={{ height: `max(2px, ${(bar.total / max) * 100}%)` }}
                    />
                  )}
                </span>
                <span className="bo-week-day" aria-hidden="true">
                  {bar.label}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

export function Dashboard() {
  const { user } = useShop();
  const { data, loading, error, reload } = useData(api.products);
  const outOfStock = data?.filter((product) => product.stock < 1) ?? [];
  const shortcuts = [
    can(user, permissions.salesCreate) && {
      to: '/admin/venta-directa',
      title: 'Venta directa',
      text: 'Cobra en tienda y emite la boleta o factura al momento.',
    },
    can(user, permissions.ordersManage) && {
      to: '/admin/pedidos',
      title: 'Bandeja de pedidos',
      text: 'Filtra pedidos por estado o cliente y avanza su preparación.',
    },
    can(user, permissions.paymentsConfirm) && {
      to: '/admin/pagos',
      title: 'Pagos por verificar',
      text: 'Revisa los pagos manuales pendientes y registra su referencia.',
    },
    can(user, permissions.catalogWrite) && {
      to: '/admin/productos?nuevo=1',
      title: 'Registrar producto',
      text: 'Crea o actualiza un producto del catálogo por SKU.',
    },
  ].filter((item): item is { to: string; title: string; text: string } => Boolean(item));

  return (
    <>
      <PageHeader title="Panel" description="Ventas recientes, pendientes y estado del catálogo." />
      {shortcuts.length > 0 && (
        <div className="bo-shortcuts">
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="bo-shortcut">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </Link>
          ))}
        </div>
      )}
      {can(user, permissions.reportsView) && <WeekSales />}
      <h2 className="bo-section-title">Catálogo</h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        data && (
          <>
            <div className="bo-stats">
              <StatCard label="Productos publicados" value={data.length} />
              <StatCard
                label="Sin stock"
                value={outOfStock.length}
                hint={
                  data.length
                    ? `${Math.round((outOfStock.length / data.length) * 100)}% del catálogo`
                    : undefined
                }
              />
              <StatCard label="Categorías" value={groupProducts(data, 'category').length} />
              <StatCard label="Marcas" value={groupProducts(data, 'brand').length} />
            </div>
            {outOfStock.length > 0 && can(user, permissions.catalogWrite) && (
              <section className="bo-card" aria-labelledby="out-of-stock-title">
                <div className="checkout-card-head">
                  <h2 id="out-of-stock-title">Productos sin stock</h2>
                  <Link className="link-button" to="/admin/productos?stock=sin-stock">
                    Ver todos
                  </Link>
                </div>
                <ul className="bo-simple-list">
                  {outOfStock.slice(0, 5).map((product) => (
                    <li key={product.id}>
                      <span>
                        <strong>{product.name}</strong>
                        <small>SKU {product.sku}</small>
                      </span>
                      <Link
                        className="link-button"
                        to={`/admin/productos?editar=${encodeURIComponent(product.sku)}`}
                      >
                        Editar
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
