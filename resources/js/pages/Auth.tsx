import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useShop } from '../state';
import { ErrorBox } from '../ui';

export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const { reloadUser } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (register) await api.register(email, password);
      await api.login(email, password);
      await reloadUser();
      navigate('/cuenta');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <span className="eyebrow accent">BIENVENIDO A SYSCON</span>
        <h1>{register ? 'Crea tu cuenta' : 'Ingresa a tu cuenta'}</h1>
        <p>
          {register
            ? 'Compra y consulta tus pedidos desde un solo lugar.'
            : 'Accede a tus pedidos y continúa tus compras.'}
        </p>
        <form onSubmit={submit}>
          {error && <ErrorBox message={error} />}
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={register ? 12 : undefined}
              required
              autoComplete={register ? 'new-password' : 'current-password'}
            />
          </label>
          {register && <small>Usa al menos 12 caracteres.</small>}
          <button className="button button-primary full" disabled={busy}>
            {busy ? 'Procesando…' : register ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-switch">
          {register ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <Link to={register ? '/ingresar' : '/registro'}>
            {register ? 'Ingresa aquí' : 'Regístrate'}
          </Link>
        </p>
      </div>
      <div className="auth-art">
        <span>SYSCON COMMERCE</span>
        <strong>
          La tecnología
          <br />
          que mueve
          <br />
          tu negocio.
        </strong>
        <div>◇ &nbsp; Explora. Compra. Avanza.</div>
      </div>
    </div>
  );
}
