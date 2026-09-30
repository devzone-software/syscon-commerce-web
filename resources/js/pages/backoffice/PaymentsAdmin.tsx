import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IdLookup } from '../../components/backoffice/IdLookup';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { PaymentDetails } from '../../components/orders/PaymentDetails';
import { can, permissions } from '../../lib/auth';
import { shortId } from '../../lib/orders';
import { api } from '../../services/api';
import { useShop } from '../../state';
import type { Payment } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

function PaymentDetail({ id }: { id: string }) {
  const { user } = useShop();
  const { data, loading, error, reload } = useData<Payment>(() => api.payment(id), [id]);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!reference.trim()) {
      setActionError('Ingresa la referencia verificada del pago.');
      return;
    }
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      await api.confirmPayment(id, reference.trim());
      setMessage('Pago confirmado. El pedido quedó como pagado.');
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error || 'Pago no encontrado.'} retry={reload} />;
  const confirmable =
    data.status === 'PENDING' &&
    data.provider === 'MANUAL' &&
    can(user, permissions.paymentsConfirm);

  return (
    <div className="bo-detail-grid">
      <section className="bo-card" aria-labelledby="payment-title">
        <h2 id="payment-title">Solicitud de pago</h2>
        <PaymentDetails payment={data} />
        {can(user, permissions.ordersManage) && (
          <Link className="link-button" to={`/admin/pedidos?id=${data.orderId}`}>
            Ver pedido {shortId(data.orderId)}
          </Link>
        )}
      </section>
      <aside className="bo-card" aria-labelledby="payment-confirm-title">
        <h2 id="payment-confirm-title">Confirmación</h2>
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {confirmable ? (
          <form className="form-stack" onSubmit={confirm} noValidate>
            <p className="muted">
              Confirma solo después de verificar el pago fuera de este sistema (por ejemplo, en el
              estado de cuenta bancario).
            </p>
            <label className="field">
              Referencia verificada
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={255}
                required
              />
            </label>
            {actionError && <ErrorBox message={actionError} />}
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? 'Confirmando…' : 'Confirmar pago'}
            </button>
          </form>
        ) : (
          <p className="muted">
            {data.status === 'APPROVED'
              ? 'Este pago ya fue confirmado.'
              : 'Este pago no admite confirmación manual.'}
          </p>
        )}
      </aside>
    </div>
  );
}

export function PaymentsAdmin() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  return (
    <>
      <PageHeader
        title="Pagos"
        description="Busca una solicitud de pago por su ID. El cliente ve este identificador en la página de su pedido. El backend todavía no ofrece un listado de pagos pendientes."
      />
      <div className="bo-card">
        <IdLookup
          label="ID de la solicitud de pago"
          value={id}
          onSearch={(value) => setParams({ id: value })}
        />
      </div>
      {id && <PaymentDetail key={id} id={id} />}
    </>
  );
}
