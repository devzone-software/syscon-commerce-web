import type { ReactNode } from 'react';
import { cartTotal, cartUnits } from '../../lib/cart';
import { money } from '../../state';
import type { CartLine } from '../../types';

/** Totals shared by the cart and the checkout; the backend confirms the final amount. */
export function OrderSummary({
  lines,
  title = 'Resumen',
  children,
}: {
  lines: CartLine[];
  title?: string;
  children?: ReactNode;
}) {
  const units = cartUnits(lines);
  const total = cartTotal(lines);
  return (
    <aside className="summary-card order-summary" aria-labelledby="order-summary-title">
      <h2 id="order-summary-title">{title}</h2>
      <div>
        <span>
          Productos ({units} {units === 1 ? 'unidad' : 'unidades'})
        </span>
        <strong>{money(total)}</strong>
      </div>
      <div className="summary-total">
        <span>Total estimado</span>
        <strong>{money(total)}</strong>
      </div>
      <p>El precio y el stock se confirman al crear el pedido.</p>
      {children}
    </aside>
  );
}
