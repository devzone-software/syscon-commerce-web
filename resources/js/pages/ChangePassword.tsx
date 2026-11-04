import { useState, type FormEvent } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { ArrowRightIcon, KeyIcon, LockIcon, ShieldIcon } from '../components/icons';
import { MIN_PASSWORD, passwordChecks } from '../lib/auth';
import { api } from '../services/api';
import { useShop } from '../state';
import { ErrorBox } from '../ui';
import { PasswordInput } from './Auth';

/**
 * Shown instead of any page while the account has a temporary password from the superadmin:
 * the platform grants no permissions until it is replaced.
 */
export function ChangePassword() {
  const { user, reloadUser, logout } = useShop();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const strength = passwordChecks(next);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next.length < MIN_PASSWORD)
      return setError(`La nueva contraseña necesita al menos ${MIN_PASSWORD} caracteres.`);
    if (next !== confirmation) return setError('Las contraseñas nuevas no coinciden.');
    if (next === current) return setError('La nueva contraseña debe ser distinta de la temporal.');
    setBusy(true);
    setError('');
    try {
      await api.changePassword({
        currentPassword: current,
        newPassword: next,
        newPassword_confirmation: confirmation,
      });
      await reloadUser();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Primer ingreso"
      title="Protege tu cuenta de administrador"
      text="Tu cuenta fue creada por el superadministrador con una contraseña temporal."
      features={[
        { icon: <KeyIcon size={16} />, text: 'Elige una contraseña que solo tú conozcas.' },
        {
          icon: <LockIcon size={16} />,
          text: 'Al guardarla se cierran las demás sesiones abiertas.',
        },
        {
          icon: <ShieldIcon size={16} />,
          text: 'Tus acciones en el backoffice quedan registradas.',
        },
      ]}
      footnote="Hasta cambiarla no tendrás acceso al backoffice."
    >
      <h2>Crea tu contraseña</h2>
      <p className="auth-lead">
        Ingresaste como <strong>{user?.email}</strong>. Reemplaza la contraseña temporal para
        continuar.
      </p>
      {error && <ErrorBox message={error} />}
      <form onSubmit={submit} className="auth-fields" noValidate>
        <PasswordInput
          label="Contraseña temporal"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <div className="auth-grid">
          <PasswordInput
            label="Nueva contraseña"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
          />
        </div>
        <div className="auth-strength" aria-live="polite">
          <div className="auth-strength-head">
            <span>
              FORTALEZA DE CONTRASEÑA:{' '}
              {strength.strength && <b className={`is-${strength.passed}`}>{strength.strength}</b>}
            </span>
          </div>
          <div className="auth-strength-bars" aria-hidden="true">
            {strength.checks.map((_, index) => (
              <i key={index} className={index < strength.passed ? 'is-on' : undefined} />
            ))}
          </div>
          <ul>
            {strength.checks.map((check) => (
              <li key={check.label} className={check.ok ? 'is-ok' : undefined}>
                {check.label}
              </li>
            ))}
          </ul>
        </div>
        <button className="auth-submit" disabled={busy}>
          {busy ? 'Guardando…' : 'GUARDAR CONTRASEÑA'} <ArrowRightIcon size={16} />
        </button>
      </form>
      <p className="auth-switch">
        ¿No eres tú?{' '}
        <button type="button" className="link-button" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </p>
    </AuthLayout>
  );
}
