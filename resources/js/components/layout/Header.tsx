import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../../state';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo', end: false },
  { to: '/nosotros', label: 'Nosotros', end: false },
];

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="SYSCON Commerce, ir al inicio">
      <span className="brand-icon" aria-hidden="true">
        S
      </span>
      <span>
        SYSCON<small>COMMERCE</small>
      </span>
    </Link>
  );
}

export function Header() {
  const { user, count, logout } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;

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
      <div className="container store-header-bar">
        <Brand />
        <nav className="store-nav" aria-label="Navegación principal">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/#categorias">Categorías</Link>
        </nav>
        <form className="store-search" role="search" onSubmit={search}>
          <label className="visually-hidden" htmlFor="store-search-input">
            Buscar productos
          </label>
          <input
            id="store-search-input"
            type="search"
            placeholder="Buscar por producto, marca o SKU"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" aria-label="Buscar">
            <SearchIcon />
          </button>
        </form>
        <div className="store-actions">
          {user ? (
            <>
              <Link to="/cuenta" className="store-action store-action-text">
                <UserIcon />
                <span>Mi cuenta</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="store-action store-action-text">
                  Admin
                </Link>
              )}
              <button className="store-action store-action-text" onClick={signOut}>
                Salir
              </button>
            </>
          ) : (
            <Link to="/ingresar" className="store-action store-action-text">
              <UserIcon />
              <span>Ingresar</span>
            </Link>
          )}
          <Link
            to="/carrito"
            className="store-action store-cart"
            aria-label={`Carrito con ${count} productos`}
          >
            <CartIcon size={22} />
            <span className="store-cart-count">{count}</span>
          </Link>
          <button
            type="button"
            className="store-action menu-toggle"
            aria-expanded={open}
            aria-controls="store-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <div id="store-menu" className="store-menu" hidden={!open}>
        <nav className="container" aria-label="Menú">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/#categorias">Categorías</Link>
          <hr />
          {user ? (
            <>
              <NavLink to="/cuenta" end>
                Mi cuenta
              </NavLink>
              <NavLink to="/cuenta/pedidos">Mis pedidos</NavLink>
              {isAdmin && <NavLink to="/admin">Admin</NavLink>}
              <button type="button" onClick={signOut}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/ingresar">Ingresar</NavLink>
              <NavLink to="/registro">Crear cuenta</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
