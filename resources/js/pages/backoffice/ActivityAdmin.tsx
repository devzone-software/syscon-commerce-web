import { useState } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { roleLabel } from '../../lib/auth';
import { formatDateTime } from '../../lib/orders';
import { api } from '../../services/api';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const PER_PAGE = 30;

export function ActivityAdmin() {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const staff = useData(async () => {
    const [admins, supers] = await Promise.all([
      api.users({ role: 'ADMIN' }),
      api.users({ role: 'SUPERADMIN' }),
    ]);
    return [...supers.items, ...admins.items];
  });
  const { data, loading, error, reload } = useData(
    () => api.audit({ userId, role, from, to, page }),
    [userId, role, from, to, page],
  );
  const filter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Actividad del personal"
        description="Cada acción que cambia algo (guardar productos, cambiar pedidos, confirmar pagos, ventas, caja, comprobantes, usuarios…) queda registrada con quién, cuándo, desde qué IP y si se aplicó. Las consultas no se registran."
      />
      <section className="bo-card" aria-labelledby="activity-title">
        <h2 id="activity-title">Bitácora</h2>
        <div className="bo-filters bo-filters-activity">
          <label className="field">
            Persona
            <select
              value={userId}
              onChange={(event) => filter(() => setUserId(event.target.value))}
            >
              <option value="">Todo el personal</option>
              {staff.data?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email} ({roleLabel(`ROLE_${account.role}`)})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Rol
            <select value={role} onChange={(event) => filter(() => setRole(event.target.value))}>
              <option value="">Todos</option>
              <option value="ADMIN">Administradores</option>
              <option value="SUPERADMIN">Superadministradores</option>
            </select>
          </label>
          <label className="field">
            Desde
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => filter(() => setFrom(event.target.value))}
            />
          </label>
          <label className="field">
            Hasta
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => filter(() => setTo(event.target.value))}
            />
          </label>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : data?.items.length ? (
          <>
            <p className="catalog-count">
              {data.total === 1 ? '1 acción' : `${data.total} acciones`}
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Persona</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Resultado</th>
                    <th scope="col">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.at)}</td>
                      <td>
                        <strong>{entry.name ?? entry.email}</strong>
                        <small>
                          {entry.name && `${entry.email} · `}
                          {roleLabel(`ROLE_${entry.role}`)}
                        </small>
                      </td>
                      <td>
                        {entry.action}
                        <small>
                          {entry.method} {entry.path}
                        </small>
                      </td>
                      <td>
                        <span className={`status-badge tone-${entry.ok ? 'success' : 'danger'}`}>
                          {entry.ok ? 'Aplicada' : `Rechazada (${entry.status})`}
                        </span>
                      </td>
                      <td>{entry.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={Math.ceil(data.total / PER_PAGE)} onChange={setPage} />
          </>
        ) : (
          <Empty title="Sin actividad" text="No hay acciones registradas con esos filtros." />
        )}
      </section>
    </>
  );
}
