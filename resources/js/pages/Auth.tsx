import { InputBox, PasswordInput } from '../components/auth/AuthFields';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout, type AuthFeature } from '../components/auth/AuthLayout';
import { GoogleButton, googleClientId } from '../components/auth/GoogleButton';
import { SignUpFlow } from '../components/auth/SignUpFlow';
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  HeadsetIcon,
  ListCheckIcon,
  MailIcon,
  ReceiptIcon,
  TruckIcon,
} from '../components/icons';
import { loginDestination, safeRedirect } from '../lib/auth';
import { api } from '../services/api';
import { useShop } from '../state';
import type { SignUp } from '../types';
import { ErrorBox } from '../ui';

type Credentials = { email: string; password: string };

const loginFeatures: AuthFeature[] = [
  {
    icon: <ListCheckIcon size={16} />,
    text: 'Consulta el estado de tus pedidos desde tu cuenta.',
  },
  { icon: <ReceiptIcon size={16} />, text: 'Historial de compras y pagos en un solo lugar.' },
  { icon: <BuildingIcon size={16} />, text: 'Compras con RUC y facturación electrónica.' },
  {
    icon: <HeadsetIcon size={16} />,
    text: 'Contacto con nuestro equipo para consultas sobre tus compras.',
  },
];

const signUpFeatures: AuthFeature[] = [
  {
    icon: <ListCheckIcon size={16} />,
    text: (
      <>
        <strong>Conserva tu carrito</strong>
        Tus productos se guardan en este navegador.
      </>
    ),
  },
  {
    icon: <TruckIcon size={16} />,
    text: (
      <>
        <strong>Consulta y seguimiento de pedidos</strong>
        Conoce el estado de cada compra desde tu cuenta.
      </>
    ),
  },
  {
    icon: <ReceiptIcon size={16} />,
    text: (
      <>
        <strong>Datos para tu compra</strong>
        Revisa la facturación y la entrega antes de confirmar.
      </>
    ),
  },
  {
    icon: <HeadsetIcon size={16} />,
    text: (
      <>
        <strong>Ayuda sobre tus productos</strong>
        Asistencia directa con nuestro equipo.
      </>
    ),
  },
];

export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { reloadUser } = useShop();
  // Page requested before RequireAuth sent the visitor here, e.g. the checkout.
  const requestedFrom = (location.state as { from?: unknown } | null)?.from;
  const from = safeRedirect(requestedFrom);
  const [form, setForm] = useState<Credentials>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const set = (name: keyof Credentials, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  const field = (name: keyof Credentials) => ({
    value: form[name],
    onChange: (event: { target: { value: string } }) => set(name, event.target.value),
  });

  // Confirm the new session before leaving: reloadUser() alone swallows errors, which
  // would send the visitor straight back to this form without explanation.
  const finish = async (isNew: boolean) => {
    const signedInUser = await api.me();
    await reloadUser();
    if (isNew) setCreated(true);
    else navigate(loginDestination(signedInUser, requestedFrom), { replace: true });
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
    void run(async () => {
      await api.login(form.email, form.password);
      await finish(false);
    });
  };
  const withGoogle = (credential: string) =>
    run(async () => {
      const { created: isNew } = await api.googleLogin(credential);
      await finish(Boolean(isNew));
    });
  const signUp = (profile: SignUp) =>
    void run(async () => {
      await api.register(profile);
      await api.login(profile.email, profile.password);
      await finish(true);
    });

  if (register)
    return (
      <SignUpFlow
        busy={busy}
        error={error}
        created={created}
        onSubmit={signUp}
        onGoogle={(credential) => void withGoogle(credential)}
        onContinue={() => navigate(from, { replace: true })}
      />
    );

  const google = googleClientId() && (
    <>
      <div className="auth-divider">
        <span>O CONTINÚA CON</span>
      </div>
      <GoogleButton mode="signin" onCredential={withGoogle} />
    </>
  );

  if (created)
    return (
      <AuthLayout
        eyebrow="Comunidad y clientes SYSCON"
        title="¡Bienvenido a Grupo SYSCON!"
        text="Tu cuenta está lista. Ya puedes comprar y seguir tus pedidos."
        features={signUpFeatures}
      >
        <div className="auth-done" role="status">
          <span className="auth-done-icon">
            <CheckIcon size={28} />
          </span>
          <h2>¡Creaste tu cuenta!</h2>
          <p>Ya puedes comprar y seguir tus pedidos en SYSCON.</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => navigate(from, { replace: true })}
          >
            Continuar <ArrowRightIcon size={16} />
          </button>
        </div>
      </AuthLayout>
    );

  return (
    <AuthLayout
      eyebrow="Acceso para empresas y clientes"
      title="Bienvenido nuevamente a Grupo SYSCON"
      text="Consulta tus compras de tecnología y el estado de tus pedidos desde tu cuenta."
      features={loginFeatures}
    >
      <h2>Iniciar sesión</h2>
      <p className="auth-lead">Ingresa tus credenciales para acceder a tu panel.</p>
      {error && <ErrorBox message={error} />}
      {/* One sign-in for everyone: the account itself says if it is a company, a person or staff. */}
      <form onSubmit={submit} className="auth-fields">
        <InputBox icon={<MailIcon size={16} />} label="Correo electrónico" required>
          <input
            {...field('email')}
            type="email"
            required
            autoComplete="email"
            placeholder="ejemplo@correo.com"
          />
        </InputBox>
        <PasswordInput
          label="Contraseña"
          value={form.password}
          onChange={(value) => set('password', value)}
          autoComplete="current-password"
        />
        <div className="auth-row-end">
          <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </div>
        <button className="auth-submit" disabled={busy}>
          {busy ? 'Procesando…' : 'INICIAR SESIÓN'} <ArrowRightIcon size={16} />
        </button>
      </form>
      {google}
      <p className="auth-switch">
        ¿Aún no tienes una cuenta de cliente?{' '}
        <Link to="/registro" state={location.state}>
          Crear cuenta corporativa o personal
        </Link>
      </p>
    </AuthLayout>
  );
}
