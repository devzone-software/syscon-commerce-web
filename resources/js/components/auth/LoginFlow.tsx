import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../layout/Header';
import { PageMain } from '../layout/PageMain';
import { EyeIcon, EyeOffIcon } from '../icons';
import { api } from '../../services/api';
import { ErrorBox } from '../../ui';
import { AccountCreated } from './AccountCreated';
import { AuthFooter } from './AuthLayout';
import { GoogleButton, googleClientId } from './GoogleButton';
import { Recaptcha, recaptchaSiteKey } from './Recaptcha';
import { takeExpiredNotice } from '../IdleSession';
import '../../../css/auth.css';

/** Peruvian mobile (9 digits starting with 9), with or without spaces or the +51 prefix. */
const mobile = (value: string) => {
  const digits = value.replace(/[\s\-()]/g, '').replace(/^\+?51(?=9\d{8}$)/, '');
  return /^9\d{8}$/.test(digits) ? digits : null;
};
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Sign-in in two steps: the e-mail or mobile number first (with Google as the alternative),
 * then the password for that account.
 */
export function LoginFlow({
  busy,
  error,
  created,
  captchaReset,
  onSubmit,
  onGoogle,
  onContinue,
}: {
  busy: boolean;
  error: string;
  created: boolean;
  /** Grows when the server asks for a new "No soy un robot" check: back to the first step. */
  captchaReset: number;
  onSubmit: (login: string, password: string) => void;
  onGoogle: (credential: string) => void;
  onContinue: () => void;
}) {
  const location = useLocation();
  const [expired] = useState(
    () => takeExpiredNotice() || Boolean((location.state as { expired?: boolean } | null)?.expired),
  );
  const [step, setStep] = useState<'login' | 'password'>('login');
  const [login, setLogin] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [verifying, setVerifying] = useState(false);
  // Every check is single-use: coming back to this step shows a clear box.
  const [captchaKey, setCaptchaKey] = useState(0);
  const needsCaptcha = Boolean(recaptchaSiteKey());

  useEffect(() => {
    if (captchaReset) setStep('login');
  }, [captchaReset]);

  const next = async (event: FormEvent) => {
    event.preventDefault();
    const value = login.trim();
    const phone = mobile(value);
    if (!phone && !isEmail(value)) return setInvalid(true);
    if (needsCaptcha) {
      if (!captcha) return setCaptchaError('Marca la casilla "No soy un robot" para continuar.');
      setVerifying(true);
      try {
        await api.captcha(captcha);
      } catch (e) {
        setCaptchaError((e as Error).message);
        setCaptchaKey((key) => key + 1); // a token is single-use: ask for a new check
        return;
      } finally {
        setVerifying(false);
      }
    }
    setLogin(phone ?? value);
    setStep('password');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(login, password);
  };

  let title = 'Ingresa tu e-mail o teléfono para iniciar sesión';
  if (step === 'password') title = 'Ingresa tu contraseña';
  if (created) title = '¡Bienvenido a Grupo SYSCON!';

  return (
    <div className="auth-shell">
      <Header />
      <PageMain className="login-main" resetKey={step}>
        <div className="container login-grid">
          <div className="login-aside">
            <h1>{title}</h1>
            {!created && (
              <nav className="login-help" aria-label="Ayuda con tu cuenta">
                <Link to="/contacto">Necesito ayuda</Link>
              </nav>
            )}
          </div>
          <section className="login-card">
            {created ? (
              <AccountCreated onContinue={onContinue} />
            ) : step === 'login' ? (
              <>
                {expired && !error && (
                  <p className="notice login-expired" role="status">
                    Tu sesión se cerró por inactividad. Vuelve a ingresar para continuar donde
                    estabas.
                  </p>
                )}
                {error && <ErrorBox message={error} />}
                <form onSubmit={(event) => void next(event)} className="signup-form" noValidate>
                  <label className="signup-field">
                    <span>E-mail o teléfono</span>
                    <input
                      value={login}
                      onChange={(event) => {
                        setLogin(event.target.value);
                        setInvalid(false);
                      }}
                      name="username"
                      autoComplete="username"
                      autoFocus
                      required
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? 'login-invalid' : undefined}
                    />
                  </label>
                  {invalid && (
                    <p id="login-invalid" className="signup-taken" role="alert">
                      Ingresa un e-mail válido o un celular de 9 dígitos.
                    </p>
                  )}
                  <Recaptcha
                    resetKey={captchaKey + captchaReset}
                    onToken={(token) => {
                      setCaptcha(token);
                      if (token) setCaptchaError('');
                    }}
                  />
                  {captchaError && (
                    <p className="signup-taken" role="alert">
                      {captchaError}
                    </p>
                  )}
                  <button className="auth-submit" disabled={verifying}>
                    {verifying ? 'Verificando…' : 'Continuar'}
                  </button>
                </form>
                <Link className="login-create" to="/registro" state={location.state}>
                  Crear cuenta
                </Link>
                {googleClientId() && (
                  <>
                    <div className="signup-divider">
                      <span>o</span>
                    </div>
                    <GoogleButton mode="signin" onCredential={onGoogle} />
                  </>
                )}
              </>
            ) : (
              <form onSubmit={submit} className="signup-form">
                <p className="login-who">
                  <span>{login}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setPassword('');
                      setCaptchaKey((key) => key + 1);
                    }}
                  >
                    Cambiar
                  </button>
                </p>
                {/* Lets password managers pair the saved password with this account. */}
                <input
                  type="text"
                  name="username"
                  value={login}
                  autoComplete="username"
                  readOnly
                  hidden
                />
                {error && <ErrorBox message={error} />}
                <label className="signup-field">
                  <span>Contraseña</span>
                  <span className="signup-password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      autoFocus
                      required
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
                </label>
                <Link className="login-forgot" to="/recuperar">
                  ¿Olvidaste tu contraseña?
                </Link>
                <button className="auth-submit" disabled={busy}>
                  {busy ? 'Ingresando…' : 'Iniciar sesión'}
                </button>
              </form>
            )}
          </section>
        </div>
      </PageMain>
      <AuthFooter />
    </div>
  );
}
