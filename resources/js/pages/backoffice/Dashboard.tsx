import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { PendingTask } from '../../components/backoffice/PendingTask';
import { can, permissions } from '../../lib/auth';
import { groupProducts } from '../../lib/catalog';
import { api } from '../../services/api';
import { useShop } from '../../state';
import { SalesOverview } from '../../components/backoffice/SalesOverview';
import { useData, ErrorBox, Loading } from '../../ui';

export function Dashboard() {
  const { user } = useShop();
  const { data, loading, error, reload } = useData(api.products);
  const outOfStock = data?.filter((product) => product.stock < 1) ?? [];
  const shortcuts = [
    can(user, permissions.salesCreate) && {
      to: '/admin/venta-directa',
      title: 'Venta directa',
      text: 'Registra una venta en mostrador, revisa el cobro y su comprobante.',
    },
    can(user, permissions.invoicesSubmit) && {
      to: '/admin/facturacion',
      title: 'Comprobantes',
      text: 'Selecciona un pedido o consulta su documento. Revisa el resultado de emisión antes de usarlo.',
    },
  ].filter((item): item is { to: string; title: string; text: string } => Boolean(item));

  return (
    <>
      <PageHeader
        title="Panel de trabajo"
        description="Elige una tarea para comenzar. Los accesos se muestran según los permisos de tu cuenta."
        actions={
          <Link className="button button-secondary" to="/admin/mi-acceso">
            Consultar mi acceso
          </Link>
        }
      />
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
                load={() => api.adminOrders({ status: 'PAID', page: 1 })}
              />
            )}
            {can(user, permissions.paymentsConfirm) && (
              <PendingTask
                title="Pagos pendientes"
                to="/admin/pagos?estado=PENDING"
                description="Consulta el estado de los pagos y verifica los abonos manuales."
                load={() => api.adminPayments({ status: 'PENDING', page: 1 })}
              />
            )}
            {shortcuts.map((item) => (
              <Link key={item.to} to={item.to} className="bo-shortcut">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {can(user, permissions.reportsView) && <SalesOverview />}
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
