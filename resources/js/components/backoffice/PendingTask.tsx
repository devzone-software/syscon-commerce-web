import { Link } from 'react-router-dom';
import { useData } from '../../ui';

/** Mounted only when the user can open the corresponding inbox. */
export function PendingTask({
  title,
  to,
  description,
  load,
}: {
  title: string;
  to: string;
  description: string;
  load: () => Promise<{ total: number }>;
}) {
  const { data, loading, error } = useData(load);
  const total = !loading && !error ? data?.total : undefined;
  return (
    <Link
      to={to}
      className={`bo-shortcut bo-pending-task${total && total > 0 ? ' has-pending' : ''}`}
    >
      <strong>{title}</strong>
      <div className="bo-task-count" aria-live="polite">
        <b>{total ?? '—'}</b>
        <span>
          {loading
            ? 'Consultando…'
            : error || total === undefined
              ? 'Consulta la bandeja'
              : total === 0
                ? 'Sin pendientes'
                : total === 1
                  ? 'pendiente'
                  : 'pendientes'}
        </span>
      </div>
      <span>{description}</span>
    </Link>
  );
}
