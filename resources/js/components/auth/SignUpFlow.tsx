import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../layout/Header';
import { PageMain } from '../layout/PageMain';
import { EyeIcon, EyeOffIcon } from '../icons';
import { ErrorBox } from '../../ui';
import { MIN_PASSWORD, suggestPassword } from '../../lib/auth';
import type { SignUp } from '../../types';
import { AccountCreated } from './AccountCreated';
import { AuthFooter } from './AuthLayout';
import { GoogleButton, googleClientId } from './GoogleButton';
import '../../../css/auth.css';

/** Shell of the sign-up pages: brand band with the title and a centered card over it. */
function SignUpShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-shell">
      <Header />
      <PageMain className="signup-main" resetKey={title}>
        <div className="signup-band">
          <h1>{title}</h1>
        </div>
        <div className="container">
          <section className="signup-card">{children}</section>
        </div>
      </PageMain>
      <AuthFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="signup-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const KeyIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M10.7 12.3 21 2M16 7l3 3M19 4l2 2" />
  </svg>
);

const PeruFlag = () => (
  <svg width="20" height="14" viewBox="0 0 3 2" aria-hidden="true">
    <rect width="3" height="2" fill="#d91023" />
    <rect x="1" width="1" height="2" fill="#fff" />
  </svg>
);

/**
 * Account creation on one card: Google, or an e-mail that unfolds the rest of the form
 * (phone, name, password and contact consent). Clicking "Continuar" accepts the terms.
 */
export function SignUpFlow({
  busy,
  error,
  takenEmail,
  created,
  onSubmit,
  onGoogle,
  onContinue,
}: {
  busy: boolean;
  error: string;
  /** E-mail the platform rejected because an account already uses it. */
  takenEmail: string | null;
  created: boolean;
  onSubmit: (profile: SignUp) => void;
  onGoogle: (credential: string) => void;
  onContinue: () => void;
}) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleOff, setGoogleOff] = useState(false);
  // Strong password offered under the field once the visitor reaches it.
  const [suggestion, setSuggestion] = useState('');
  const [copied, setCopied] = useState(false);
  const applySuggestion = () => {
    setForm((current) => ({ ...current, password: suggestion }));
    setShowPassword(true); // so the visitor sees what they are about to save
    setCopied(false);
  };
  const copySuggestion = () =>
    navigator.clipboard
      ?.writeText(suggestion)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  const [form, setForm] = useState<SignUp>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    contactConsent: true,
    termsAccepted: true,
  });
  const field = (name: 'firstName' | 'lastName' | 'phone' | 'email' | 'password') => ({
    value: form[name],
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [name]: event.target.value })),
  });
  // The notice only applies to the e-mail that was rejected; editing it hides the notice.
  const emailTaken =
    takenEmail !== null && takenEmail.toLowerCase() === form.email.trim().toLowerCase();
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (takenEmail) emailInput.current?.focus();
  }, [takenEmail]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!expanded) return setExpanded(true);
    onSubmit({
      ...form,
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      termsAccepted: true,
    });
  };

  if (created)
    return (
      <SignUpShell title="¡Bienvenido a Grupo SYSCON!">
        <AccountCreated onContinue={onContinue} />
      </SignUpShell>
    );

  return (
    <SignUpShell title="Crea tu cuenta y compra tecnología en SYSCON">
      {error && <ErrorBox message={error} />}
      {googleClientId() ? (
        <GoogleButton mode="signup" onCredential={onGoogle} />
      ) : (
        // Same look as Google's button when this server has no OAuth client configured.
        <>
          <button type="button" className="signup-google" onClick={() => setGoogleOff(true)}>
            <GoogleLogo /> <span>Registrarse con Google</span>
          </button>
          {googleOff && (
            <p className="signin-google-error" role="status">
              El registro con Google aún no está disponible. Usa tu e-mail.
            </p>
          )}
        </>
      )}
      <div className="signup-divider">
        <span>O ingresa tu e-mail</span>
      </div>
      <form onSubmit={submit} className="signup-form">
        <Field label="E-mail">
          <input
            ref={emailInput}
            aria-invalid={emailTaken || undefined}
            aria-describedby={emailTaken ? 'signup-email-taken' : undefined}
            value={form.email}
            onChange={(event) => {
              const email = event.target.value;
              setForm((current) => ({ ...current, email }));
              // Typing or browser autofill unfolds the rest of the form too.
              if (email) setExpanded(true);
            }}
            onFocus={() => setExpanded(true)}
            type="email"
            required
            // "username" lets password managers save this e-mail with the new password.
            name="email"
            autoComplete="username"
            placeholder="ejemplo@correo.com"
          />
        </Field>
        {emailTaken && (
          <p id="signup-email-taken" className="signup-taken" role="alert">
            <strong>Ya existe una cuenta con este correo.</strong> Si es tuya,{' '}
            <Link to="/ingresar" state={location.state}>
              inicia sesión
            </Link>
            . Si quieres crear otra cuenta, utiliza otro correo.
          </p>
        )}
        {expanded && (
          <>
            <Field label="Teléfono">
              <span className="signup-phone">
                <span className="signup-phone-code">
                  <PeruFlag /> +51
                </span>
                <input
                  {...field('phone')}
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="9[0-9]{8}"
                  title="Celular de 9 dígitos que empieza con 9"
                  maxLength={9}
                  autoComplete="tel-national"
                />
              </span>
            </Field>
            <div className="signup-row">
              <Field label="Nombres">
                <input {...field('firstName')} required maxLength={80} autoComplete="given-name" />
              </Field>
              <Field label="Apellidos">
                <input {...field('lastName')} required maxLength={80} autoComplete="family-name" />
              </Field>
            </div>
            <Field label="Contraseña">
              <span className="signup-password">
                <input
                  {...field('password')}
                  type={showPassword ? 'text' : 'password'}
                  name="new-password"
                  id="new-password"
                  required
                  minLength={MIN_PASSWORD}
                  maxLength={128}
                  title={`Usa al menos ${MIN_PASSWORD} caracteres.`}
                  autoComplete="new-password"
                  onFocus={() => setSuggestion((current) => current || suggestPassword())}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                </button>
              </span>
              <small>Mínimo {MIN_PASSWORD} caracteres. Puedes usar una frase.</small>
            </Field>
            {suggestion && (form.password === '' || form.password === suggestion) && (
              <div className="signup-suggest" aria-live="polite">
                <KeyIcon />
                {form.password === suggestion ? (
                  <>
                    <p>
                      <strong>Usando la contraseña segura sugerida.</strong> Guárdala o deja que tu
                      navegador la recuerde.
                    </p>
                    <button type="button" onClick={copySuggestion}>
                      {copied ? '¡Copiada!' : 'Copiar'}
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Contraseña segura sugerida</strong>
                      <code>{suggestion}</code>
                    </p>
                    <button type="button" onClick={applySuggestion}>
                      Usar
                    </button>
                    <button
                      type="button"
                      className="signup-suggest-other"
                      onClick={() => setSuggestion(suggestPassword())}
                      aria-label="Sugerir otra contraseña"
                      title="Sugerir otra"
                    >
                      ↻
                    </button>
                  </>
                )}
              </div>
            )}
            <label className="signup-check">
              <input
                type="checkbox"
                checked={form.contactConsent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactConsent: event.target.checked }))
                }
              />
              <span>Acepto que me contacten por SMS y WhatsApp.</span>
            </label>
            <p className="signup-terms">
              Al continuar, acepto los{' '}
              <Link to="/terminos-y-condiciones" target="_blank">
                Términos y condiciones
              </Link>{' '}
              y autorizo el uso de mis datos de acuerdo a la{' '}
              <Link to="/privacidad" target="_blank">
                Declaración de privacidad
              </Link>
              .
            </p>
            <button className="auth-submit" disabled={busy}>
              {busy ? 'Creando cuenta…' : 'Continuar'}
            </button>
            <p className="signup-switch">
              ¿Ya tienes cuenta?{' '}
              <Link to="/ingresar" state={location.state}>
                Inicia sesión
              </Link>
            </p>
          </>
        )}
      </form>
    </SignUpShell>
  );
}
