import { paymentStatusLabels } from '../../lib/orders';
import { money } from '../../state';
import type { Payment } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

export function PaymentDetails({ payment }: { payment: Payment }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>Solicitud de pago</dt>
        <dd>
          <code>{payment.id}</code>
        </dd>
      </div>
      <div>
        <dt>Método</dt>
        <dd>{payment.provider === 'MANUAL' ? 'Pago manual' : payment.provider}</dd>
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
    </dl>
  );
}
