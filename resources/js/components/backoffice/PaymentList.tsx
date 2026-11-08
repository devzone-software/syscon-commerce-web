import {
  formatDateTime,
  orderStatusLabels,
  paymentStatusLabels,
  shortId,
  statusLabel,
} from '../../lib/orders';
import { paymentMethodLabel } from '../../lib/sales';
import { money } from '../../state';
import type { AdminPayment } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

/** The same payments and actions in a desktop table or mobile cards. */
export function PaymentList({
  payments,
  selectedId,
  onSelect,
}: {
  payments: AdminPayment[];
  selectedId: string;
  onSelect: (payment: AdminPayment) => void;
}) {
  const action = (payment: AdminPayment) => (
    <button type="button" className="link-button payment-open" onClick={() => onSelect(payment)}>
      {payment.status === 'PENDING' && payment.provider === 'MANUAL'
        ? 'Verificar abono'
        : 'Ver estado'}
      <span className="visually-hidden"> del pago {shortId(payment.id)}</span>
    </button>
  );

  return (
    <>
      <div className="table-wrap payments-table">
        <table className="data-table">
          <caption className="visually-hidden">Pagos, importes y acciones disponibles</caption>
          <thead>
            <tr>
              <th scope="col">Solicitud</th>
              <th scope="col">Cliente / medio</th>
              <th scope="col" className="num">
                Monto
              </th>
              <th scope="col">Pedido</th>
              <th scope="col">Estado / referencia</th>
              <th scope="col">
                <span className="visually-hidden">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className={payment.id === selectedId ? 'bo-row-active' : undefined}
              >
                <td>
                  <strong>#{shortId(payment.id)}</strong>
                  <small>{formatDateTime(payment.createdAt ?? null)}</small>
                </td>
                <td>
                  {payment.customerEmail}
                  <small>{paymentMethodLabel(payment.provider)}</small>
                </td>
                <td className="num">{money(Number(payment.amount))}</td>
                <td>
                  <strong>#{shortId(payment.orderId)}</strong>
                  <small>{statusLabel(orderStatusLabels, payment.orderStatus)}</small>
                  {payment.orderExpiresAt && (
                    <small>Vence {formatDateTime(payment.orderExpiresAt)}</small>
                  )}
                </td>
                <td>
                  <StatusBadge status={payment.status} labels={paymentStatusLabels} />
                  {payment.externalReference && <small>Ref. {payment.externalReference}</small>}
                  {payment.confirmedAt && <small>{formatDateTime(payment.confirmedAt)}</small>}
                </td>
                <td className="num">{action(payment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="payment-cards" aria-label="Pagos">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className={`payment-card${payment.id === selectedId ? ' is-selected' : ''}`}
          >
            <div className="payment-card-head">
              <div>
                <strong>Pago #{shortId(payment.id)}</strong>
                <small>{formatDateTime(payment.createdAt ?? null)}</small>
              </div>
              <strong className="payment-card-amount">{money(Number(payment.amount))}</strong>
            </div>
            <StatusBadge status={payment.status} labels={paymentStatusLabels} />
            <dl>
              <div>
                <dt>Cliente</dt>
                <dd>{payment.customerEmail}</dd>
              </div>
              <div>
                <dt>Medio</dt>
                <dd>{paymentMethodLabel(payment.provider)}</dd>
              </div>
              <div>
                <dt>Pedido</dt>
                <dd>
                  #{shortId(payment.orderId)}
                  <small>{statusLabel(orderStatusLabels, payment.orderStatus)}</small>
                </dd>
              </div>
              {payment.orderExpiresAt && (
                <div>
                  <dt>Vence</dt>
                  <dd>{formatDateTime(payment.orderExpiresAt)}</dd>
                </div>
              )}
              {payment.externalReference && (
                <div>
                  <dt>Referencia</dt>
                  <dd>{payment.externalReference}</dd>
                </div>
              )}
              {payment.confirmedAt && (
                <div>
                  <dt>Confirmado</dt>
                  <dd>{formatDateTime(payment.confirmedAt)}</dd>
                </div>
              )}
            </dl>
            {action(payment)}
          </li>
        ))}
      </ul>
    </>
  );
}
