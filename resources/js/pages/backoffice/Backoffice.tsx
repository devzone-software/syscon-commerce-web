import { useEffect, useState, type ReactElement } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../../components/layout/Header';
import { CloseIcon, MenuIcon } from '../../components/icons';
import { can, canUseBackoffice, permissions, type Permission } from '../../lib/auth';
import { useShop } from '../../state';
import { Empty } from '../../ui';
import { Dashboard } from './Dashboard';
import { OrdersAdmin } from './OrdersAdmin';
import { PaymentsAdmin } from './PaymentsAdmin';
import { ProductsAdmin } from './ProductsAdmin';
import { SuppliersAdmin } from './SuppliersAdmin';
import { TaxonomyAdmin } from './TaxonomyAdmin';

type Section = {
  path: string;
  label: string;
  group: string;
  permission?: Permission;
  element: ReactElement;
};

/** Only sections backed by existing APIs are listed; see docs/API-NECESARIAS.md. */
const sections: Section[] = [
  { path: '', label: 'Panel', group: 'General', element: <Dashboard /> },
  {
    path: 'productos',
    label: 'Productos',
    group: 'Catálogo',
    permission: permissions.catalogWrite,
    element: <ProductsAdmin />,
  },
  {
    path: 'categorias',
    label: 'Categorías y marcas',
    group: 'Catálogo',
    permission: permissions.catalogWrite,
    element: <TaxonomyAdmin />,
  },
  {
    path: 'proveedores',
    label: 'Proveedores',
    group: 'Catálogo',
    permission: permissions.suppliersManage,
    element: <SuppliersAdmin />,
  },
  {
    path: 'pedidos',
    label: 'Pedidos',
    group: 'Ventas',
    permission: permissions.ordersManage,
    element: <OrdersAdmin />,
  },
  {
    path: 'pagos',
    label: 'Pagos',
    group: 'Ventas',
    permission: permissions.paymentsConfirm,
    element: <PaymentsAdmin />,
  },
];

export function Backoffice() {
  const { user, logout } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  if (!canUseBackoffice(user))
    return (
      <div className="container page">
        <Empty
          title="Acceso restringido"
          text="Tu cuenta no tiene permisos para el backoffice."
          action={
            <Link className="button button-primary" to="/">
              Volver a la tienda
            </Link>
          }
        />
      </div>
    );

  const allowed = sections.filter(
    (section) => !section.permission || can(user, section.permission),
  );
  const groups = [...new Set(allowed.map((section) => section.group))];
  const signOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="bo-shell">
      <header className="bo-topbar">
        <button
          type="button"
          className="bo-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="bo-sidebar"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Brand />
        <span className="bo-topbar-tag">Backoffice</span>
        <div className="bo-topbar-user">
          <span>{user?.email}</span>
          <Link to="/" className="link-button">
            Ver tienda
          </Link>
          <button type="button" className="link-button" onClick={signOut}>
            Salir
          </button>
        </div>
      </header>
      <div className="bo-body">
        <nav
          id="bo-sidebar"
          className={`bo-sidebar${menuOpen ? ' is-open' : ''}`}
          aria-label="Backoffice"
        >
          {groups.map((group) => (
            <div key={group} className="bo-nav-group">
              <span>{group}</span>
              {allowed
                .filter((section) => section.group === group)
                .map((section) => (
                  <NavLink
                    key={section.path}
                    to={`/admin/${section.path}`}
                    end={section.path === ''}
                  >
                    {section.label}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <main className="bo-main">
          <Routes>
            {allowed.map((section) => (
              <Route
                key={section.path}
                index={section.path === ''}
                path={section.path || undefined}
                element={section.element}
              />
            ))}
            <Route
              path="*"
              element={
                <Empty
                  title="Sección no disponible"
                  text="La sección no existe o tu cuenta no tiene permiso para verla."
                  action={
                    <Link className="button button-primary" to="/admin">
                      Ir al panel
                    </Link>
                  }
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
