import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import badgeIcon from '../../../images/header/badge-check.svg';
import cartIcon from '../../../images/header/cart.svg';
import logo from '../../../images/header/logo-grupo-syscon.jpg';
import mailIcon from '../../../images/header/mail.svg';
import phoneIcon from '../../../images/header/phone.svg';
import searchIcon from '../../../images/header/search.svg';
import truckIcon from '../../../images/header/truck.svg';
import { cartTotal } from '../../lib/cart';
import { canUseBackoffice } from '../../lib/auth';
import { money, useShop } from '../../state';
import { CloseIcon, MenuIcon } from '../icons';

/** Company contact data shown in the top bar and the footer. */
export const company = {
  phone: '(01) 748-2900',
  phoneHref: 'tel:+5117482900',
  email: 'contacto@gruposyscon.pe',
};

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Grupo SYSCON Tecnología Informática, ir al inicio">
      <img src={logo} alt="" width={158} height={44} />
    </Link>
  );
}

const mainLinks = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Productos' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/ofertas', label: 'Ofertas' },
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
    const value = query.trim();
    navigate(value ? `/catalogo?q=${encodeURIComponent(value)}` : '/catalogo');
  };
  const signOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="store-header">
      <div className="store-topbar">
        <div className="container store-topbar-row">
          <ul className="store-topbar-list">
            <li>
              <img src={truckIcon} alt="" />
              Envíos inmediatos a todo el país
            </li>
            <li>
              <img src={badgeIcon} alt="" />
              Licencias 100% Originales &amp; Soporte Certificado
            </li>
          </ul>
          <ul className="store-topbar-list">
            <li>
              <img src={phoneIcon} alt="" />
              <a href={company.phoneHref}>{company.phone}</a>
            </li>
            <li>
              <img src={mailIcon} alt="" />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="store-mainbar">
        <div className="container store-mainbar-row">
          <Brand />
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
                  <Link to="/cuenta">Mi cuenta</Link>
                  <Link to="/cuenta/pedidos">Mis compras</Link>
                  {staff && <Link to="/admin">Backoffice</Link>}
                  <button type="button" onClick={signOut}>
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link to="/registro">Crea tu cuenta</Link>
                  <Link to="/ingresar">Ingresa</Link>
                  <Link to="/cuenta/pedidos">Mis compras</Link>
                </>
              )}
            </nav>
            <Link
              to="/carrito"
              className="store-cart"
              aria-label={`Carrito con ${count} productos`}
            >
              <span className="store-cart-icon">
                <img src={cartIcon} alt="" />
                <span className="store-badge">{count}</span>
              </span>
              <span className="store-cart-text">
                <small>Carrito</small>
                <strong>{money(cartTotal(cart))}</strong>
              </span>
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
            {mainLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div id="store-menu" className="store-menu" hidden={!open}>
        <nav className="container" aria-label="Menú">
          <div className="store-menu-main">
            {mainLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="store-menu-account">
            {user ? (
              <>
                <span className="store-menu-user">{user.email}</span>
                <NavLink to="/cuenta" end>
                  Mi cuenta
                </NavLink>
                <NavLink to="/cuenta/pedidos">Mis compras</NavLink>
                {staff && <NavLink to="/admin">Backoffice</NavLink>}
                <button type="button" onClick={signOut}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/ingresar">Iniciar sesión</NavLink>
                <NavLink to="/registro">Crear cuenta</NavLink>
                <NavLink to="/cuenta/pedidos">Mis compras</NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
