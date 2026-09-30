import { money } from '../../state';
import type { Order } from '../../types';

export function OrderLines({ order }: { order: Order }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">Productos del pedido</caption>
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col" className="num">
              Cantidad
            </th>
            <th scope="col" className="num">
              Precio
            </th>
            <th scope="col" className="num">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.details.map((item) => (
            <tr key={item.productId}>
              <td>
                <strong>{item.name}</strong>
                <small>SKU {item.sku}</small>
              </td>
              <td className="num">{item.quantity}</td>
              <td className="num">{money(Number(item.unitPrice))}</td>
              <td className="num">{money(Number(item.unitPrice) * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              Total
            </th>
            <td className="num">
              <strong>{money(Number(order.total))}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
