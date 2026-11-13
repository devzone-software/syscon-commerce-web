import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../icons';
import type { StatTone } from './StatCard';
import { useData } from '../../ui';

/** Mounted only when the user can open the corresponding inbox. */
export function PendingTask({
  title,
  to,
  description,
  load,
  icon,
  tone = 'blue',
}: {
  title: string;
  to: string;
  description: string;
  load: () => Promise<{ total: number }>;
  icon?: ReactNode;
  tone?: StatTone;
}) {
  const { data, loading, error } = useData(load);
  const total = !loading && !error ? data?.total : undefined;
  return (
    <Link
      to={to}
      className={`bo-shortcut bo-pending-task tone-${tone}${total && total > 0 ? ' has-pending' : ''}`}
    >
      <span className="bo-shortcut-head">
        {icon && (
          <span className="bo-stat-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <strong>{title}</strong>
      </span>
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
      <span className="bo-shortcut-go" aria-hidden="true">
        Atender <ArrowRightIcon size={14} />
      </span>
    </Link>
  );
}
