import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../../state';
import { canUseBackoffice } from '../../lib/auth';
import { UserIcon } from '../icons';

export function AccountMenu() {
  const { user, logout } = useShop();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [location.key]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div
      className="store-account-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="store-account-trigger"
        aria-label="Mi cuenta"
        aria-expanded={open}
        aria-controls="store-account-panel"
        onClick={() => setOpen(!open)}
      >
        <UserIcon size={23} />
        <span>Cuenta</span>
      </button>
      {open && (
        <nav
          id="store-account-panel"
          className="store-account-panel"
          aria-label="Opciones de cuenta"
        >
          <strong>{user ? 'Mi cuenta' : 'Bienvenido a SYSCON'}</strong>
          {user ? (
            <>
              <small>{user.email}</small>
              {canUseBackoffice(user) && (
                <Link className="account-main-link" to="/admin">
                  Administración
                </Link>
              )}
              <Link to="/cuenta">
                {canUseBackoffice(user) ? 'Mis compras personales' : 'Mi cuenta'}
              </Link>
              <Link to="/cuenta/pedidos">Mis pedidos</Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setOpen(false);
                  navigate('/');
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link className="account-main-link" to="/ingresar">
                Iniciar sesión
              </Link>
              <Link to="/registro">Crear cuenta</Link>
              <Link to="/cuenta/pedidos">Mis pedidos</Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
