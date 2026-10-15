import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import profile from '../../../images/header/profile-sc.jpg';
import { canUseBackoffice, displayName, initials, roleLabel } from '../../lib/auth';
import { useShop } from '../../state';
import {
  BoxIcon,
  CartIcon,
  ChatIcon,
  GridIcon,
  HelpIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
} from '../icons';

/**
 * Customer portal shell from Figma "Client / Mi cuenta": sidebar with the profile card and the
 * grouped navigation, a top bar with breadcrumb and search, and the legal footer.
 */
export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, count, logout } = useShop();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const signOut = async () => {
    await logout();
    navigate('/');
  };
  const search = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/catalogo?q=${encodeURIComponent(value)}` : '/catalogo');
  };

  return (
    <div className={`portal${open ? ' is-menu-open' : ''}`}>
      <aside className="portal-sidebar" aria-label="Mi cuenta">
        <Link to="/" className="portal-brand">
          <span className="portal-brand-mark">S</span>
          <span>
            SYSCON<small>PORTAL B2B</small>
          </span>
        </Link>
        {user && (
          <div className="portal-user">
            <span className="portal-avatar" aria-hidden="true">
              {initials(user)}
            </span>
            <div>
              <strong>
                {displayName(user)} <ShieldIcon size={14} />
              </strong>
              <span>{user.email}</span>
              <em>{user.roles.map(roleLabel).join(' / ') || 'Cliente'}</em>
            </div>
          </div>
        )}
        <nav onClick={() => setOpen(false)}>
          <p>Mi cuenta</p>
          <NavLink to="/cuenta" end>
            <GridIcon size={18} /> Dashboard / Resumen
          </NavLink>
          <p>Pedidos</p>
          <NavLink to="/cuenta/pedidos">
            <BoxIcon size={18} /> Mis pedidos
          </NavLink>
          <Link to="/carrito">
            <CartIcon size={18} /> Mi carrito
          </Link>
          <Link to="/ofertas">
            <TruckIcon size={18} /> Ofertas vigentes
          </Link>
          <p>Beneficios y ayuda</p>
          <Link to="/contacto">
            <ChatIcon size={18} /> Soporte y contacto
          </Link>
          <Link to="/nosotros">
            <HelpIcon size={18} /> Sobre SYSCON
          </Link>
          {canUseBackoffice(user) && (
            <Link to="/admin">
              <StoreIcon size={18} /> Backoffice
            </Link>
          )}
          <button type="button" onClick={signOut}>
            <LogoutIcon size={18} /> Cerrar sesión
          </button>
        </nav>
      </aside>
      <div className="portal-main">
        <header className="portal-topbar">
          <button
            type="button"
            className="portal-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <MenuIcon />
          </button>
          <p className="portal-crumb">
            Mi Cuenta <span aria-hidden="true">/</span> <strong>{title}</strong>
          </p>
          <form className="portal-search" role="search" onSubmit={search}>
            <SearchIcon size={16} />
            <label className="visually-hidden" htmlFor="portal-search">
              Buscar productos
            </label>
            <input
              id="portal-search"
              type="search"
              placeholder="Buscar productos o ayuda..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
          <Link className="portal-store" to="/">
            <StoreIcon size={16} /> Ir a la tienda
          </Link>
          <Link className="portal-icon" to="/carrito" aria-label={`Carrito con ${count} productos`}>
            <CartIcon size={20} />
            {count > 0 && <span className="portal-dot" />}
          </Link>
          <Link className="portal-icon" to="/contacto" aria-label="Ayuda">
            <HelpIcon size={20} />
          </Link>
          <img className="portal-logo" src={profile} alt="" />
        </header>
        <main className="portal-content">{children}</main>
        <footer className="portal-footer">
          <span>
            © {new Date().getFullYear()} Grupo SYSCON S.A.C. Todos los derechos reservados.
          </span>
          <nav aria-label="Enlaces">
            <Link to="/contacto">Centro de ayuda</Link>
            <Link to="/nosotros">Nosotros</Link>
            <Link to="/contacto">Contacto</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
