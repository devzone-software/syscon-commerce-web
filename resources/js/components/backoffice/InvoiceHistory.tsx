import { invoiceStatusLabels } from '../../lib/billing';
import { formatDateTime } from '../../lib/orders';
import { type Invoice } from '../../types';

export function VoidHistory({ voids }: { voids: NonNullable<Invoice['voids']> }) {
  const labels = {
    SENT: 'En proceso',
    ACCEPTED: 'Aceptada',
    REJECTED: 'Rechazada',
    FAILED: 'No enviada',
  };
  return (
    <ul className="bo-simple-list" aria-label="Anulaciones">
      {voids.map((item) => (
        <li key={item.id}>
          <span>
            <strong>
              {item.identifier} · {labels[item.status]}
            </strong>
            <small>
              {item.reason}
              {item.ticket && ` · ticket ${item.ticket}`}
              {item.description &&
                ` · ${item.responseCode ? `${item.responseCode} ` : ''}${item.description}`}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AttemptHistory({ attempts }: { attempts: NonNullable<Invoice['attempts']> }) {
  return (
    <details className="form-stack">
      <summary>Historial de envíos a SUNAT ({attempts.length})</summary>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Acción</th>
              <th scope="col">Resultado</th>
              <th scope="col">Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt, index) => (
              <tr key={index}>
                <td>
                  {formatDateTime(attempt.at)}
                  <small>{attempt.actor ?? 'Sistema'}</small>
                </td>
                <td>{attempt.action === 'RECONCILE' ? 'Conciliación' : 'Envío'}</td>
                <td>{invoiceStatusLabels[attempt.result] ?? attempt.result}</td>
                <td>
                  {attempt.sunatCode && <strong>{attempt.sunatCode} </strong>}
                  {attempt.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
