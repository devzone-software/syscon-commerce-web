import { formatDateTime, paymentStatusLabels } from '../../lib/orders';
import { paymentMethodLabel } from '../../lib/sales';
import { money } from '../../state';
import type { Payment } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

export function PaymentDetails({ payment }: { payment: Payment }) {
  return (
    <>
      <dl className="detail-list">
        <div>
          <dt>Solicitud de pago</dt>
          <dd>
            <code>{payment.id}</code>
          </dd>
        </div>
        <div>
          <dt>Método</dt>
          <dd>{paymentMethodLabel(payment.provider)}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <StatusBadge status={payment.status} labels={paymentStatusLabels} />
          </dd>
        </div>
        <div>
          <dt>Monto</dt>
          <dd>{money(Number(payment.amount))}</dd>
        </div>
        {payment.externalReference && (
          <div>
            <dt>Referencia</dt>
            <dd>{payment.externalReference}</dd>
          </div>
        )}
        {payment.confirmedAt && (
          <div>
            <dt>Confirmado</dt>
            <dd>
              {formatDateTime(payment.confirmedAt)}
              {payment.confirmedBy && ` · ${payment.confirmedBy}`}
            </dd>
          </div>
        )}
      </dl>
      {payment.instructions && (
        <div className="payment-instructions">
          <strong>Cómo pagar</strong>
          <p>{payment.instructions}</p>
        </div>
      )}
    </>
  );
}
