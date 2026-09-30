import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IdLookup } from '../../components/backoffice/IdLookup';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { OrderLines } from '../../components/orders/OrderLines';
import { OrderTimeline } from '../../components/orders/OrderTimeline';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { allowedTransitions, orderStatusLabels, shortId, statusLabel } from '../../lib/orders';
import { api } from '../../services/api';
import type { Order } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

function OrderDetail({ id }: { id: string }) {
  const { data, loading, error, reload } = useData<Order>(() => api.order(id), [id]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const transition = async (status: string) => {
    setBusy(status);
    setMessage('');
    setActionError('');
    try {
      await api.setOrderStatus(id, status);
      setMessage(`Estado actualizado a “${statusLabel(orderStatusLabels, status)}”.`);
      setConfirmCancel(false);
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error || 'Pedido no encontrado.'} retry={reload} />;
  const options = allowedTransitions(data.status);

  return (
    <div className="bo-detail-grid">
      <section className="bo-card" aria-labelledby="order-detail-title">
        <div className="order-top">
          <h2 id="order-detail-title">Pedido {shortId(data.id)}</h2>
          <StatusBadge status={data.status} labels={orderStatusLabels} />
        </div>
        <OrderTimeline status={data.status} />
        <OrderLines order={data} />
      </section>
      <aside className="bo-card" aria-labelledby="order-actions-title">
        <h2 id="order-actions-title">Gestión</h2>
        <dl className="detail-list">
          <div>
            <dt>ID</dt>
            <dd>
              <code>{data.id}</code>
            </dd>
          </div>
          {data.customerId && (
            <div>
              <dt>Cuenta del cliente</dt>
              <dd>
                <code>{data.customerId}</code>
              </dd>
            </div>
          )}
        </dl>
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {actionError && <ErrorBox message={actionError} />}
        {data.status === 'PAYMENT_PENDING' && (
          <p className="notice">
            El pedido pasa a “Pagado” cuando se confirma su pago manual en la sección Pagos.
          </p>
        )}
        {options.length ? (
          <div className="form-stack">
            {options
              .filter((status) => status !== 'CANCELLED')
              .map((status) => (
                <button
                  key={status}
                  type="button"
                  className="button button-primary"
                  disabled={Boolean(busy)}
                  onClick={() => transition(status)}
                >
                  {busy === status
                    ? 'Actualizando…'
                    : `Marcar como ${statusLabel(orderStatusLabels, status).toLowerCase()}`}
                </button>
              ))}
            {options.includes('CANCELLED') &&
              (confirmCancel ? (
                <div className="bo-confirm" role="group" aria-label="Confirmar cancelación">
                  <span>¿Cancelar este pedido? No se puede deshacer.</span>
                  <button
                    type="button"
                    className="button button-danger"
                    disabled={Boolean(busy)}
                    onClick={() => transition('CANCELLED')}
                  >
                    {busy === 'CANCELLED' ? 'Cancelando…' : 'Sí, cancelar pedido'}
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Volver
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancelar pedido
                </button>
              ))}
          </div>
        ) : (
          <p className="muted">No hay cambios de estado disponibles para este pedido.</p>
        )}
      </aside>
    </div>
  );
}

export function OrdersAdmin() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Busca un pedido por su ID para revisar su detalle y avanzar su estado. El backend todavía no ofrece un listado global de pedidos."
      />
      <div className="bo-card">
        <IdLookup label="ID del pedido" value={id} onSearch={(value) => setParams({ id: value })} />
      </div>
      {id && <OrderDetail key={id} id={id} />}
    </>
  );
}
