import { statusLabel, statusTone } from '../../lib/orders';

export function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  return (
    <span className={`status-badge tone-${statusTone(status)}`}>{statusLabel(labels, status)}</span>
  );
}
