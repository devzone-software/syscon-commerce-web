import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { Pagination } from '../../components/shared/Pagination';
import { formatDateTime, shortId } from '../../lib/orders';
import { amountError, differenceLabel } from '../../lib/cash';
import { paymentMethodLabel } from '../../lib/sales';
import { api } from '../../services/api';
import { money } from '../../state';
import type { CashSession } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

const PER_PAGE = 20;

function OpenForm({ onOpened }: { onOpened: () => void }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = amountError(amount, true);
    setError(found ?? '');
    if (found) return;
    setBusy(true);
    try {
      await api.openCash(amount.trim());
      onOpened();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="bo-card bo-lookup" onSubmit={submit} noValidate aria-label="Abrir caja">
      <label className="field">
        Fondo inicial en efectivo (S/)
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
        />
      </label>
      <button type="submit" className="button button-primary" disabled={busy}>
        {busy ? 'Abriendo…' : 'Abrir caja'}
      </button>
      {error && <small className="field-error">{error}</small>}
    </form>
  );
}

function OpenSession({ session, onChanged }: { session: CashSession; onChanged: () => void }) {
  const [movement, setMovement] = useState({ type: 'IN' as 'IN' | 'OUT', amount: '', reason: '' });
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [closed, setClosed] = useState<CashSession | null>(null);

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError('');
    try {
      await action();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  };

  const addMovement = async (event: FormEvent) => {
    event.preventDefault();
    const found =
      amountError(movement.amount) ??
      (movement.reason.trim().length < 3 ? 'Indica el motivo.' : null);
    if (found) return setError(found);
    if (
      await run('movement', () => api.cashMovement({ ...movement, amount: movement.amount.trim() }))
    ) {
      setMovement({ type: 'IN', amount: '', reason: '' });
      onChanged();
    }
  };

  const close = async (event: FormEvent) => {
    event.preventDefault();
    const found = amountError(counted, true);
    if (found) return setError(found);
    await run('close', async () => setClosed(await api.closeCash(counted.trim(), notes.trim())));
  };

  if (closed)
    return (
      <section className="bo-card form-stack" aria-labelledby="cash-closed-title">
        <h2 id="cash-closed-title">Caja cerrada</h2>
        <p
          className={Number(closed.difference) === 0 ? 'notice success' : 'notice error'}
          role="status"
        >
          Esperado {money(Number(closed.expectedCash))} · contado{' '}
          {money(Number(closed.countedCash))}
          {' · '}
          {differenceLabel(closed.difference ?? '0')}
        </p>
        <div className="form-actions">
          <button type="button" className="button button-primary" onClick={onChanged}>
            Continuar
          </button>
        </div>
      </section>
    );

  return (
    <>
      <div className="bo-stats">
        <StatCard
          label="Efectivo esperado"
          value={money(Number(session.expectedCash))}
          hint={`Fondo ${money(Number(session.openingAmount))} · abierta ${formatDateTime(session.openedAt)}`}
        />
        {session.byMethod.map((row) => (
          <StatCard
            key={row.method}
            label={paymentMethodLabel(row.method)}
            value={money(Number(row.total))}
            hint={`${row.payments} ${row.payments === 1 ? 'cobro' : 'cobros'}`}
          />
        ))}
      </div>
      <div className="bo-detail-grid">
        <section className="bo-card form-stack" aria-labelledby="cash-sales-title">
          <h2 id="cash-sales-title">Cobros y movimientos</h2>
          {session.sales?.length ? (
            <ul className="bo-simple-list">
              {session.sales.map((sale) => (
                <li key={`${sale.orderId}${sale.at}`}>
                  <span>
                    <Link className="link-button" to={`/admin/pedidos?id=${sale.orderId}`}>
                      Pedido {shortId(sale.orderId)}
                    </Link>
                    <small>
                      {paymentMethodLabel(sale.method)}
                      {sale.reference && ` · ${sale.reference}`} · {formatDateTime(sale.at)}
                    </small>
                  </span>
                  <strong>{money(Number(sale.amount))}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Aún no hay ventas en esta caja.{' '}
              <Link to="/admin/venta-directa">Ir a venta directa</Link>
            </p>
          )}
          {session.movements && session.movements.length > 0 && (
            <ul className="bo-simple-list">
              {session.movements.map((item, index) => (
                <li key={index}>
                  <span>
                    <strong>{item.type === 'IN' ? 'Ingreso' : 'Egreso'}</strong>
                    <small>
                      {item.reason} · {formatDateTime(item.at)}
                    </small>
                  </span>
                  <strong>
                    {item.type === 'IN' ? '+' : '−'}
                    {money(Number(item.amount))}
                  </strong>
                </li>
              ))}
            </ul>
          )}
          <form
            className="form-stack"
            onSubmit={addMovement}
            noValidate
            aria-label="Registrar movimiento"
          >
            <div className="field-row">
              <label className="field">
                Movimiento
                <select
                  value={movement.type}
                  onChange={(e) =>
                    setMovement({ ...movement, type: e.target.value as 'IN' | 'OUT' })
                  }
                >
                  <option value="IN">Ingreso de efectivo</option>
                  <option value="OUT">Egreso de efectivo</option>
                </select>
              </label>
              <label className="field">
                Monto (S/)
                <input
                  value={movement.amount}
                  onChange={(e) => setMovement({ ...movement, amount: e.target.value })}
                  inputMode="decimal"
                />
              </label>
              <label className="field">
                Motivo
                <input
                  value={movement.reason}
                  onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                  maxLength={255}
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="button button-secondary" disabled={Boolean(busy)}>
                {busy === 'movement' ? 'Registrando…' : 'Registrar movimiento'}
              </button>
            </div>
          </form>
        </section>
        <form
          className="bo-card form-stack"
          onSubmit={close}
          noValidate
          aria-labelledby="cash-close-title"
        >
          <h2 id="cash-close-title">Cerrar caja</h2>
          <p className="muted">
            Cuenta el efectivo e ingrésalo; el sistema calcula la diferencia con lo esperado. Los
            cobros con tarjeta, Yape, Plin o transferencia no se cuentan en efectivo.
          </p>
          <label className="field">
            Efectivo contado (S/)
            <input
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              inputMode="decimal"
            />
            {counted && !amountError(counted, true) && (
              <small>
                {differenceLabel((Number(counted) - Number(session.expectedCash)).toFixed(2))}
              </small>
            )}
          </label>
          <label className="field">
            Observaciones
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </label>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={Boolean(busy)}>
              {busy === 'close' ? 'Cerrando…' : 'Cerrar caja'}
            </button>
          </div>
        </form>
      </div>
      {error && <ErrorBox message={error} />}
    </>
  );
}

function History({ version }: { version: number }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useData(() => api.cashSessions(page), [page, version]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data?.items.length) return <p className="muted">Sin cajas registradas.</p>;
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Historial de cajas</caption>
          <thead>
            <tr>
              <th scope="col">Apertura</th>
              <th scope="col">Cajero</th>
              <th scope="col">Estado</th>
              <th scope="col" className="num">
                Esperado
              </th>
              <th scope="col" className="num">
                Contado
              </th>
              <th scope="col">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((session) => (
              <tr key={session.id}>
                <td>
                  {formatDateTime(session.openedAt)}
                  {session.closedAt && <small>Cierre {formatDateTime(session.closedAt)}</small>}
                </td>
                <td>{session.cashier}</td>
                <td>{session.status === 'OPEN' ? 'Abierta' : 'Cerrada'}</td>
                <td className="num">{money(Number(session.expectedCash))}</td>
                <td className="num">
                  {session.countedCash === null ? '—' : money(Number(session.countedCash))}
                </td>
                <td>
                  {session.difference === null ? '—' : differenceLabel(session.difference)}
                  {session.notes && <small>{session.notes}</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(data.total / PER_PAGE)} onChange={setPage} />
    </>
  );
}

export function CashRegister() {
  const current = useData(api.cashCurrent);
  const [version, setVersion] = useState(0);
  const refresh = () => {
    current.reload();
    setVersion((v) => v + 1);
  };
  return (
    <>
      <PageHeader
        title="Caja"
        description="Apertura con fondo inicial, ingresos y egresos de efectivo, y cierre con arqueo. Las ventas directas se cobran en tu caja abierta."
      />
      {current.loading && current.data === null && !current.error ? (
        <Loading />
      ) : current.error ? (
        <ErrorBox message={current.error} retry={current.reload} />
      ) : current.data ? (
        <OpenSession key={current.data.id} session={current.data} onChanged={refresh} />
      ) : (
        <OpenForm onOpened={refresh} />
      )}
      <section className="bo-card" aria-labelledby="cash-history-title">
        <h2 id="cash-history-title">Historial de cajas</h2>
        <History version={version} />
      </section>
    </>
  );
}
