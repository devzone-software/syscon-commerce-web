import { useState, type FormEvent } from 'react';
import { invoiceTypeLabel, invoiceTypes, SERIES, seriesPrefix } from '../../lib/billing';
import { api } from '../../services/api';
import type { InvoiceSeries } from '../../types';
import { ErrorBox } from '../../ui';

export function InvoiceSeriesPanel({
  series,
  onChanged,
}: {
  series: InvoiceSeries[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState({ type: '03', series: '', startAfter: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(done);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    const code = form.series.trim().toUpperCase();
    const prefix = seriesPrefix(form.type);
    if (!SERIES.test(code)) return setError('La serie tiene 4 caracteres y empieza con F o B.');
    if (prefix && !code.startsWith(prefix))
      return setError(`${invoiceTypeLabel(form.type)}: la serie empieza con ${prefix}.`);
    const startAfter = Number(form.startAfter || 0);
    if (!Number.isInteger(startAfter) || startAfter < 0)
      return setError('El último número usado debe ser un entero mayor o igual a 0.');
    run(
      'new',
      async () => {
        await api.createInvoiceSeries({ type: form.type, series: code, startAfter });
        setForm({ ...form, series: '', startAfter: '' });
      },
      `Serie ${code} registrada.`,
    );
  };

  return (
    <section className="bo-card" aria-labelledby="series-title">
      <h2 id="series-title">Series</h2>
      <p className="muted">
        Sin serie elegida, cada comprobante usa la primera serie activa de su tipo. Las notas usan
        la letra del comprobante que modifican. Si continúas la numeración del servicio habitual de
        SYSCON, concilia el último número y acuerda el cambio antes de usar la serie aquí. Evita
        emitir con la misma serie en ambos sistemas al mismo tiempo.
      </p>
      <div className="table-wrap responsive-table">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Serie</th>
              <th scope="col" className="num">
                Último número
              </th>
              <th scope="col">Siguiente</th>
              <th scope="col">
                <span className="visually-hidden">Estado</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((item) => (
              <tr key={item.id}>
                <td data-label="Tipo">{invoiceTypeLabel(item.type)}</td>
                <td data-label="Serie">
                  <strong>{item.series}</strong>
                </td>
                <td data-label="Último número" className="num">
                  {item.lastNumber}
                </td>
                <td data-label="Siguiente">
                  {item.active ? item.nextNumber : <span className="muted">Inactiva</span>}
                </td>
                <td data-label="Estado" className="num">
                  <button
                    type="button"
                    className="link-button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      run(
                        String(item.id),
                        () => api.setInvoiceSeriesActive(item.id, !item.active),
                        `Serie ${item.series} ${item.active ? 'desactivada' : 'activada'}.`,
                      )
                    }
                  >
                    {item.active ? 'Desactivar' : 'Activar'}
                    <span className="visually-hidden"> {item.series}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="form-stack" onSubmit={create} noValidate aria-label="Registrar serie">
        <div className="field-row">
          <label className="field">
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {invoiceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nueva serie
            <input
              value={form.series}
              onChange={(e) => setForm({ ...form, series: e.target.value })}
              placeholder={form.type === '01' ? 'F002' : 'B002'}
              maxLength={4}
            />
          </label>
          <label className="field">
            Último número ya usado
            <input
              value={form.startAfter}
              onChange={(e) => setForm({ ...form, startAfter: e.target.value })}
              inputMode="numeric"
              placeholder="0"
            />
            <small>Solo si la serie viene de otro sistema.</small>
          </label>
        </div>
        {error && <ErrorBox message={error} />}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="button button-secondary" disabled={Boolean(busy)}>
            {busy === 'new' ? 'Registrando…' : 'Registrar serie'}
          </button>
        </div>
      </form>
    </section>
  );
}
