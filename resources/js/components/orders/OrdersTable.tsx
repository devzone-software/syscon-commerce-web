import { Link } from 'react-router-dom';
import { orderStatusLabels, shortId } from '../../lib/orders';
import { money } from '../../state';
import type { Order } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import '../../../css/account.css';

const units = (order: Order) => order.details.reduce((sum, line) => sum + line.quantity, 0);

/** Table of the "Historial de pedidos recientes" card, shared with "Mis pedidos". */
export function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="table-wrap">
      <table className="portal-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Ítems</th>
            <th>Monto total</th>
            <th>Estado</th>
            <th className="num">Acción</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const count = units(order);
            return (
              <tr key={order.id}>
                <td className="portal-code">#{shortId(order.id)}</td>
                <td>
                  {count} {count === 1 ? 'unidad' : 'unidades'}
                </td>
                <td>
                  <strong>{money(Number(order.total))}</strong>
                </td>
                <td>
                  <StatusBadge status={order.status} labels={orderStatusLabels} />
                </td>
                <td className="num">
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
