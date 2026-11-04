import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../../components/layout/Header';
import { CloseIcon, ExpandIcon, MenuIcon, ShrinkIcon, SidebarIcon } from '../../components/icons';
import { can, canUseBackoffice, permissions, roleLabel, type Permission } from '../../lib/auth';
import {
  clampWidth,
  loadLayout,
  saveLayout,
  SIDEBAR_WIDTH,
  type BackofficeLayout,
} from '../../lib/backofficeLayout';
import { useShop } from '../../state';
import { Empty } from '../../ui';
import { ActivityAdmin } from './ActivityAdmin';
import { BillingAdmin } from './BillingAdmin';
import { CashRegister } from './CashRegister';
import { Dashboard } from './Dashboard';
import { DirectSale } from './DirectSale';
import { InternalUseAdmin } from './InternalUseAdmin';
import { InventoryAdmin } from './InventoryAdmin';
import { OrdersAdmin } from './OrdersAdmin';
import { PaymentsAdmin } from './PaymentsAdmin';
import { ProductBulkAdmin } from './ProductBulkAdmin';
import { ProductsAdmin } from './ProductsAdmin';
import { PurchasesAdmin } from './PurchasesAdmin';
import { ReportsAdmin } from './ReportsAdmin';
import { SalesReport } from './SalesReport';
import { SuppliersAdmin } from './SuppliersAdmin';
import { TaxonomyAdmin } from './TaxonomyAdmin';
import { UsersAdmin } from './UsersAdmin';
import '../../../css/backoffice.css';

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
    path: 'carga-masiva',
    label: 'Carga masiva',
    group: 'Catálogo',
    permission: permissions.catalogWrite,
    element: <ProductBulkAdmin />,
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
    path: 'existencias',
    label: 'Existencias',
    group: 'Inventario',
    permission: permissions.catalogWrite,
    element: <InventoryAdmin />,
  },
  {
    path: 'compras',
    label: 'Compras al por mayor',
    group: 'Inventario',
    permission: permissions.inventoryManage,
    element: <PurchasesAdmin />,
  },
  {
    path: 'uso-interno',
    label: 'Uso interno',
    group: 'Inventario',
    permission: permissions.inventoryManage,
    element: <InternalUseAdmin />,
  },
  {
    path: 'pedidos',
    label: 'Pedidos',
    group: 'Ventas',
    permission: permissions.ordersManage,
    element: <OrdersAdmin />,
  },
  {
    path: 'venta-directa',
    label: 'Venta directa',
    group: 'Ventas',
    permission: permissions.salesCreate,
    element: <DirectSale />,
  },
  {
    path: 'caja',
    label: 'Caja',
    group: 'Ventas',
    permission: permissions.cashManage,
    element: <CashRegister />,
  },
  {
    path: 'pagos',
    label: 'Pagos',
    group: 'Ventas',
    permission: permissions.paymentsConfirm,
    element: <PaymentsAdmin />,
  },
  {
    path: 'facturacion',
    label: 'Comprobantes',
    group: 'Facturación',
    permission: permissions.invoicesSubmit,
    element: <BillingAdmin />,
  },
  {
    path: 'reportes/ventas',
    label: 'Ventas y conciliación',
    group: 'Reportes',
    permission: permissions.reportsView,
    element: <SalesReport />,
  },
  {
    path: 'reportes',
    label: 'Catálogo e inventario',
    group: 'Reportes',
    element: <ReportsAdmin />,
  },
  {
    path: 'usuarios',
    label: 'Usuarios',
    group: 'Seguridad',
    permission: permissions.usersManage,
    element: <UsersAdmin />,
  },
  {
    path: 'actividad',
    label: 'Actividad del personal',
    group: 'Seguridad',
    permission: permissions.auditView,
    element: <ActivityAdmin />,
  },
];

export function Backoffice() {
  const { user, logout } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);
  const [layout, setLayout] = useState<BackofficeLayout>(loadLayout);
  const updateLayout = (next: Partial<BackofficeLayout>) =>
    setLayout((current) => {
      const merged = { ...current, ...next };
      saveLayout(merged);
      return merged;
    });
  const sidebarRef = useRef<HTMLElement>(null);
  const [resizing, setResizing] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFullscreen = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    // The browser may refuse (iframe, policy); the button then just keeps its state.
    request?.catch(() => undefined);
  };

  // Dragging the edge resizes live; the width is saved once the pointer is released.
  const widthAt = (clientX: number) =>
    clampWidth(clientX - (sidebarRef.current?.getBoundingClientRect().left ?? 0));
  const startResize = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setResizing(true);
  };
  const moveResize = (e: PointerEvent<HTMLDivElement>) => {
    if (resizing) setLayout((current) => ({ ...current, width: widthAt(e.clientX) }));
  };
  const endResize = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing) return;
    setResizing(false);
    updateLayout({ width: widthAt(e.clientX) });
  };
  const resizeWithKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -SIDEBAR_WIDTH.step,
      ArrowRight: SIDEBAR_WIDTH.step,
    };
    if (e.key === 'Home') updateLayout({ width: SIDEBAR_WIDTH.default });
    else if (steps[e.key]) updateLayout({ width: clampWidth(layout.width + steps[e.key]) });
    else return;
    e.preventDefault();
  };

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
        <button
          type="button"
          className="bo-icon-button bo-sidebar-toggle"
          aria-expanded={!layout.collapsed}
          aria-controls="bo-sidebar"
          title={layout.collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
          aria-label={layout.collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
          onClick={() => updateLayout({ collapsed: !layout.collapsed })}
        >
          <SidebarIcon />
        </button>
        <Brand />
        <span className="bo-topbar-tag">Backoffice</span>
        <div className="bo-topbar-user">
          <span>
            {user?.email}
            {user?.roles[0] && <small> · {roleLabel(user.roles[0])}</small>}
          </span>
          {document.fullscreenEnabled && (
            <button
              type="button"
              className="bo-icon-button bo-fullscreen-toggle"
              title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-pressed={fullscreen}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <ShrinkIcon /> : <ExpandIcon />}
            </button>
          )}
          <Link to="/" className="link-button">
            Ver tienda
          </Link>
          <button type="button" className="link-button" onClick={signOut}>
            Salir
          </button>
        </div>
      </header>
      <div
        className={`bo-body${layout.collapsed ? ' is-collapsed' : ''}${resizing ? ' is-resizing' : ''}`}
        style={{ '--bo-sidebar-width': `${layout.width}px` } as CSSProperties}
      >
        <nav
          ref={sidebarRef}
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
                    to={section.path ? `/admin/${section.path}` : '/admin'}
                    end
                  >
                    {section.label}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        {!layout.collapsed && (
          <div
            className="bo-sidebar-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-controls="bo-sidebar"
            aria-label="Ancho del menú lateral"
            aria-valuemin={SIDEBAR_WIDTH.min}
            aria-valuemax={SIDEBAR_WIDTH.max}
            aria-valuenow={layout.width}
            title="Arrastra para cambiar el ancho · doble clic para restablecer"
            tabIndex={0}
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onDoubleClick={() => updateLayout({ width: SIDEBAR_WIDTH.default })}
            onKeyDown={resizeWithKeys}
          />
        )}
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
