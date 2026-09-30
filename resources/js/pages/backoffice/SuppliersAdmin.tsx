import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDateTime, supplierJobLabels } from '../../lib/orders';
import { isHttpUrl } from '../../lib/validation';
import { api } from '../../services/api';
import type { SupplierHistory } from '../../types';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

function SupplierForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError('Ingresa el nombre del proveedor.');
    if (!isHttpUrl(feedUrl) || !feedUrl.startsWith('https://'))
      return setError('El feed debe ser una URL HTTPS.');
    if (!Number.isInteger(minutes) || minutes < 15)
      return setError('El intervalo mínimo es de 15 minutos.');
    setBusy(true);
    setError('');
    try {
      await api.createSupplier({
        name: name.trim(),
        feedUrl: feedUrl.trim(),
        minIntervalMinutes: minutes,
      });
      setName('');
      setFeedUrl('');
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="bo-card form-stack"
      onSubmit={submit}
      noValidate
      aria-labelledby="supplier-form-title"
    >
      <h2 id="supplier-form-title">Nuevo proveedor</h2>
      <p className="muted">
        El host del feed debe estar autorizado en <code>SUPPLIER_ALLOWED_HOSTS</code> del backend.
        Formato: CSV UTF-8 separado por punto y coma con cabecera{' '}
        <code>sku;name;price;stock;imageUrl;brand;category</code>.
      </p>
      <div className="field-row">
        <label className="field">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} required />
        </label>
        <label className="field">
          URL del feed (HTTPS)
          <input type="url" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} required />
        </label>
        <label className="field">
          Intervalo mínimo (minutos)
          <input
            type="number"
            min="15"
            step="1"
            value={Number.isNaN(minutes) ? '' : minutes}
            onChange={(e) => setMinutes(e.target.valueAsNumber)}
            required
          />
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Registrar proveedor'}
        </button>
      </div>
    </form>
  );
}

function JobHistory({ jobId }: { jobId: string }) {
  const { data, loading, error, reload } = useData<SupplierHistory[]>(
    () => api.supplierHistory(jobId),
    [jobId],
  );
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data?.length) return <p className="muted">Sin eventos registrados.</p>;
  return (
    <ul className="bo-simple-list">
      {data.map((event) => (
        <li key={event.id}>
          <span>
            <strong>{event.message ?? '—'}</strong>
            <small>
              {event.level} · {formatDateTime(event.occurredAt)}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SuppliersAdmin() {
  const suppliers = useData(api.suppliers);
  const jobs = useData(api.supplierJobs);
  const [running, setRunning] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [message, setMessage] = useState('');
  const [runError, setRunError] = useState('');
  const [openJob, setOpenJob] = useState('');

  const run = async (id: string) => {
    setRunning(id);
    setMessage('');
    setRunError('');
    try {
      const job = await api.runSupplier(id);
      setMessage(
        job.status === 'SUCCEEDED'
          ? `Sincronización completada: ${job.imported} productos importados.`
          : 'La sincronización terminó con errores. Revisa el historial del trabajo.',
      );
      setConfirmId('');
      jobs.reload();
    } catch (e) {
      setRunError((e as Error).message);
    } finally {
      setRunning('');
    }
  };

  const recentJobs = [...(jobs.data ?? [])]
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
    .slice(0, 20);

  return (
    <>
      <PageHeader
        title="Proveedores"
        description="Sincronización de productos desde feeds CSV de proveedores (supplier-service)."
      />
      <p className="notice error" role="note">
        Cada sincronización actualiza por SKU los productos del catálogo:{' '}
        <strong>reemplaza su precio y su stock</strong> por los del feed y los publica. Úsala solo
        con proveedores cuyo stock represente el tuyo.
      </p>
      <SupplierForm onCreated={suppliers.reload} />
      <section className="bo-card" aria-labelledby="suppliers-title">
        <h2 id="suppliers-title">Proveedores registrados</h2>
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {runError && <ErrorBox message={runError} />}
        {suppliers.loading ? (
          <Loading />
        ) : suppliers.error ? (
          <ErrorBox message={suppliers.error} retry={suppliers.reload} />
        ) : suppliers.data?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Intervalo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.data.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <strong>{supplier.name}</strong>
                      <small>{supplier.feedUrl}</small>
                    </td>
                    <td>{supplier.minIntervalMinutes} min</td>
                    <td>{supplier.active ? 'Activo' : 'Inactivo'}</td>
                    <td className="num">
                      {supplier.active &&
                        (confirmId === supplier.id ? (
                          <span className="bo-inline-confirm">
                            <button
                              type="button"
                              className="button button-danger"
                              disabled={Boolean(running)}
                              onClick={() => run(supplier.id)}
                            >
                              {running === supplier.id ? 'Sincronizando…' : 'Confirmar'}
                            </button>
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => setConfirmId('')}
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setConfirmId(supplier.id)}
                          >
                            Sincronizar ahora
                            <span className="visually-hidden"> {supplier.name}</span>
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Sin proveedores" text="Registra un proveedor para sincronizar su feed." />
        )}
      </section>
      <section className="bo-card" aria-labelledby="jobs-title">
        <h2 id="jobs-title">Últimas sincronizaciones</h2>
        {jobs.loading ? (
          <Loading />
        ) : jobs.error ? (
          <ErrorBox message={jobs.error} retry={jobs.reload} />
        ) : recentJobs.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Fin</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="num">
                    Importados
                  </th>
                  <th scope="col">
                    <span className="visually-hidden">Historial</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.supplier?.name ?? '—'}</strong>
                      {openJob === job.id && <JobHistory jobId={job.id} />}
                    </td>
                    <td>{formatDateTime(job.startedAt)}</td>
                    <td>{formatDateTime(job.finishedAt)}</td>
                    <td>
                      <StatusBadge status={job.status} labels={supplierJobLabels} />
                    </td>
                    <td className="num">{job.imported}</td>
                    <td className="num">
                      <button
                        type="button"
                        className="link-button"
                        aria-expanded={openJob === job.id}
                        onClick={() => setOpenJob(openJob === job.id ? '' : job.id)}
                      >
                        {openJob === job.id ? 'Ocultar' : 'Historial'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Todavía no se ejecutaron sincronizaciones.</p>
        )}
      </section>
    </>
  );
}
