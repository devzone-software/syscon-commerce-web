import { publicProductCode } from '../../lib/productPresentation';
import { taxPercent } from '../../lib/billing';
import { money } from '../../state';
import type { Order } from '../../types';

export function OrderLines({ order }: { order: Order }) {
  return (
    <div className="table-wrap responsive-table order-lines">
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
              <td data-label="Producto">
                <strong>{item.name}</strong>
                <small>Código {publicProductCode(item)}</small>
              </td>
              <td className="num" data-label="Cantidad">
                {item.quantity}
              </td>
              <td className="num" data-label="Precio unitario">
                {money(Number(item.unitPrice))}
              </td>
              <td className="num" data-label="Subtotal">
                {money(Number(item.unitPrice) * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {order.delivery && Number(order.delivery.cost ?? 0) > 0 && (
            <>
              <tr>
                <th scope="row" colSpan={3}>
                  Subtotal productos
                </th>
                <td className="num">{money(Number(order.subtotal ?? order.total))}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  Envío a domicilio
                </th>
                <td className="num">{money(Number(order.delivery.cost))}</td>
              </tr>
            </>
          )}
          {order.taxes && (
            <>
              <tr>
                <th scope="row" colSpan={3}>
                  Op. gravada (sin IGV)
                </th>
                <td className="num">{money(Number(order.taxes.taxableAmount))}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  IGV {taxPercent(order.taxes.rate)}
                </th>
                <td className="num">{money(Number(order.taxes.taxAmount))}</td>
              </tr>
            </>
          )}
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
