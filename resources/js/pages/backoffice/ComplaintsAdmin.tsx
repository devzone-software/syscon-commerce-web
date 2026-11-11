import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { complaintStatusLabels, complaintTypeLabels, formatDay } from '../../lib/complaints';
import { formatDateTime } from '../../lib/orders';
import { api } from '../../services/api';
import type { Complaint } from '../../types';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const today = () => new Date().toISOString().slice(0, 10);

function ResponseForm({ complaint, onDone }: { complaint: Complaint; onDone: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (text.trim().length < 10)
      return setError('Escribe una respuesta de al menos 10 caracteres.');
    setBusy(true);
    setError('');
    try {
      await api.respondComplaint(complaint.id, text.trim());
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <label className="field">
        <span>Respuesta al consumidor (se envía a {complaint.email})</span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={5000}
        />
      </label>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button button-primary" disabled={busy}>
        {busy ? 'Enviando...' : 'Registrar y enviar respuesta'}
      </button>
    </form>
  );
}

/** Staff view of the Libro de Reclamaciones: every sheet, its deadline and its answer. */
export function ComplaintsAdmin() {
  const [status, setStatus] = useState<Complaint['status'] | ''>('PENDING');
  const { data, loading, error, reload } = useData(
    () => api.complaints(status || undefined),
    [status],
  );
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="Libro de Reclamaciones"
        description="Hojas registradas por los consumidores. Respóndelas antes de su fecha límite (15 días hábiles)."
        actions={
          <label className="browser-select">
            <span>Mostrar:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Complaint['status'] | '')}
            >
              <option value="PENDING">Pendientes</option>
              <option value="ANSWERED">Respondidos</option>
              <option value="">Todos</option>
            </select>
          </label>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : !data?.length ? (
        <Empty title="Sin hojas" text="No hay hojas de reclamación con este filtro." />
      ) : (
        <ul className="complaints-admin">
          {data.map((c) => {
            const late = c.status === 'PENDING' && c.dueOn < today();
            return (
              <li key={c.id} className="bo-card">
                <button
                  type="button"
                  className="complaints-admin-head"
                  aria-expanded={open === c.id}
                  onClick={() => setOpen(open === c.id ? null : c.id)}
                >
                  <strong>{c.code}</strong>
                  <span>{complaintTypeLabels[c.type]}</span>
                  <span>{c.consumerName}</span>
                  <span>Registrado {formatDateTime(c.createdAt)}</span>
                  <span className={late ? 'is-late' : undefined}>
                    {c.status === 'PENDING'
                      ? `Vence ${formatDay(c.dueOn)}`
                      : `Respondido ${c.respondedAt ? formatDateTime(c.respondedAt) : ''}`}
                  </span>
                  <span className={`complaints-admin-status is-${c.status.toLowerCase()}`}>
                    {late ? 'Vencido' : complaintStatusLabels[c.status]}
                  </span>
                </button>
                {open === c.id && (
                  <div className="complaints-admin-body">
                    <dl>
                      <dt>Documento</dt>
                      <dd>
                        {c.documentType} {c.documentNumber}
                      </dd>
                      <dt>Contacto</dt>
                      <dd>
                        {c.email} · {c.phone}
                      </dd>
                      <dt>Domicilio</dt>
                      <dd>{c.address}</dd>
                      {c.guardianName && (
                        <>
                          <dt>Apoderado</dt>
                          <dd>{c.guardianName}</dd>
                        </>
                      )}
                      <dt>{c.itemType === 'PRODUCTO' ? 'Producto' : 'Servicio'}</dt>
                      <dd>
                        {c.itemDescription}
                        {c.amount && ` · S/ ${c.amount}`}
                        {c.orderReference && ` · Pedido ${c.orderReference}`}
                      </dd>
                      <dt>Detalle</dt>
                      <dd>{c.detail}</dd>
                      <dt>Pedido del consumidor</dt>
                      <dd>{c.consumerRequest}</dd>
                      {c.response && (
                        <>
                          <dt>Respuesta ({c.respondedAt && formatDateTime(c.respondedAt)})</dt>
                          <dd>{c.response}</dd>
                        </>
                      )}
                    </dl>
                    {c.status === 'PENDING' && (
                      <ResponseForm
                        complaint={c}
                        onDone={() => {
                          setOpen(null);
                          reload();
                        }}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
