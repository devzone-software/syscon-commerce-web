import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import cartIcon from '../../../images/header/cart.svg';
import logo from '../../../images/header/logo-grupo-syscon.jpg';
import wordmark from '../../../images/header/logo-syscon-palabra.png';
import searchIcon from '../../../images/header/search.svg';
import { cartTotal } from '../../lib/cart';
import { catalogSearchQuery } from '../../lib/catalog';
import { canUseBackoffice, initials } from '../../lib/auth';
import { AccountMenu, fullName } from './AccountMenu';
import { money, useShop } from '../../state';
import { CloseIcon, MenuIcon } from '../icons';
import { CategoryMenu } from './CategoryMenu';

/** Company contact data shown in the footer and the contact page. */
export const company = {
  city: 'Juliaca, Puno, Perú',
  phone: '(01) 748-2900',
  phoneHref: 'tel:+5117482900',
  email: 'contacto@gruposyscon.pe',
  salesEmail: 'ventas@gruposyscon.pe',
  whatsappLabel: '+51 987 654 321',
  whatsappHref: 'https://wa.me/51987654321',
};

/**
 * The SYSCON logo linking home. `clear` is the version for the brand-blue header: the
 * SYSCON wordmark as an image and its small lines as real text, so they stay legible.
 */
export function Brand({ clear = false }: { clear?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand${clear ? ' is-clear' : ''}`}
      aria-label="Grupo SYSCON Tecnología Informática, ir al inicio"
      title="Ir al inicio"
    >
      {clear ? (
        <span className="brand-lockup" aria-hidden="true">
          <small className="brand-lockup-top">GRUPO</small>
          <img src={wordmark} alt="" width={200} height={40} />
          <small className="brand-lockup-bottom">
            TECNOLOGÍA <b>INFORMÁTICA</b>
          </small>
        </span>
      ) : (
        <img className="brand-image" src={logo} alt="" width={158} height={44} />
      )}
    </Link>
  );
}

const mainLinks = [
  { to: '/catalogo', label: 'Productos' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

export function Header() {
  const { user, cart, count, logout } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const staff = canUseBackoffice(user);

  useEffect(() => {
    setOpen(false);
    if (location.pathname === '/catalogo')
      setQuery(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    navigate({
      pathname: '/catalogo',
      search: catalogSearchQuery(location.pathname === '/catalogo' ? location.search : '', query),
    });
  };
  // Leave at once for the home page (a protected page would otherwise jump to the sign-in
  // form), then close the session.
  const signOut = async () => {
    setOpen(false);
    navigate('/', { replace: true });
    window.scrollTo({ top: 0 });
    await logout();
  };

  return (
    <header className="store-header">
      <div className="store-mainbar">
        <div className="container store-mainbar-row">
          <Brand clear />
          <form className="store-search" role="search" onSubmit={search}>
            <img src={searchIcon} alt="" />
            <label className="visually-hidden" htmlFor="store-search-input">
              Buscar productos
            </label>
            <input
              id="store-search-input"
              type="search"
              placeholder="Buscar productos, marcas o categorías..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>
          <div className="store-actions">
            <nav className="store-account" aria-label="Cuenta">
              {user ? (
                <>
                  <AccountMenu user={user} onSignOut={() => void signOut()} />
                  <Link to="/cuenta/pedidos">Mis compras</Link>
                </>
              ) : (
                <>
                  <Link to="/registro">Crea tu cuenta</Link>
                  <Link to="/ingresar">Ingresa</Link>
                  <Link to="/cuenta/pedidos">Mis pedidos</Link>
                </>
              )}
            </nav>
            <Link
              to="/carrito"
              className="store-cart"
              aria-label={
                count ? `Carrito con ${count} ${count === 1 ? 'producto' : 'productos'}` : 'Carrito'
              }
            >
              <span className="store-cart-icon">
                <img src={cartIcon} alt="" />
                {count > 0 && <span className="store-badge">{count}</span>}
              </span>
              {count > 0 && (
                <span className="store-cart-text">
                  <small>Carrito</small>
                  <strong>{money(cartTotal(cart))}</strong>
                </span>
              )}
            </Link>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="store-menu"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>
      <div className="store-navbar">
        <div className="container store-navbar-row">
          <nav className="store-nav" aria-label="Navegación principal">
            {mainLinks.map((link) =>
              link.to === '/categorias' ? (
                <CategoryMenu key={link.to} />
              ) : (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>
        </div>
      </div>
      <div id="store-menu" className="store-menu" hidden={!open}>
        <nav className="container" aria-label="Menú">
          <div className="store-menu-main">
            {mainLinks.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="store-menu-account">
            {user ? (
              <>
                <span className="store-menu-user">
                  <span className="account-avatar" aria-hidden="true">
                    {initials(user)}
                  </span>
                  <span>
                    <strong>{fullName(user)}</strong>
                    <small>{user.email}</small>
                  </span>
                </span>
                <NavLink to="/cuenta/pedidos">Compras</NavLink>
                <Link to="/contacto#preguntas">Preguntas</Link>
                <NavLink to="/contacto">Ayuda</NavLink>
                {staff && <NavLink to="/admin">Panel de administración</NavLink>}
                <button type="button" onClick={() => void signOut()}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/ingresar">Iniciar sesión</NavLink>
                <NavLink to="/registro">Crear cuenta</NavLink>
                <NavLink to="/cuenta/pedidos">Mis pedidos</NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
