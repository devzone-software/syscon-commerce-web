import { Link } from 'react-router-dom';
import { orderLabelsForDelivery, shortId, formatDateTime } from '../../lib/orders';
import { money } from '../../state';
import type { Order } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import '../../../css/account.css';

const units = (order: Order) => order.details.reduce((sum, line) => sum + line.quantity, 0);

export function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="table-wrap customer-orders">
      <table className="portal-table customer-orders-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th className="num">Acción</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const count = units(order);
            const names = order.details.map((line) => line.name).join(', ');
            return (
              <tr key={order.id}>
                <td className="portal-code" data-label="Pedido">
                  <Link to={`/pedido/${order.id}`}>#{shortId(order.id)}</Link>
                  {order.createdAt && (
                    <small className="customer-order-date">{formatDateTime(order.createdAt)}</small>
                  )}
                </td>
                <td data-label="Productos">
                  <span className="customer-order-products" title={names}>
                    {names}
                  </span>
                  <small>
                    {count} {count === 1 ? 'unidad' : 'unidades'}
                  </small>
                </td>
                <td data-label="Total">
                  <strong>{money(Number(order.total))}</strong>
                </td>
                <td data-label="Estado">
                  <StatusBadge
                    status={order.status}
                    labels={orderLabelsForDelivery(order.delivery?.method)}
                  />
                </td>
                <td className="num customer-order-action">
                  <Link to={`/pedido/${order.id}`}>Ver detalle</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
