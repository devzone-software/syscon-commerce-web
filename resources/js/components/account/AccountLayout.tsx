import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { catalogSearchQuery } from '../../lib/catalog';
import logo from '../../../images/header/logo-grupo-syscon.jpg';
import { canUseBackoffice, displayName, initials } from '../../lib/auth';
import { useShop } from '../../state';
import {
  BoxIcon,
  CartIcon,
  CloseIcon,
  ChatIcon,
  GridIcon,
  HelpIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  StoreIcon,
} from '../icons';
import '../../../css/account.css';
import { PageMain } from '../layout/PageMain';

/**
 * Customer portal shell from Figma "Client / Mi cuenta": sidebar with the profile card and the
 * grouped navigation, a top bar with breadcrumb and search, and the legal footer.
 */
export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, count, logout } = useShop();
  const staff = canUseBackoffice(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 960px)').matches);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)');
    const resize = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? [],
      ).filter((element) => element.getClientRects().length);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== 'Tab') return;
      const elements = controls();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (location.pathname === '/cuenta/productos')
      setQuery(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.pathname, location.search]);
  const signOut = async () => {
    await logout();
    navigate('/');
  };
  const search = (event: FormEvent) => {
    event.preventDefault();
    navigate({
      pathname: '/cuenta/productos',
      search: catalogSearchQuery(
        location.pathname === '/cuenta/productos' ? location.search : '',
        query,
      ),
    });
  };

  return (
    <div className={`portal${open ? ' is-menu-open' : ''}`}>
      {open && (
        <button
          type="button"
          className="portal-menu-scrim"
          aria-label="Cerrar menú de cuenta"
          onClick={() => setOpen(false)}
          tabIndex={-1}
        />
      )}
      <aside
        ref={sidebarRef}
        id="account-menu"
        className="portal-sidebar"
        aria-label="Mi cuenta"
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        inert={mobile && !open ? true : undefined}
      >
        <div className="portal-sidebar-heading">
          <Link to="/" className="portal-brand" aria-label="Grupo SYSCON, ir al inicio">
            <img className="brand-image" src={logo} alt="" width={180} height={50} />
          </Link>
          <button
            type="button"
            className="portal-sidebar-close"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
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
              <em>{staff ? 'Compras personales' : 'Cuenta de cliente'}</em>
            </div>
          </div>
        )}
        <nav onClick={() => setOpen(false)}>
          <p>Mi cuenta</p>
          <NavLink to="/cuenta" end>
            <GridIcon size={18} /> Resumen
          </NavLink>
          <p>Pedidos</p>
          <NavLink to="/cuenta/pedidos">
            <BoxIcon size={18} /> Mis pedidos
          </NavLink>
          <NavLink to="/cuenta/carrito">
            <CartIcon size={18} /> Mi carrito
          </NavLink>
          <NavLink to="/cuenta/productos">
            <SearchIcon size={18} /> Productos
          </NavLink>
          <p>Ayuda</p>
          <NavLink to="/cuenta/soporte">
            <ChatIcon size={18} /> Ayuda y contacto
          </NavLink>
          {staff && (
            <Link to="/admin">
              <StoreIcon size={18} /> Volver a administración
            </Link>
          )}
          <button type="button" onClick={signOut}>
            <LogoutIcon size={18} /> Cerrar sesión
          </button>
        </nav>
      </aside>
      <div className="portal-main" inert={open || undefined}>
        <header className="portal-topbar">
          <button
            type="button"
            className="portal-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="account-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <MenuIcon />
          </button>
          <p className="portal-crumb">
            {staff ? 'Mis compras' : 'Mi cuenta'} <span aria-hidden="true">/</span>{' '}
            <strong>{title}</strong>
          </p>
          <form className="portal-search" role="search" onSubmit={search}>
            <SearchIcon size={16} />
            <label className="visually-hidden" htmlFor="portal-search">
              Buscar productos
            </label>
            <input
              id="portal-search"
              type="search"
              placeholder="Buscar productos..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
          <Link className="portal-store" to="/">
            <StoreIcon size={16} /> Ir a la tienda
          </Link>
          <Link
            className="portal-icon"
            to="/cuenta/carrito"
            aria-label={`Carrito con ${count} productos`}
          >
            <CartIcon size={20} />
            {count > 0 && <span className="portal-dot" />}
          </Link>
          <Link className="portal-icon" to="/cuenta/soporte" aria-label="Ayuda">
            <HelpIcon size={20} />
          </Link>
          <Link to="/" className="portal-logo" aria-label="Grupo SYSCON, ir a la tienda">
            <img className="brand-image" src={logo} alt="Grupo SYSCON" width={112} height={32} />
          </Link>
        </header>
        <PageMain className="portal-content">
          {staff && (
            <aside className="portal-context" aria-label="Área de compras personales">
              <span>
                Estás en tu cuenta de compras. Aquí aparecen únicamente tus pedidos personales.
              </span>
              <Link to="/admin">Volver al panel de trabajo</Link>
            </aside>
          )}
          {children}
        </PageMain>
        <footer className="portal-footer">
          <span>
            © {new Date().getFullYear()} Grupo SYSCON S.A.C. Todos los derechos reservados.
          </span>
          <nav aria-label="Enlaces">
            <Link to="/cuenta/soporte">Ayuda y contacto</Link>
            <Link to="/cuenta/nosotros">Nosotros</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
