import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout';
import { OrderList } from '../components/orders/OrderList';
import { orderStatusLabels, statusLabel } from '../lib/orders';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

export function Orders() {
  const { data, error, loading, reload } = useData(api.orders);
  const [status, setStatus] = useState('');
  const statuses = [...new Set(data?.map((order) => order.status) ?? [])];
  const visible = status ? (data ?? []).filter((order) => order.status === status) : (data ?? []);
  return (
    <AccountLayout title="Mis pedidos">
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : data?.length ? (
        <section className="white-card" aria-labelledby="orders-count">
          <div className="catalog-toolbar-row">
            <p id="orders-count" className="catalog-count">
              {visible.length} {visible.length === 1 ? 'pedido' : 'pedidos'}
            </p>
            {statuses.length > 1 && (
              <label className="catalog-sort">
                <span>Estado</span>
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
          <OrderList orders={visible} />
        </section>
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
    </AccountLayout>
  );
}
