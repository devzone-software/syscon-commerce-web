import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout';
import {
  ArrowRightIcon,
  BoxIcon,
  BuildingIcon,
  CartIcon,
  ChatIcon,
  HeadsetIcon,
  PhoneIcon,
  ReceiptIcon,
  ShieldIcon,
  TagIcon,
  TruckIcon,
} from '../components/icons';
import { company } from '../components/layout/Header';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrdersTable } from '../components/orders/OrdersTable';
import { StatusBadge } from '../components/shared/StatusBadge';
import { displayName, roleLabel } from '../lib/auth';
import { accountSummary, orderProgress, orderStatusLabels, shortId } from '../lib/orders';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Order } from '../types';
import { useData, ErrorBox, Loading, Empty } from '../ui';

const units = (order: Order) => order.details.reduce((sum, line) => sum + line.quantity, 0);

export function Account() {
  const { user } = useShop();
  const orders = useData(api.orders);
  const summary = accountSummary(orders.data ?? []);
  const current = summary.current;
  const firstName = user?.firstName?.trim() || (user ? displayName(user) : '');

  return (
    <AccountLayout title="Dashboard">
      <section className="portal-welcome" aria-labelledby="portal-welcome-title">
        <div>
          <span className="portal-pill">
            <i aria-hidden="true" /> Cuenta {user?.roles.map(roleLabel).join(' / ') || 'cliente'} •
            ID: CUST-{user?.id.slice(0, 5).toUpperCase()}
          </span>
          <h1 id="portal-welcome-title">¡Hola de nuevo, {firstName}!</h1>
          <p>
            Gestiona tus pedidos activos, revisa tus compras y sigue el estado de cada entrega desde
            un solo lugar.
          </p>
          {summary.pendingPayment > 0 && (
            <p className="portal-callout">
              <ReceiptIcon size={18} />
              <span>
                Tienes <strong>{summary.pendingPayment}</strong>{' '}
                {summary.pendingPayment === 1 ? 'pedido' : 'pedidos'} con pago pendiente de
                confirmación.
              </span>
            </p>
          )}
        </div>
        {current && (
          <Link className="portal-last" to={`/pedido/${current.id}`}>
            <span className="portal-last-head">
              ÚLTIMO PEDIDO
              <StatusBadge status={current.status} labels={orderStatusLabels} />
            </span>
            <span className="portal-last-code">#{shortId(current.id)}</span>
            <span className="portal-progress" aria-hidden="true">
              <i style={{ width: `${Math.max(orderProgress(current.status), 6)}%` }} />
            </span>
            <span className="portal-last-link">
              Ver seguimiento <ArrowRightIcon size={14} />
            </span>
          </Link>
        )}
      </section>

      <ul className="portal-kpis">
        <li>
          <span>
            <span className="portal-kpi-label">Pedidos realizados</span>
            <strong>{summary.count}</strong>
            <small>Historial acumulado</small>
          </span>
          <i className="is-blue">
            <BoxIcon size={20} />
          </i>
        </li>
        <li>
          <span>
            <span className="portal-kpi-label">
              En proceso <em>ACTIVOS</em>
            </span>
            <strong className="is-teal">{summary.active}</strong>
            <small>Pedidos sin entregar</small>
          </span>
          <i className="is-sky">
            <TruckIcon size={20} />
          </i>
        </li>
        <li>
          <span>
            <span className="portal-kpi-label">Compras totales</span>
            <strong>{money(summary.spent)}</strong>
            <small>Pedidos con pago confirmado</small>
          </span>
          <i className="is-green">
            <ReceiptIcon size={20} />
          </i>
        </li>
        <li>
          <span>
            <span className="portal-kpi-label">Pagos pendientes</span>
            <strong>{summary.pendingPayment}</strong>
            <small>Esperando confirmación</small>
          </span>
          <i className="is-red">
            <TagIcon size={20} />
          </i>
        </li>
      </ul>

      {orders.loading ? (
        <Loading />
      ) : orders.error ? (
        <ErrorBox message={orders.error} retry={orders.reload} />
      ) : !orders.data?.length ? (
        <section className="portal-card">
          <Empty
            title="Aún no tienes pedidos"
            text="Cuando completes una compra aparecerá aquí."
            action={
              <Link className="button button-primary" to="/catalogo">
                Explorar productos
              </Link>
            }
          />
        </section>
      ) : (
        <>
          {current && (
            <section className="portal-card portal-current" aria-labelledby="portal-current-title">
              <div className="portal-card-head">
                <div>
                  <h2 id="portal-current-title">Tu pedido más reciente en curso</h2>
                  <p>Pedido #{shortId(current.id)} • Entrega coordinada con un asesor SYSCON</p>
                </div>
                <StatusBadge status={current.status} labels={orderStatusLabels} />
              </div>
              <dl className="portal-order-facts">
                <div>
                  <dt>Código de orden</dt>
                  <dd className="portal-code">#{shortId(current.id)}</dd>
                </div>
                <div>
                  <dt>Monto total</dt>
                  <dd className="is-money">{money(Number(current.total))}</dd>
                </div>
                <div>
                  <dt>Método de pago</dt>
                  <dd>Pago manual</dd>
                </div>
                <div>
                  <dt>Unidades</dt>
                  <dd>{units(current)}</dd>
                </div>
              </dl>
              <p className="portal-items-title">
                ÍTEMS INCLUIDOS ({current.details.length}{' '}
                {current.details.length === 1 ? 'ÍTEM' : 'ÍTEMS'}, {units(current)} UNIDADES)
              </p>
              <ul className="portal-items">
                {current.details.map((line) => (
                  <li key={line.productId}>
                    <strong>{line.name}</strong>
                    Cant: {line.quantity} • {money(Number(line.unitPrice) * line.quantity)} • SKU:{' '}
                    {line.sku}
                  </li>
                ))}
              </ul>
              <OrderTimeline status={current.status} />
              <div className="portal-actions">
                <Link className="portal-btn is-soft" to="/contacto">
                  <HeadsetIcon size={16} /> Consultar a soporte
                </Link>
                <Link className="portal-btn" to={`/pedido/${current.id}`}>
                  Ver detalle completo <ArrowRightIcon size={16} />
                </Link>
              </div>
            </section>
          )}
          <div className="portal-columns">
            <section className="portal-card" aria-labelledby="portal-history-title">
              <div className="portal-card-head">
                <div>
                  <h2 id="portal-history-title">Historial de pedidos recientes</h2>
                  <p>Consulta el estado de tus adquisiciones</p>
                </div>
                <Link className="portal-link" to="/cuenta/pedidos">
                  Ver todos ({orders.data.length}) ›
                </Link>
              </div>
              <OrdersTable orders={orders.data.slice(0, 5)} />
            </section>
            <aside className="portal-side">
              <section className="portal-card" aria-labelledby="portal-data-title">
                <h2 id="portal-data-title">
                  <BuildingIcon size={18} /> Datos de la cuenta
                </h2>
                <div className="portal-box">
                  <strong>{user && displayName(user)}</strong>
                  <span>{user?.email}</span>
                  <span>Cuenta: {user?.roles.map(roleLabel).join(', ') || 'Cliente'}</span>
                </div>
              </section>
              <section className="portal-card" aria-labelledby="portal-support-title">
                <h2 id="portal-support-title">
                  <ShieldIcon size={18} /> Soporte y Asistencia
                </h2>
                <Link className="portal-box is-link" to="/contacto">
                  <ChatIcon size={18} />
                  <span>
                    <strong>Contactar a soporte</strong>Para garantías o dudas técnicas
                  </span>
                </Link>
                <a className="portal-box is-link" href={company.phoneHref}>
                  <PhoneIcon size={18} />
                  <span>
                    <strong>Central telefónica</strong>
                    {company.phone}
                  </span>
                </a>
              </section>
            </aside>
          </div>
        </>
      )}

      <section className="portal-card" aria-labelledby="portal-ops-title">
        <p id="portal-ops-title" className="portal-ops-title">
          OPERACIONES DIRECTAS B2B
        </p>
        <ul className="portal-ops">
          <li>
            <Link to="/ofertas">
              <i className="is-navy">
                <TagIcon size={18} />
              </i>
              <span>
                <strong>Catálogo de ofertas</strong>Precios más bajos con stock
              </span>
            </Link>
          </li>
          <li>
            <Link to="/catalogo">
              <i className="is-teal">
                <CartIcon size={18} />
              </i>
              <span>
                <strong>Comprar de nuevo</strong>Explora todo el catálogo
              </span>
            </Link>
          </li>
          <li>
            <Link to="/cuenta/pedidos">
              <i className="is-light">
                <BoxIcon size={18} />
              </i>
              <span>
                <strong>Mis pedidos</strong>Estado y pagos de tus compras
              </span>
            </Link>
          </li>
          <li>
            <Link to="/contacto">
              <i className="is-dark">
                <ShieldIcon size={18} />
              </i>
              <span>
                <strong>Garantías y Devoluciones</strong>Atención con un asesor
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </AccountLayout>
  );
}
