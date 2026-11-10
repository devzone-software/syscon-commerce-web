import { statusLabel, statusTone } from '../../lib/orders';

export function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  const tone = statusTone(status);
  const icon = { success: '✓', warning: '◷', danger: '!', info: 'i' }[tone];
  return (
    <span className={`status-badge tone-${tone}`}>
      <span aria-hidden="true">{icon}</span> {statusLabel(labels, status)}
    </span>
  );
}
