import { formatDateTime, orderEventLabels, orderStatusLabels, statusLabel } from '../../lib/orders';
import type { OrderEvent } from '../../types';

function eventText(event: OrderEvent) {
  const label = statusLabel(orderEventLabels, event.type);
  if (event.type === 'STATUS_CHANGED' && event.to)
    return `${label}: ${statusLabel(orderStatusLabels, event.to)}`;
  return label;
}

export function OrderHistory({ events }: { events: OrderEvent[] }) {
  if (!events.length) return <p className="muted">Sin eventos registrados.</p>;
  return (
    <ol className="bo-history">
      {events.map((event, index) => (
        <li key={index}>
          <strong>{eventText(event)}</strong>
          <small>
            {formatDateTime(event.at)} · {event.system ? 'Sistema' : (event.actor ?? 'Usuario')}
            {event.reference && ` · Ref. ${event.reference}`}
          </small>
        </li>
      ))}
    </ol>
  );
}
