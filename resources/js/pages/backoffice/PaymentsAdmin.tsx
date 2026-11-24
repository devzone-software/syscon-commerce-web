import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { PaymentList } from '../../components/backoffice/PaymentList';
import { PaymentDetails } from '../../components/orders/PaymentDetails';
import { Pagination } from '../../components/shared/Pagination';
import { can, permissions } from '../../lib/auth';
import { shortId } from '../../lib/orders';
import { api } from '../../services/api';
import { useShop } from '../../state';
import type { Payment } from '../../types';
import { useData, Empty, ErrorBox, Loading } from '../../ui';

const paymentTabs = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Confirmados' },
  { value: 'REJECTED', label: 'Rechazados' },
  { value: 'REFUND_REQUIRED', label: 'Por devolver' },
  { value: 'CANCELLED', label: 'Anulados' },
];

function PaymentDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
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
      onChanged();
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
        <PaymentDetails payment={{ ...data, instructions: null }} />
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
              : data.status === 'CANCELLED'
                ? 'Este pago se anuló porque su pedido fue cancelado o venció.'
                : data.status === 'REFUND_REQUIRED'
                  ? 'Hay un cobro que requiere devolución. Revisa el movimiento con el proveedor; este estado no confirma que el dinero se haya devuelto.'
                  : 'Este pago no admite confirmación manual. Su estado se consulta con el proveedor.'}
          </p>
        )}
      </aside>
    </div>
  );
}

export function PaymentsAdmin() {
  const methods = useData(api.paymentMethods);
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const status = params.get('estado') || 'PENDING';
  const q = params.get('q') ?? '';
  const page = Number(params.get('pagina') || 1);
  const [search, setSearch] = useState(q);
  const { data, loading, refreshing, error, reload } = useData(
    () => api.adminPayments({ status, q, page }),
    [status, q, page],
    { keepPreviousData: true },
  );

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: search.trim() });
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;

  return (
    <>
      <PageHeader
        title="Pagos"
        description="Consulta pagos y confirma los abonos manuales después de verificarlos en el banco."
      />
      {methods.error ? (
        <ErrorBox
          message={`No se pudieron consultar los medios habilitados: ${methods.error}`}
          retry={methods.reload}
        />
      ) : methods.data ? (
        <details className="bo-disclosure payment-methods">
          <summary>Medios de pago habilitados</summary>
          <p className="notice">
            {methods.data.manual &&
              'Pago manual habilitado: requiere revisión del abono por el personal. '}
            {methods.data.gateways.includes('MERCADOPAGO')
              ? 'Mercado Pago está habilitado para este entorno; sus pagos se confirman consultando al proveedor.'
              : 'Mercado Pago no está habilitado en este entorno.'}
            {methods.data.gateways.includes('SANDBOX') &&
              ' El simulador de pagos de prueba está habilitado; no realiza cobros reales.'}
          </p>
        </details>
      ) : null}
      {id && <PaymentDetail key={id} id={id} onChanged={reload} />}
      <section className="bo-card" aria-labelledby="payments-count" aria-busy={refreshing}>
        {refreshing && (
          <p role="status" className="visually-hidden">
            Actualizando pagos…
          </p>
        )}
        <div className="bo-tabs payment-tabs" role="group" aria-label="Estado del pago">
          {paymentTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => update({ estado: tab.value === 'PENDING' ? '' : tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="field payment-state-select">
          Estado del pago
          <select
            value={status}
            onChange={(event) =>
              update({ estado: event.target.value === 'PENDING' ? '' : event.target.value })
            }
          >
            {paymentTabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </label>
        <form className="bo-filters bo-filters-compact" onSubmit={submitSearch}>
          <label className="field">
            Buscar
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={() => search.trim() !== q && update({ q: search.trim() })}
              placeholder="Correo, referencia o ID del pago o pedido"
              maxLength={120}
            />
          </label>
        </form>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : (
          data && (
            <>
              <p id="payments-count" className="catalog-count">
                {data.total} {data.total === 1 ? 'pago' : 'pagos'}
              </p>
              {data.items.length ? (
                <PaymentList
                  payments={data.items}
                  selectedId={id}
                  onSelect={(payment) => {
                    update({ id: payment.id, pagina: params.get('pagina') ?? '' });
                    window.scrollTo({ top: 0 });
                  }}
                />
              ) : (
                <Empty
                  title="Sin pagos"
                  text={
                    status === 'PENDING'
                      ? 'No hay pagos pendientes de verificar.'
                      : 'No hay pagos que coincidan con los filtros.'
                  }
                />
              )}
              <Pagination
                page={data.page}
                pages={pages}
                onChange={(target) => update({ pagina: String(target) })}
              />
            </>
          )
        )}
      </section>
    </>
  );
}
