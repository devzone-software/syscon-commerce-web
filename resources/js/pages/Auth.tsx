import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout, type AuthFeature } from '../components/auth/AuthLayout';
import { GoogleButton, googleClientId } from '../components/auth/GoogleButton';
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  HeadsetIcon,
  ListCheckIcon,
  LockIcon,
  MailIcon,
  ReceiptIcon,
  TruckIcon,
  UserIcon,
} from '../components/icons';
import { MIN_PASSWORD, passwordChecks, safeRedirect } from '../lib/auth';
import { api } from '../services/api';
import { useShop } from '../state';
import type { DocumentType, SignUp } from '../types';
import { ErrorBox } from '../ui';

const personalDocuments: { value: DocumentType; label: string; hint: string }[] = [
  { value: 'DNI', label: 'DNI', hint: '8 dígitos' },
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

const loginFeatures: AuthFeature[] = [
  {
    icon: <ListCheckIcon size={16} />,
    text: 'Seguimiento y trazabilidad de pedidos en tiempo real.',
  },
  { icon: <ReceiptIcon size={16} />, text: 'Historial de compras y pagos en un solo lugar.' },
  { icon: <BuildingIcon size={16} />, text: 'Compras con RUC y facturación electrónica.' },
  { icon: <HeadsetIcon size={16} />, text: 'Soporte IT y atención preferencial para empresas.' },
];

const signUpFeatures: AuthFeature[] = [
  {
    icon: <ListCheckIcon size={16} />,
    text: (
      <>
        <strong>Guarda tus productos y cotizaciones</strong>
        Tu carrito te espera cuando vuelvas.
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
        <strong>Compras ágiles y checkout express</strong>
        Tus datos quedan listos para el próximo pedido.
      </>
    ),
  },
  {
    icon: <HeadsetIcon size={16} />,
    text: (
      <>
        <strong>Soporte técnico preferencial</strong>
        Asistencia directa con nuestro equipo.
      </>
    ),
  },
];

/** Text input with a leading icon and an optional trailing control (Figma inputs). */
function InputBox({
  icon,
  label,
  required,
  trailing,
  children,
}: {
  icon?: ReactNode;
  label: string;
  required?: boolean;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="auth-field">
      <span className="auth-label">
        {label} {required && <em aria-hidden="true">*</em>}
      </span>
      <span className="auth-input">
        {icon}
        {children}
        {trailing}
      </span>
    </label>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <InputBox
      icon={<LockIcon size={16} />}
      label={label}
      required
      trailing={
        <button
          type="button"
          className="auth-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      }
    >
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder="••••••••••••"
      />
    </InputBox>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="auth-segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? 'is-active' : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { reloadUser } = useShop();
  // Page requested before RequireAuth sent the visitor here, e.g. the checkout.
  const from = safeRedirect((location.state as { from?: unknown } | null)?.from);
  const [form, setForm] = useState<SignUp>(emptySignUp);
  const [audience, setAudience] = useState<'empresa' | 'personal'>(
    register ? 'personal' : 'empresa',
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const set = (name: keyof SignUp, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  const field = (name: keyof SignUp) => ({
    value: form[name],
    onChange: (event: { target: { value: string } }) => set(name, event.target.value),
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
  const chooseAudience = (value: 'empresa' | 'personal') => {
    setAudience(value);
    if (register) set('documentType', value === 'empresa' ? 'RUC' : 'DNI');
  };

  const google = googleClientId() && (
    <>
      <div className="auth-divider">
        <span>O CONTINÚA CON</span>
      </div>
      <GoogleButton mode={register ? 'signup' : 'signin'} onCredential={withGoogle} />
    </>
  );

  if (created)
    return (
      <AuthLayout
        eyebrow="Comunidad y clientes SYSCON"
        title="¡Bienvenido a Grupo SYSCON!"
        text="Tu cuenta está lista. Ya puedes comprar y seguir tus pedidos."
        features={signUpFeatures}
        footnote="Datos tratados conforme a la Ley N° 29733"
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

  if (!register)
    return (
      <AuthLayout
        eyebrow="Acceso corporativo y clientes B2B / B2C"
        title="Bienvenido nuevamente a Grupo SYSCON"
        text="Gestiona tus compras de tecnología, licencias y cotizaciones con RUC en un solo lugar seguro."
        features={loginFeatures}
        footnote="Conexión protegida · Cumplimiento Ley N° 29733"
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

  const docType = personalDocuments.find((type) => type.value === form.documentType);
  const strength = passwordChecks(form.password);
  const matches =
    form.password_confirmation.length > 0 && form.password === form.password_confirmation;
  return (
    <AuthLayout
      eyebrow="Comunidad y clientes SYSCON"
      title="Únete a Grupo SYSCON"
      text="Crea tu cuenta y disfruta de una experiencia de compra ágil, seguimiento de pedidos y cotizaciones corporativas."
      features={signUpFeatures}
      footnote="Datos tratados conforme a la Ley N° 29733"
    >
      <div className="auth-title-row">
        <div>
          <h2>Crear una cuenta</h2>
          <p className="auth-lead">Completa tus datos para comenzar tu experiencia tecnológica.</p>
        </div>
        <Segmented
          label="Tipo de cuenta"
          value={audience}
          onChange={chooseAudience}
          options={[
            {
              value: 'personal',
              label: (
                <>
                  <UserIcon size={14} /> Personal
                </>
              ),
            },
            {
              value: 'empresa',
              label: (
                <>
                  <BuildingIcon size={14} /> Empresa (RUC)
                </>
              ),
            },
          ]}
        />
      </div>
      {error && <ErrorBox message={error} />}
      <form onSubmit={submit} className="auth-fields">
        <div className="auth-grid">
          <InputBox icon={<UserIcon size={16} />} label="Nombres" required>
            <input
              {...field('firstName')}
              required
              maxLength={80}
              autoComplete="given-name"
              placeholder="Ej. Jefferson"
            />
          </InputBox>
          <InputBox icon={<UserIcon size={16} />} label="Apellidos" required>
            <input
              {...field('lastName')}
              required
              maxLength={80}
              autoComplete="family-name"
              placeholder="Ej. Reyes"
            />
          </InputBox>
        </div>
        <div className="auth-grid">
          {audience === 'empresa' ? (
            <InputBox icon={<BuildingIcon size={16} />} label="RUC de la empresa" required>
              <input
                {...field('documentNumber')}
                required
                maxLength={11}
                inputMode="numeric"
                placeholder="20XXXXXXXXX"
              />
            </InputBox>
          ) : (
            <>
              <label className="auth-field">
                <span className="auth-label">
                  Tipo de documento <em aria-hidden="true">*</em>
                </span>
                <span className="auth-input">
                  <select {...field('documentType')} required>
                    {personalDocuments.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <InputBox label="Número de documento" required>
                <input
                  {...field('documentNumber')}
                  required
                  maxLength={15}
                  inputMode={form.documentType === 'DNI' ? 'numeric' : 'text'}
                  placeholder={docType?.hint}
                />
              </InputBox>
            </>
          )}
        </div>
        <InputBox
          icon={<MailIcon size={16} />}
          label="Correo electrónico corporativo o personal"
          required
        >
          <input
            {...field('email')}
            type="email"
            required
            autoComplete="email"
            placeholder="nombre@empresa.com o ejemplo@correo.com"
          />
        </InputBox>
        <p className="auth-hint">
          Enviaremos tu comprobante y las confirmaciones de pedido a este correo.
        </p>
        <InputBox
          icon={<span className="auth-prefix">PE +51</span>}
          label="Teléfono celular o WhatsApp"
          required
        >
          <input
            {...field('phone')}
            type="tel"
            required
            inputMode="numeric"
            pattern="9[0-9]{8}"
            title="9 dígitos, empezando con 9"
            placeholder="999 999 999"
            autoComplete="tel-national"
          />
        </InputBox>
        <div className="auth-grid">
          <PasswordInput
            label="Contraseña"
            value={form.password}
            onChange={(value) => set('password', value)}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={form.password_confirmation}
            onChange={(value) => set('password_confirmation', value)}
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
            {matches && (
              <span className="auth-match">
                <CheckIcon size={14} /> Las contraseñas coinciden
              </span>
            )}
          </div>
          <div className="auth-strength-bars" aria-hidden="true">
            {strength.checks.map((_, index) => (
              <i key={index} className={index < strength.passed ? 'is-on' : undefined} />
            ))}
          </div>
          <ul>
            {strength.checks.map((check) => (
              <li key={check.label} className={check.ok ? 'is-ok' : undefined}>
                <CheckIcon size={12} /> {check.label}
              </li>
            ))}
          </ul>
        </div>
        <button className="auth-submit" disabled={busy}>
          {busy ? 'Procesando…' : 'CREAR CUENTA'} <ArrowRightIcon size={16} />
        </button>
      </form>
      {google}
      <p className="auth-switch">
        ¿Ya tienes una cuenta registrada?{' '}
        <Link to="/ingresar" state={location.state}>
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
