import { Link } from 'react-router-dom';
import { orderStatusLabels, shortId } from '../../lib/orders';
import { money } from '../../state';
import type { Order } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="order-cards">
      {orders.map((order) => {
        const units = order.details.reduce((n, item) => n + item.quantity, 0);
        return (
          <li key={order.id}>
            <Link to={`/pedido/${order.id}`} className="order-card">
              <span className="order-card-main">
                <strong>Pedido {shortId(order.id)}</strong>
                <small>
                  {units} {units === 1 ? 'unidad' : 'unidades'} ·{' '}
                  {order.details
                    .slice(0, 2)
                    .map((item) => item.name)
                    .join(', ')}
                  {order.details.length > 2 ? '…' : ''}
                </small>
              </span>
              <StatusBadge status={order.status} labels={orderStatusLabels} />
              <strong className="order-card-total">{money(Number(order.total))}</strong>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
