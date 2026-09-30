import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { can, permissions } from '../../lib/auth';
import { groupProducts } from '../../lib/catalog';
import { api } from '../../services/api';
import { useShop } from '../../state';
import { useData, ErrorBox, Loading } from '../../ui';

export function Dashboard() {
  const { user } = useShop();
  const { data, loading, error, reload } = useData(api.products);
  const outOfStock = data?.filter((product) => product.stock < 1) ?? [];
  const shortcuts = [
    can(user, permissions.catalogWrite) && {
      to: '/admin/productos?nuevo=1',
      title: 'Registrar producto',
      text: 'Crea o actualiza un producto del catálogo por SKU.',
    },
    can(user, permissions.ordersManage) && {
      to: '/admin/pedidos',
      title: 'Gestionar un pedido',
      text: 'Consulta un pedido por su ID y avanza su estado.',
    },
    can(user, permissions.paymentsConfirm) && {
      to: '/admin/pagos',
      title: 'Confirmar un pago manual',
      text: 'Verifica una solicitud de pago y registra su referencia.',
    },
  ].filter((item): item is { to: string; title: string; text: string } => Boolean(item));

  return (
    <>
      <PageHeader
        title="Panel"
        description="Resumen calculado con el catálogo publicado actualmente."
      />
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
      {shortcuts.length > 0 && (
        <section aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title" className="bo-section-title">
            Accesos rápidos
          </h2>
          <div className="bo-shortcuts">
            {shortcuts.map((item) => (
              <Link key={item.to} to={item.to} className="bo-shortcut">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
