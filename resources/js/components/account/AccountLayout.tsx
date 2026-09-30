import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { canUseBackoffice } from '../../lib/auth';
import { useShop } from '../../state';

export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useShop();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate('/');
  };
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow accent">MI CUENTA</span>
        <h1>{title}</h1>
      </div>
      <div className="account-layout">
        <nav className="account-nav" aria-label="Mi cuenta">
          <NavLink to="/cuenta" end>
            Resumen
          </NavLink>
          <NavLink to="/cuenta/pedidos">Mis pedidos</NavLink>
          {canUseBackoffice(user) && <Link to="/admin">Backoffice</Link>}
          <button type="button" onClick={signOut}>
            Cerrar sesión
          </button>
        </nav>
        <div className="account-content">{children}</div>
      </div>
    </div>
  );
}
