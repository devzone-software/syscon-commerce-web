import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout';
import {
  ArrowRightIcon,
  BoxIcon,
  CartIcon,
  HeadsetIcon,
  ReceiptIcon,
  TagIcon,
  TruckIcon,
} from '../components/icons';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrdersTable } from '../components/orders/OrdersTable';
import { StatusBadge } from '../components/shared/StatusBadge';
import { displayName } from '../lib/auth';
import { accountSummary, orderLabelsForDelivery, shortId } from '../lib/orders';
import { deliveryMethodLabels } from '../lib/delivery';
import { paymentMethodLabel } from '../lib/sales';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Order } from '../types';
import { useData, ErrorBox, Loading, Empty } from '../ui';
import '../../css/account.css';

const units = (order: Order) => order.details.reduce((sum, line) => sum + line.quantity, 0);

export function Account() {
  const { user } = useShop();
  const orders = useData(api.orders);
  const summary = accountSummary(orders.data ?? []);
  const current = summary.current;
  const firstName = user?.firstName?.trim() || (user ? displayName(user) : '');

  return (
    <AccountLayout title="Resumen">
      <div className="customer-dashboard">
        <section className="portal-welcome" aria-labelledby="portal-welcome-title">
          <div>
            <h1 id="portal-welcome-title">Hola, {firstName}</h1>
            <p>Tus compras, entregas y comprobantes en un solo lugar.</p>
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
        </section>

        <nav className="customer-shortcuts" aria-label="Accesos de mi cuenta">
          <Link to="/cuenta/pedidos">
            <BoxIcon size={23} />
            <span>
              <strong>Mis pedidos</strong>
              <small>Seguimiento y comprobantes</small>
            </span>
            <ArrowRightIcon size={17} />
          </Link>
          <Link to="/cuenta/carrito">
            <CartIcon size={23} />
            <span>
              <strong>Mi carrito</strong>
              <small>Continúa tu compra</small>
            </span>
            <ArrowRightIcon size={17} />
          </Link>
          <Link to="/cuenta/soporte">
            <HeadsetIcon size={23} />
            <span>
              <strong>Ayuda</strong>
              <small>Consulta con SYSCON</small>
            </span>
            <ArrowRightIcon size={17} />
          </Link>
        </nav>
        {!orders.loading && !orders.error && summary.count > 0 && (
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
        )}

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
              <section
                className="portal-card portal-current"
                aria-labelledby="portal-current-title"
              >
                <div className="portal-card-head">
                  <div>
                    <h2 id="portal-current-title">Pedido en curso</h2>
                    <p>
                      Pedido #{shortId(current.id)} •{' '}
                      {current.delivery
                        ? deliveryMethodLabels[current.delivery.method]
                        : 'Entrega coordinada con un asesor SYSCON'}
                    </p>
                  </div>
                  <StatusBadge
                    status={current.status}
                    labels={orderLabelsForDelivery(current.delivery?.method)}
                  />
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
                    <dd>
                      {current.paymentMethods?.length
                        ? current.paymentMethods.map(paymentMethodLabel).join(', ')
                        : 'Por confirmar'}
                    </dd>
                  </div>
                  <div>
                    <dt>Unidades</dt>
                    <dd>{units(current)}</dd>
                  </div>
                </dl>
                <p className="portal-items-title">Productos ({current.details.length})</p>
                <ul className="portal-items">
                  {current.details.slice(0, 3).map((line) => (
                    <li key={line.productId}>
                      <strong>{line.name}</strong>
                      {line.quantity} {line.quantity === 1 ? 'unidad' : 'unidades'} ·{' '}
                      {money(Number(line.unitPrice) * line.quantity)}
                    </li>
                  ))}
                </ul>
                <OrderTimeline status={current.status} method={current.delivery?.method} />
                <div className="portal-actions">
                  <Link className="portal-btn is-soft" to="/cuenta/soporte">
                    <HeadsetIcon size={16} /> Consultar a soporte
                  </Link>
                  <Link className="portal-btn" to={`/pedido/${current.id}`}>
                    Ver detalle completo <ArrowRightIcon size={16} />
                  </Link>
                </div>
              </section>
            )}
            <section className="portal-card" aria-labelledby="portal-history-title">
              <div className="portal-card-head">
                <div>
                  <h2 id="portal-history-title">Compras recientes</h2>
                  <p>Revisa el estado y los detalles de tus pedidos</p>
                </div>
                <Link className="portal-link" to="/cuenta/pedidos">
                  Ver todos ({orders.data.length}) ›
                </Link>
              </div>
              <OrdersTable orders={orders.data.slice(0, 5)} />
            </section>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
