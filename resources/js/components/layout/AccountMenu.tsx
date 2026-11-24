import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { canUseBackoffice, displayName, initials, roleLabel } from '../../lib/auth';
import type { User } from '../../types';

/** Full name when the account has one, otherwise the short name taken from the e-mail. */
export const fullName = (user: User) =>
  [user.firstName, user.lastName].filter((part) => part?.trim()).join(' ') || displayName(user);

/**
 * Signed-in visitor in the store header: initials and first name that open a menu with the
 * account, purchases, help and "Salir".
 */
export function AccountMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const staff = canUseBackoffice(user);

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={box}>
      <button
        type="button"
        className="account-menu-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar" aria-hidden="true">
          {initials(user)}
        </span>
        <span className="account-menu-name">{displayName(user)}</span>
        <svg
          className="account-menu-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="account-menu-panel" id="account-menu-panel">
          {/* The identity block itself opens the account page. */}
          <Link to="/cuenta" className="account-menu-head" title="Ir a mi cuenta">
            <span className="account-avatar is-large" aria-hidden="true">
              {initials(user)}
            </span>
            <span>
              <strong>{fullName(user)}</strong>
              <small>{user.email}</small>
              {staff && user.roles[0] && <em>{roleLabel(user.roles[0])}</em>}
            </span>
          </Link>
          <nav aria-label="Tu cuenta">
            <div className="account-menu-group">
              <Link to="/cuenta/pedidos">Compras</Link>
              <Link to="/contacto#preguntas">Preguntas</Link>
              <Link to="/contacto">Ayuda</Link>
            </div>
            {/* Staff only: their way back to the backoffice from the store. */}
            {staff && (
              <div className="account-menu-group">
                <Link to="/admin">
                  Panel de administración <span className="account-menu-tag">Personal</span>
                </Link>
              </div>
            )}
            <div className="account-menu-group">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
              >
                Salir
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
