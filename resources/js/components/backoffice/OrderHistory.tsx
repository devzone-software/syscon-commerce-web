import {
  formatDateTime,
  orderEventLabels,
  orderLabelsForDelivery,
  statusLabel,
} from '../../lib/orders';
import type { DeliveryMethod, OrderEvent } from '../../types';

function eventText(event: OrderEvent, method?: DeliveryMethod | null) {
  const label = statusLabel(orderEventLabels, event.type);
  if (event.type === 'STATUS_CHANGED' && event.to)
    return `${label}: ${statusLabel(orderLabelsForDelivery(method), event.to)}`;
  return label;
}

export function OrderHistory({
  events,
  method,
}: {
  events: OrderEvent[];
  method?: DeliveryMethod | null;
}) {
  if (!events.length) return <p className="muted">Sin eventos registrados.</p>;
  return (
    <ol className="bo-history">
      {events.map((event, index) => (
        <li key={index}>
          <strong>{eventText(event, method)}</strong>
          <small>
            {formatDateTime(event.at)} · {event.system ? 'Sistema' : (event.actor ?? 'Usuario')}
            {event.reference && ` · Ref. ${event.reference}`}
          </small>
        </li>
      ))}
    </ol>
  );
}
