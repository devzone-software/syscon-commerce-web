import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import { defaultPeriod, periodDays } from '../../lib/reports';
import { api } from '../../services/api';
import { money } from '../../state';
import type { SalesSummary } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const dayLabel = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Paid sales of the last seven days: headline figures and one bar per day. */
export function SalesOverview() {
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
          label="Pedidos con pago pendiente"
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
