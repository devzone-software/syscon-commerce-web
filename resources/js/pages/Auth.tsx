import { InputBox, PasswordInput } from '../components/auth/AuthFields';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout, type AuthFeature } from '../components/auth/AuthLayout';
import { GoogleButton, googleClientId } from '../components/auth/GoogleButton';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  HeadsetIcon,
  ListCheckIcon,
  MailIcon,
  ReceiptIcon,
  TruckIcon,
  UserIcon,
} from '../components/icons';
import { loginDestination, MIN_PASSWORD, safeRedirect } from '../lib/auth';
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
  { icon: <ListCheckIcon size={16} />, text: 'Sigue tus pedidos y compras.' },
  { icon: <ReceiptIcon size={16} />, text: 'Consulta tus boletas y facturas.' },
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
  const requestedFrom = (location.state as { from?: unknown } | null)?.from;
  const from = safeRedirect(requestedFrom);
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
    const signedInUser = await api.me();
    await reloadUser();
    if (isNew) setCreated(true);
    else
      navigate(loginDestination(signedInUser, requestedFrom), {
        replace: true,
        state: { cartPath: (location.state as { cartPath?: unknown } | null)?.cartPath },
      });
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
        footnote="Usa tus datos para crear y gestionar tu cuenta SYSCON."
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
            onClick={() => navigate(from, { replace: true, state: location.state })}
          >
            Continuar <ArrowRightIcon size={16} />
          </button>
        </div>
      </AuthLayout>
    );

  if (!register)
    return (
      <AuthLayout
        eyebrow="TU CUENTA SYSCON"
        title="Qué bueno verte de nuevo"
        text="Ingresa para continuar tu compra o consultar tus pedidos."
        features={loginFeatures}
        footnote="Tu compra, en un solo lugar."
      >
        <h2>Iniciar sesión</h2>
        <p className="auth-lead">Usa el correo de tu cuenta.</p>
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
            <Link to="/recuperar" state={location.state}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button className="auth-submit" disabled={busy}>
            {busy ? 'Procesando…' : 'INICIAR SESIÓN'} <ArrowRightIcon size={16} />
          </button>
        </form>
        {google}
        <p className="auth-switch">
          ¿Aún no tienes una cuenta de cliente?{' '}
          <Link to="/registro" state={location.state}>
            Crear cuenta
          </Link>
        </p>
      </AuthLayout>
    );

  const docType = personalDocuments.find((type) => type.value === form.documentType);
  const matches =
    form.password_confirmation.length > 0 && form.password === form.password_confirmation;
  return (
    <AuthLayout
      eyebrow="Comunidad y clientes SYSCON"
      title="Únete a Grupo SYSCON"
      text="Crea tu cuenta para comprar, consultar tus pedidos y contactar con nuestro equipo."
      features={signUpFeatures}
      footnote="Usa tus datos para crear y gestionar tu cuenta SYSCON."
    >
      <div className="auth-title-row">
        <div>
          <h2>Crear una cuenta</h2>
          <p className="auth-lead">Completa los datos de tu cuenta.</p>
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
        <PasswordRequirements value={form.password} matches={matches} />
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
