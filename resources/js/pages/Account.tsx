import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout';
import { OrderList } from '../components/orders/OrderList';
import { roleLabel } from '../lib/auth';
import { api } from '../services/api';
import { useShop } from '../state';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Account() {
  const { user } = useShop();
  const orders = useData(api.orders);
  const pending = orders.data?.filter((order) => order.status === 'PAYMENT_PENDING') ?? [];
  return (
    <AccountLayout title="Resumen de tu cuenta">
      <section className="white-card" aria-labelledby="profile-title">
        <h2 id="profile-title">Perfil</h2>
        <dl className="detail-list">
          <div>
            <dt>Correo</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Tipo de cuenta</dt>
            <dd>{user?.roles.map(roleLabel).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>ID de cuenta</dt>
            <dd>
              <code>{user?.id}</code>
            </dd>
          </div>
        </dl>
      </section>
      <section className="white-card" aria-labelledby="recent-title">
        <div className="checkout-card-head">
          <h2 id="recent-title">Pedidos recientes</h2>
          <Link className="link-button" to="/cuenta/pedidos">
            Ver todos
          </Link>
        </div>
        {orders.loading ? (
          <Loading />
        ) : orders.error ? (
          <ErrorBox message={orders.error} retry={orders.reload} />
        ) : orders.data?.length ? (
          <>
            {pending.length > 0 && (
              <p className="notice">
                Tienes {pending.length} {pending.length === 1 ? 'pedido' : 'pedidos'} con pago
                pendiente.
              </p>
            )}
            <OrderList orders={orders.data.slice(0, 3)} />
          </>
        ) : (
          <Empty
            title="Aún no tienes pedidos"
            text="Cuando completes una compra aparecerá aquí."
            action={
              <Link className="button button-primary" to="/catalogo">
                Explorar productos
              </Link>
            }
          />
        )}
      </section>
    </AccountLayout>
  );
}
