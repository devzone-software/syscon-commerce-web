import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/backoffice/StatCard';
import { PendingTask } from '../../components/backoffice/PendingTask';
import {
  AlertIcon,
  ArrowRightIcon,
  BoltIcon,
  BoxIcon,
  BuildingIcon,
  CardIcon,
  CartIcon,
  ChartIcon,
  ReceiptIcon,
  TagIcon,
} from '../../components/icons';
import { can, displayName, permissions, roleLabel } from '../../lib/auth';
import { groupProducts } from '../../lib/catalog';
import { api } from '../../services/api';
import { useShop } from '../../state';
import { SalesOverview } from '../../components/backoffice/SalesOverview';
import { useData, ErrorBox, Loading } from '../../ui';

const today = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Greeting by the hour of the day in the browser's time zone. */
const greeting = (hour: number) =>
  hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

type Shortcut = { to: string; title: string; text: string; icon: ReactElement };

export function Dashboard() {
  const { user } = useShop();
  const { data, loading, error, reload } = useData(api.products);
  const outOfStock = data?.filter((product) => product.stock < 1) ?? [];
  const now = new Date();
  const date = today.format(now);

  const shortcuts = [
    can(user, permissions.salesCreate) && {
      to: '/admin/venta-directa',
      title: 'Venta directa',
      text: 'Registra una venta en mostrador, revisa el cobro y su comprobante.',
      icon: <BoltIcon />,
    },
    can(user, permissions.invoicesSubmit) && {
      to: '/admin/facturacion',
      title: 'Comprobantes',
      text: 'Selecciona un pedido o consulta su documento. Revisa el resultado de emisión.',
      icon: <ReceiptIcon />,
    },
  ].filter((item): item is Shortcut => Boolean(item));

  // Quick actions in the welcome banner, limited to what this account may do.
  const quick = [
    can(user, permissions.salesCreate) && { to: '/admin/venta-directa', label: 'Nueva venta' },
    can(user, permissions.catalogWrite) && {
      to: '/admin/productos?nuevo=1',
      label: 'Registrar producto',
    },
    can(user, permissions.reportsView) && { to: '/admin/reportes/ventas', label: 'Ver reportes' },
  ].filter((item): item is { to: string; label: string } => Boolean(item));

  return (
    <>
      <section className="bo-welcome" aria-labelledby="bo-welcome-title">
        <div>
          <p className="bo-welcome-date">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
          <h1 id="bo-welcome-title">
            {greeting(now.getHours())}, {user ? displayName(user) : 'equipo'}
          </h1>
          <p>
            Este es el resumen de tu negocio hoy.
            {user?.roles[0] && <> Ingresaste como {roleLabel(user.roles[0]).toLowerCase()}.</>}
          </p>
        </div>
        <div className="bo-welcome-actions">
          {quick.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className={index === 0 ? 'bo-welcome-primary' : 'bo-welcome-secondary'}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/admin/mi-acceso" className="bo-welcome-secondary">
            Mi acceso
          </Link>
        </div>
      </section>

      {(shortcuts.length > 0 ||
        can(user, permissions.ordersManage) ||
        can(user, permissions.paymentsConfirm)) && (
        <section className="bo-daily-tasks" aria-labelledby="daily-tasks-title">
          <h2 className="bo-section-title" id="daily-tasks-title">
            Atención diaria
          </h2>
          <div className="bo-shortcuts">
            {can(user, permissions.ordersManage) && (
              <PendingTask
                title="Pedidos por preparar"
                to="/admin/pedidos?estado=PAID"
                description="Pedidos pagados que esperan pasar a preparación."
                icon={<CartIcon />}
                tone="blue"
                load={() => api.adminOrders({ status: 'PAID', page: 1 })}
              />
            )}
            {can(user, permissions.paymentsConfirm) && (
              <PendingTask
                title="Pagos pendientes"
                to="/admin/pagos?estado=PENDING"
                description="Consulta el estado de los pagos y verifica los abonos manuales."
                icon={<CardIcon />}
                tone="amber"
                load={() => api.adminPayments({ status: 'PENDING', page: 1 })}
              />
            )}
            {shortcuts.map((item) => (
              <Link key={item.to} to={item.to} className="bo-shortcut tone-violet">
                <span className="bo-shortcut-head">
                  <span className="bo-stat-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <strong>{item.title}</strong>
                </span>
                <span>{item.text}</span>
                <span className="bo-shortcut-go" aria-hidden="true">
                  Abrir <ArrowRightIcon size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {can(user, permissions.reportsView) && (
        <>
          <h2 className="bo-section-title">Rendimiento de ventas</h2>
          <SalesOverview />
        </>
      )}

      <div className="bo-catalog-heading">
        <h2 className="bo-section-title">Catálogo</h2>
        {can(user, permissions.catalogWrite) && (
          <Link className="button button-secondary" to="/admin/productos?nuevo=1">
            Registrar producto
          </Link>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        data && (
          <>
            <div className="bo-stats">
              <StatCard
                label="Productos publicados"
                icon={<BoxIcon />}
                tone="blue"
                value={data.length}
              />
              <StatCard
                label="Sin stock"
                icon={<AlertIcon />}
                tone={outOfStock.length ? 'red' : 'green'}
                value={outOfStock.length}
                hint={
                  data.length
                    ? `${Math.round((outOfStock.length / data.length) * 100)}% del catálogo`
                    : undefined
                }
              />
              <StatCard
                label="Categorías"
                icon={<TagIcon />}
                tone="violet"
                value={groupProducts(data, 'category').length}
              />
              <StatCard
                label="Marcas"
                icon={<BuildingIcon />}
                tone="cyan"
                value={groupProducts(data, 'brand').length}
              />
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
            {can(user, permissions.reportsView) && (
              <Link to="/admin/reportes" className="bo-report-link">
                <ChartIcon size={18} /> Ver el resumen completo del catálogo
                <ArrowRightIcon size={16} />
              </Link>
            )}
          </>
        )
      )}
    </>
  );
}
