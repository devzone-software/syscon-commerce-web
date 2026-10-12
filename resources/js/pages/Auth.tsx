import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleButton, googleClientId } from '../components/auth/GoogleButton';
import { PageHero } from '../components/layout/PageHero';
import { safeRedirect } from '../lib/auth';
import { api } from '../services/api';
import { useShop } from '../state';
import type { DocumentType, SignUp } from '../types';
import { ErrorBox } from '../ui';

const documentTypes: { value: DocumentType; label: string; hint: string }[] = [
  { value: 'DNI', label: 'DNI', hint: '8 dígitos' },
  { value: 'RUC', label: 'RUC', hint: '11 dígitos' },
  { value: 'CE', label: 'Carné de extranjería', hint: '9 a 12 caracteres' },
  { value: 'PASAPORTE', label: 'Pasaporte', hint: '6 a 12 caracteres' },
];

const emptySignUp: SignUp = {
  firstName: '',
  lastName: '',
  documentType: 'DNI',
  documentNumber: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
};

export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { reloadUser } = useShop();
  // Page requested before RequireAuth sent the visitor here, e.g. the checkout.
  const from = safeRedirect((location.state as { from?: unknown } | null)?.from);
  const [form, setForm] = useState<SignUp>(emptySignUp);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const field = (name: keyof SignUp) => ({
    value: form[name],
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [name]: event.target.value })),
  });

  // Confirm the new session before leaving: reloadUser() alone swallows errors, which
  // would send the visitor straight back to this form without explanation.
  const finish = async (isNew: boolean) => {
    await api.me();
    await reloadUser();
    if (isNew) setCreated(true);
    else navigate(from, { replace: true });
  };
  const run = async (action: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (register && form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    void run(async () => {
      if (register) await api.register(form);
      await api.login(form.email, form.password);
      await finish(register);
    });
  };
  const withGoogle = (credential: string) =>
    run(async () => {
      const { created: isNew } = await api.googleLogin(credential);
      await finish(Boolean(isNew));
    });

  if (created)
    return (
      <div className="signin">
        <div className="container signin-card signin-done" role="status">
          <svg className="signin-check" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <circle cx="24" cy="24" r="21" />
            <path d="m15 24.5 6 6 12-13" />
          </svg>
          <h1>¡Creaste tu cuenta!</h1>
          <p>Ya puedes comprar y seguir tus pedidos en SYSCON.</p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => navigate(from, { replace: true })}
          >
            Continuar
          </button>
        </div>
      </div>
    );

  const docType = documentTypes.find((type) => type.value === form.documentType)!;
  return (
    <>
      <PageHero
        eyebrow="MI CUENTA"
        title={register ? 'Crea tu cuenta en SYSCON' : 'Inicia sesión en SYSCON'}
        text={
          register
            ? 'Haz tus pedidos y sigue su estado desde un solo lugar.'
            : 'Accede a tus pedidos, datos y compras desde un solo lugar.'
        }
      />
      <div className="signin">
        <div className={`container signin-card${register ? ' wide' : ''}`}>
          <h2>{register ? 'Completa tus datos' : 'Bienvenido de nuevo'}</h2>
          {error && <ErrorBox message={error} />}
          {googleClientId() && (
            <>
              <GoogleButton mode={register ? 'signup' : 'signin'} onCredential={withGoogle} />
              <div className="signin-divider">
                <span>{register ? 'O regístrate con otro correo' : 'O ingresa con tu correo'}</span>
              </div>
            </>
          )}
          <form onSubmit={submit}>
            {register && (
              <>
                <div className="signin-row">
                  <label>
                    Nombres
                    <input
                      {...field('firstName')}
                      required
                      maxLength={80}
                      autoComplete="given-name"
                    />
                  </label>
                  <label>
                    Apellidos
                    <input
                      {...field('lastName')}
                      required
                      maxLength={80}
                      autoComplete="family-name"
                    />
                  </label>
                </div>
                <div className="signin-row">
                  <label>
                    Tipo de documento
                    <select {...field('documentType')} required>
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Número de documento
                    <input
                      {...field('documentNumber')}
                      required
                      maxLength={15}
                      inputMode={['DNI', 'RUC'].includes(form.documentType) ? 'numeric' : 'text'}
                      placeholder={docType.hint}
                    />
                  </label>
                </div>
                <label>
                  Celular
                  <input
                    {...field('phone')}
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="9[0-9]{8}"
                    title="9 dígitos, empezando con 9"
                    placeholder="987654321"
                    autoComplete="tel-national"
                  />
                </label>
              </>
            )}
            <label>
              Correo electrónico
              <input
                {...field('email')}
                type="email"
                placeholder="ejemplo@correo.com"
                required
                autoComplete="email"
              />
            </label>
            <div className={register ? 'signin-row' : undefined}>
              <label>
                Contraseña
                <input
                  {...field('password')}
                  type="password"
                  minLength={register ? 12 : undefined}
                  required
                  autoComplete={register ? 'new-password' : 'current-password'}
                />
              </label>
              {register && (
                <label>
                  Confirmar contraseña
                  <input
                    {...field('password_confirmation')}
                    type="password"
                    minLength={12}
                    required
                    autoComplete="new-password"
                  />
                </label>
              )}
            </div>
            {register && <small>La contraseña debe tener al menos 12 caracteres.</small>}
            <button className="button button-primary signin-submit" disabled={busy}>
              {busy ? 'Procesando…' : register ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="signin-switch">
            {register ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
            <Link to={register ? '/ingresar' : '/registro'} state={location.state}>
              {register ? 'Inicia sesión' : 'Crear cuenta'}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
