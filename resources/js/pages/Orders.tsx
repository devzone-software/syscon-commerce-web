import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout';
import { orderStatusLabels, statusLabel } from '../lib/orders';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';
import { OrdersTable } from '../components/orders/OrdersTable';
import '../../css/storefront.css';

export function Orders() {
  const { data, error, loading, reload } = useData(api.orders);
  const [status, setStatus] = useState('');
  const statuses = [...new Set(data?.map((order) => order.status) ?? [])];
  const visible = status ? (data ?? []).filter((order) => order.status === status) : (data ?? []);
  return (
    <AccountLayout title="Mis pedidos">
      <section className="portal-card" aria-labelledby="orders-title">
        <div className="portal-card-head">
          <div>
            <h2 id="orders-title">Mis pedidos</h2>
            <p>
              {visible.length} {visible.length === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
          {statuses.length > 1 && (
            <label className="browser-select">
              <span>Estado:</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Todos</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(orderStatusLabels, value)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : data?.length ? (
          <OrdersTable orders={visible} />
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
