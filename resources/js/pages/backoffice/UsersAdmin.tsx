import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { accountStatusLabels, roleLabel } from '../../lib/auth';
import { formatDateTime } from '../../lib/orders';
import { api } from '../../services/api';
import type { IssuedPassword, NewAdmin, StaffAccount } from '../../types';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const PER_PAGE = 20;
const emptyAdmin: NewAdmin = {
  email: '',
  firstName: '',
  lastName: '',
  documentType: 'DNI',
  documentNumber: '',
  phone: '',
};

function adminError(admin: NewAdmin) {
  if (!/^\S+@\S+\.\S+$/.test(admin.email.trim())) return 'Ingresa un correo válido.';
  if (!admin.firstName.trim() || !admin.lastName.trim()) return 'Ingresa nombres y apellidos.';
  if (admin.documentType === 'DNI' && !/^\d{8}$/.test(admin.documentNumber.trim()))
    return 'El DNI tiene 8 dígitos.';
  if (!admin.documentNumber.trim()) return 'Ingresa el número de documento.';
  if (!/^9\d{8}$/.test(admin.phone.trim())) return 'El celular tiene 9 dígitos y empieza con 9.';
  return null;
}

/** Shown once: the platform never returns this password again. */
function IssuedPasswordNotice({
  issued,
  onClose,
}: {
  issued: IssuedPassword;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="bo-card form-stack" aria-labelledby="issued-title" role="status">
      <h2 id="issued-title">Contraseña temporal de {issued.user.email}</h2>
      <p className="notice success">
        Entrégala a la persona por un medio seguro. <strong>No se volverá a mostrar</strong>: si se
        pierde, genera otra. Al ingresar se le pedirá cambiarla.
        {issued.user.status === 'PENDING' &&
          ' La cuenta no podrá ingresar hasta que la valides en la lista de abajo.'}
      </p>
      <p>
        <code className="bo-secret">{issued.temporaryPassword}</code>
      </p>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={copy}>
          {copied ? 'Copiada' : 'Copiar'}
        </button>
        <button type="button" className="button button-primary" onClick={onClose}>
          Ya la entregué
        </button>
      </div>
    </section>
  );
}

function AdminForm({ onCreated }: { onCreated: (issued: IssuedPassword) => void }) {
  const [admin, setAdmin] = useState<NewAdmin>(emptyAdmin);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = (name: keyof NewAdmin) => ({
    value: admin[name],
    onChange: (event: { target: { value: string } }) =>
      setAdmin((current) => ({ ...current, [name]: event.target.value })),
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = adminError(admin);
    if (found) return setError(found);
    setBusy(true);
    setError('');
    try {
      const issued = await api.createAdmin({
        ...admin,
        email: admin.email.trim(),
        firstName: admin.firstName.trim(),
        lastName: admin.lastName.trim(),
        documentNumber: admin.documentNumber.trim(),
        phone: admin.phone.trim(),
      });
      setAdmin(emptyAdmin);
      onCreated(issued);
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
      aria-labelledby="admin-form-title"
    >
      <h2 id="admin-form-title">Nueva cuenta de administrador</h2>
      <p className="muted">
        La cuenta nace <strong>pendiente de validación</strong> y con una contraseña temporal. El
        administrador podrá operar el catálogo, pedidos, pagos, caja y comprobantes SUNAT; la venta
        directa, proveedores, reportes, compras, uso interno y usuarios siguen siendo solo tuyos.
      </p>
      <div className="field-row">
        <label className="field">
          Correo
          <input type="email" autoComplete="off" maxLength={255} required {...field('email')} />
        </label>
        <label className="field">
          Nombres
          <input maxLength={80} required {...field('firstName')} />
        </label>
        <label className="field">
          Apellidos
          <input maxLength={80} required {...field('lastName')} />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          Documento
          <select {...field('documentType')}>
            <option value="DNI">DNI</option>
            <option value="CE">Carné de extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </label>
        <label className="field">
          Número de documento
          <input inputMode="numeric" maxLength={15} required {...field('documentNumber')} />
        </label>
        <label className="field">
          Celular
          <input
            inputMode="tel"
            maxLength={9}
            placeholder="9XXXXXXXX"
            required
            {...field('phone')}
          />
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Creando…' : 'Crear administrador'}
        </button>
      </div>
    </form>
  );
}

type Action =
  'validate' | 'suspend' | 'reactivate' | 'reset' | 'promote' | 'demote' | 'permissions';
type ConfirmAction = Exclude<Action, 'permissions'>;
const actionLabels: Record<Action, string> = {
  validate: 'Validar',
  suspend: 'Suspender',
  reactivate: 'Reactivar',
  reset: 'Nueva contraseña',
  promote: 'Hacer administrador',
  demote: 'Quitar rol de administrador',
  permissions: 'Permisos',
};
const actionHints: Record<ConfirmAction, string> = {
  validate: '¿Verificaste su identidad? La cuenta podrá ingresar.',
  suspend: 'Se cerrarán sus sesiones de inmediato.',
  reactivate: 'Volverá a su estado anterior a la suspensión.',
  reset: 'Se cerrarán sus sesiones y deberá ingresar con la nueva contraseña.',
  promote:
    'Podrá entrar al panel con los permisos estándar de administrador. Luego puedes ajustarlos.',
  demote: 'Volverá a ser cliente: pierde el acceso al panel y se cierran sus sesiones.',
};

/**
 * Permissions the superadmin can give an admin. "Usuarios" stays with the superadmin so nobody
 * below can raise their own access.
 */
const permissionGroups: {
  title: string;
  items: { value: string; label: string; hint: string }[];
}[] = [
  {
    title: 'Operación diaria',
    items: [
      {
        value: 'catalog:write',
        label: 'Catálogo y precios',
        hint: 'Productos, categorías y precios de referencia.',
      },
      {
        value: 'orders:manage',
        label: 'Pedidos y reclamaciones',
        hint: 'Preparar, enviar y entregar pedidos; Libro de Reclamaciones.',
      },
      { value: 'payments:confirm', label: 'Pagos', hint: 'Verificar y confirmar pagos manuales.' },
      { value: 'cash:manage', label: 'Caja', hint: 'Abrir, registrar movimientos y cerrar caja.' },
      {
        value: 'invoices:submit',
        label: 'Comprobantes SUNAT',
        hint: 'Emitir boletas, facturas y notas.',
      },
    ],
  },
  {
    title: 'Permisos adicionales',
    items: [
      {
        value: 'sales:create',
        label: 'Venta directa',
        hint: 'Registrar ventas en mostrador (requiere Caja).',
      },
      {
        value: 'inventory:manage',
        label: 'Compras y uso interno',
        hint: 'Registrar compras a proveedores y retiros.',
      },
      {
        value: 'suppliers:manage',
        label: 'Proveedores',
        hint: 'Feeds y sincronización de proveedores.',
      },
      {
        value: 'reports:view',
        label: 'Reportes',
        hint: 'Ventas, conciliación y resumen del catálogo.',
      },
      {
        value: 'audit:view',
        label: 'Actividad del personal',
        hint: 'Bitácora de cambios del personal.',
      },
    ],
  },
];
const STANDARD_PERMISSIONS = permissionGroups[0].items.map((item) => item.value);

function actionsFor(account: StaffAccount): Action[] {
  if (account.role === 'CUSTOMER') return ['promote'];
  if (account.role !== 'ADMIN') return [];
  if (account.status === 'PENDING')
    return ['validate', 'permissions', 'reset', 'suspend', 'demote'];
  if (account.status === 'SUSPENDED') return ['reactivate', 'demote'];
  return ['permissions', 'reset', 'suspend', 'demote'];
}

/** Checkbox editor of one admin's permissions. */
function PermissionsEditor({
  account,
  onSaved,
  onClose,
}: {
  account: StaffAccount;
  onSaved: (account: StaffAccount) => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<string[]>(account.permissions ?? STANDARD_PERMISSIONS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = [account.firstName, account.lastName].filter(Boolean).join(' ') || account.email;
  const toggle = (value: string) =>
    setChosen((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  const save = async (permissions: string[] | null) => {
    setBusy(true);
    setError('');
    try {
      onSaved(await api.setUserPermissions(account.id, permissions));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bo-card users-permissions" aria-labelledby="users-permissions-title">
      <div className="checkout-card-head">
        <div>
          <h2 id="users-permissions-title">Permisos de {name}</h2>
          <p className="bo-card-sub">
            {account.email} ·{' '}
            {account.customPermissions ? 'permisos personalizados' : 'permisos estándar'}
          </p>
        </div>
        <button type="button" className="link-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="users-permissions-groups">
        {permissionGroups.map((group) => (
          <fieldset key={group.title}>
            <legend>{group.title}</legend>
            {group.items.map((item) => (
              <label key={item.value} className="users-permission">
                <input
                  type="checkbox"
                  checked={chosen.includes(item.value)}
                  onChange={() => toggle(item.value)}
                />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <p className="notice" role="note">
        Gestionar usuarios queda solo para el superadministrador. Los cambios se aplican de
        inmediato; el menú del administrador se actualiza en hasta 15 minutos o al volver a
        ingresar.
      </p>
      <div className="bo-inline-confirm">
        <button
          type="button"
          className="button button-primary"
          disabled={busy || chosen.length === 0}
          onClick={() => void save(chosen)}
        >
          {busy ? 'Guardando…' : 'Guardar permisos'}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={busy}
          onClick={() => void save(null)}
        >
          Usar permisos estándar
        </button>
      </div>
    </section>
  );
}

export function UsersAdmin() {
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useData(
    () => api.users({ role, status, q, page }),
    [role, status, q, page],
  );
  const [issued, setIssued] = useState<IssuedPassword | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: ConfirmAction } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [editing, setEditing] = useState<StaffAccount | null>(null);

  const filter = (apply: () => void) => {
    apply();
    setPage(1);
  };
  const run = async (account: StaffAccount, action: ConfirmAction) => {
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      if (action === 'reset') setIssued(await api.resetUserPassword(account.id));
      else if (action === 'promote' || action === 'demote') {
        const done = await api.changeUserRole(
          account.id,
          action === 'promote' ? 'ADMIN' : 'CUSTOMER',
        );
        setMessage(`${done.email}: ahora es ${roleLabel(`ROLE_${done.role}`).toLowerCase()}.`);
      } else {
        const done =
          action === 'validate'
            ? await api.validateUser(account.id)
            : action === 'suspend'
              ? await api.suspendUser(account.id)
              : await api.reactivateUser(account.id);
        setMessage(`${done.email}: ${accountStatusLabels[done.status] ?? done.status}.`);
      }
      setConfirm(null);
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const pending = data?.items.filter((account) => account.status === 'PENDING').length ?? 0;

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas del personal y de los clientes. Solo el superadministrador crea y valida administradores, cambia roles y elige los permisos de cada administrador."
      />
      {issued ? (
        <IssuedPasswordNotice issued={issued} onClose={() => setIssued(null)} />
      ) : (
        <AdminForm
          onCreated={(created) => {
            setIssued(created);
            reload();
          }}
        />
      )}
      <section className="bo-card" aria-labelledby="users-title">
        <h2 id="users-title">Cuentas</h2>
        <form
          className="bo-filters bo-filters-dates"
          onSubmit={(event) => {
            event.preventDefault();
            filter(() => setQ(search.trim()));
          }}
        >
          <label className="field">
            Buscar
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={() => search.trim() !== q && filter(() => setQ(search.trim()))}
              placeholder="Correo o nombre"
              maxLength={100}
            />
          </label>
          <label className="field">
            Rol
            <select value={role} onChange={(event) => filter(() => setRole(event.target.value))}>
              <option value="">Todos</option>
              <option value="SUPERADMIN">Superadministrador</option>
              <option value="ADMIN">Administrador</option>
              <option value="CUSTOMER">Cliente</option>
            </select>
          </label>
          <label className="field">
            Estado
            <select
              value={status}
              onChange={(event) => filter(() => setStatus(event.target.value))}
            >
              <option value="">Todos</option>
              {Object.entries(accountStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </form>
        {pending > 0 && (
          <p className="notice error" role="note">
            {pending === 1 ? 'Hay 1 cuenta pendiente' : `Hay ${pending} cuentas pendientes`} de
            validación en esta página.
          </p>
        )}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        {actionError && <ErrorBox message={actionError} />}
        {editing && (
          <PermissionsEditor
            key={editing.id}
            account={editing}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setEditing(null);
              setMessage(`${saved.email}: permisos actualizados.`);
              reload();
            }}
          />
        )}
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : data?.items.length ? (
          <>
            <div className="table-wrap responsive-table">
              <table className="data-table users-table">
                <thead>
                  <tr>
                    <th scope="col">Cuenta</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Último ingreso</th>
                    <th scope="col">Alta</th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((account) => (
                    <tr key={account.id}>
                      <td data-label="Cuenta">
                        <strong>
                          {[account.firstName, account.lastName].filter(Boolean).join(' ') ||
                            account.email}
                        </strong>
                        <small>{account.email}</small>
                        {account.documentNumber && (
                          <small>
                            {account.documentType} {account.documentNumber}
                            {account.phone && ` · ${account.phone}`}
                          </small>
                        )}
                      </td>
                      <td data-label="Rol">
                        {roleLabel(`ROLE_${account.role}`)}
                        {account.role === 'ADMIN' && account.permissions && (
                          <small>
                            {account.permissions.length}{' '}
                            {account.permissions.length === 1 ? 'permiso' : 'permisos'} ·{' '}
                            {account.customPermissions ? 'personalizados' : 'estándar'}
                          </small>
                        )}
                      </td>
                      <td data-label="Estado">
                        <StatusBadge status={account.status} labels={accountStatusLabels} />
                        {account.mustChangePassword && <small>Con contraseña temporal</small>}
                      </td>
                      <td data-label="Último ingreso">{formatDateTime(account.lastLoginAt)}</td>
                      <td data-label="Alta">
                        {formatDateTime(account.createdAt)}
                        {account.createdBy && <small>Creada por {account.createdBy}</small>}
                        {account.validatedBy && <small>Validada por {account.validatedBy}</small>}
                      </td>
                      <td data-label="Acciones" className="num">
                        {confirm?.id === account.id ? (
                          <span className="bo-confirm">
                            {actionHints[confirm.action]}
                            <span className="bo-inline-confirm">
                              <button
                                type="button"
                                className={
                                  confirm.action === 'suspend' || confirm.action === 'demote'
                                    ? 'button button-danger'
                                    : 'button button-primary'
                                }
                                disabled={busy}
                                onClick={() => run(account, confirm.action)}
                              >
                                {busy ? 'Procesando…' : actionLabels[confirm.action]}
                              </button>
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => setConfirm(null)}
                              >
                                Cancelar
                              </button>
                            </span>
                          </span>
                        ) : (
                          <span className="bo-inline-confirm">
                            {actionsFor(account).map((action) => (
                              <button
                                key={action}
                                type="button"
                                className="link-button"
                                onClick={() => {
                                  if (action === 'permissions') {
                                    setConfirm(null);
                                    setEditing(account);
                                  } else setConfirm({ id: account.id, action });
                                }}
                              >
                                {actionLabels[action]}
                                <span className="visually-hidden"> {account.email}</span>
                              </button>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={Math.ceil(data.total / PER_PAGE)} onChange={setPage} />
          </>
        ) : (
          <Empty title="Sin cuentas" text="No hay cuentas con esos filtros." />
        )}
      </section>
    </>
  );
}
