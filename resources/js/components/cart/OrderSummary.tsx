import type { ReactNode } from 'react';
import { cartTotal, cartUnits } from '../../lib/cart';
import { money } from '../../state';
import type { CartLine } from '../../types';

/** Label / value rows of the Figma summaries (cart, checkout, confirmation, product specs). */
export function InfoRows({
  rows,
}: {
  rows: { label: ReactNode; value: ReactNode; tone?: 'success' | 'total' }[];
}) {
  return (
    <dl className="info-rows">
      {rows.map((row, index) => (
        <div key={index} className={row.tone ? `is-${row.tone}` : undefined}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Totals shared by the cart and the checkout; the backend confirms the final amount. */
export function OrderSummary({
  lines,
  totalLabel = 'Total',
  children,
}: {
  lines: CartLine[];
  totalLabel?: string;
  children?: ReactNode;
}) {
  const units = cartUnits(lines);
  const total = cartTotal(lines);
  return (
    <div className="order-summary">
      <InfoRows
        rows={[
          {
            label: `Subtotal (${units} ${units === 1 ? 'unidad' : 'unidades'})`,
            value: money(total),
          },
          { label: 'Envío', value: 'Coordinado' },
          { label: totalLabel, value: money(total), tone: 'total' },
        ]}
      />
      <p className="order-summary-note">El precio y el stock se confirman al crear el pedido.</p>
      {children}
    </div>
  );
}
