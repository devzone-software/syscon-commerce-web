import { useState } from 'react';
import {
  formatDateTime,
  notificationLabels,
  notificationStatusLabels,
  statusLabel,
} from '../../lib/orders';
import { api } from '../../services/api';
import type { OrderNotification } from '../../types';
import { ErrorBox } from '../../ui';

/** Customer emails with their delivery state; resending never repeats the order operation. */
export function OrderNotifications({
  notifications,
  canResend,
  onResent,
}: {
  notifications: OrderNotification[];
  canResend: boolean;
  onResent: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const resend = async (id: string) => {
    setBusy(id);
    setError('');
    try {
      await api.resendNotification(id);
      onResent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };
  return (
    <>
      <h3 className="flow-subtitle">Correos al cliente</h3>
      {notifications.length ? (
        <ul className="bo-simple-list">
          {notifications.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{statusLabel(notificationLabels, item.type)}</strong>
                <small>
                  {item.recipient} · {statusLabel(notificationStatusLabels, item.status)}
                  {item.sentAt && ` el ${formatDateTime(item.sentAt)}`}
                  {item.status === 'FAILED' &&
                    (item.nextAttemptAt
                      ? ` · reintento automático ${formatDateTime(item.nextAttemptAt)}`
                      : ` · sin más reintentos (${item.attempts})`)}
                </small>
                {item.status === 'FAILED' && item.lastError && (
                  <small className="field-error">{item.lastError}</small>
                )}
              </span>
              {canResend && item.status !== 'SENDING' && (
                <button
                  type="button"
                  className="link-button"
                  disabled={Boolean(busy)}
                  onClick={() => resend(item.id)}
                >
                  {busy === item.id ? 'Enviando…' : 'Reenviar'}
                  <span className="visually-hidden">
                    {' '}
                    {statusLabel(notificationLabels, item.type)}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Sin correos registrados.</p>
      )}
      {error && <ErrorBox message={error} />}
    </>
  );
}
