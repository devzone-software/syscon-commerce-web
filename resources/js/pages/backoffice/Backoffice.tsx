import { AccessOverview } from '../../components/backoffice/AccessOverview';
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
import { PageMain } from '../../components/layout/PageMain';
import {
  ActivityIcon,
  BookIcon,
  BoxIcon,
  BuildingIcon,
  CardIcon,
  CartIcon,
  CashIcon,
  ChartIcon,
  ClipboardIcon,
  CloseIcon,
  ExpandIcon,
  HomeIcon,
  KeyIcon,
  PercentIcon,
  LayersIcon,
  LogoutIcon,
  MenuIcon,
  ReceiptIcon,
  ShrinkIcon,
  SidebarIcon,
  StoreIcon,
  TagIcon,
  TrendIcon,
  TruckIcon,
  UsersIcon,
  BoltIcon,
} from '../../components/icons';
import { can, canUseBackoffice, displayName, initials, roleLabel } from '../../lib/auth';
import {
  clampWidth,
  loadLayout,
  saveLayout,
  SIDEBAR_WIDTH,
  type BackofficeLayout,
} from '../../lib/backofficeLayout';
import { useShop } from '../../state';
import { Empty } from '../../ui';
import { sections } from './sections';
import '../../../css/backoffice.css';

/** One icon per menu entry, keyed by the section path. */
const sectionIcons: Record<string, ReactElement> = {
  '': <HomeIcon size={18} />,
  productos: <BoxIcon size={18} />,
  categorias: <TagIcon size={18} />,
  precios: <PercentIcon size={18} />,
  proveedores: <BuildingIcon size={18} />,
  existencias: <LayersIcon size={18} />,
  compras: <TruckIcon size={18} />,
  'uso-interno': <ClipboardIcon size={18} />,
  pedidos: <CartIcon size={18} />,
  'venta-directa': <BoltIcon size={18} />,
  caja: <CashIcon size={18} />,
  pagos: <CardIcon size={18} />,
  reclamaciones: <BookIcon size={18} />,
  facturacion: <ReceiptIcon size={18} />,
  'reportes/ventas': <TrendIcon size={18} />,
  reportes: <ChartIcon size={18} />,
  usuarios: <UsersIcon size={18} />,
  actividad: <ActivityIcon size={18} />,
};

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
          text="Tu cuenta no tiene permisos para la administración."
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
  const requestedSection = sections.find(
    (section) => `/admin/${section.path}` === location.pathname,
  );
  const navigation = allowed.filter((section) => !section.parent);
  const currentSection = allowed.find((section) => `/admin/${section.path}` === location.pathname);
  const groups = [...new Set(navigation.map((section) => section.group))];
  // Home first: /admin needs a session, so closing it first would jump to the sign-in page.
  const signOut = async () => {
    navigate('/', { replace: true });
    window.scrollTo({ top: 0 });
    await logout();
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
        <span className="bo-topbar-tag">Panel de administración</span>
        <div className="bo-topbar-user">
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
          <Link to="/" className="bo-top-link" title="Ver tienda">
            <StoreIcon size={18} /> <span>Ver tienda</span>
          </Link>
          <Link to="/cuenta" className="bo-top-link" title="Mis compras personales">
            <CartIcon size={18} /> <span>Mis compras</span>
          </Link>
          {user && (
            <span className="bo-user-chip" title={user.email}>
              <span className="bo-avatar" aria-hidden="true">
                {initials(user)}
              </span>
              <span className="bo-user-text">
                <strong>{displayName(user)}</strong>
                <small>{user.roles[0] ? roleLabel(user.roles[0]) : user.email}</small>
              </span>
            </span>
          )}
          <button type="button" className="bo-top-link is-exit" onClick={signOut} title="Salir">
            <LogoutIcon size={18} /> <span>Salir</span>
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
          aria-label="Administración"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a')) setMenuOpen(false);
          }}
        >
          {groups.map((group) => (
            <div key={group} className="bo-nav-group">
              <span>{group}</span>
              {navigation
                .filter((section) => section.group === group)
                .map((section) => (
                  <NavLink
                    key={section.path}
                    to={section.path ? `/admin/${section.path}` : '/admin'}
                    end
                    className={({ isActive }) =>
                      isActive || currentSection?.parent === section.path ? 'active' : undefined
                    }
                  >
                    <span className="bo-nav-icon">
                      {sectionIcons[section.path] ?? <HomeIcon size={18} />}
                    </span>
                    <span className="bo-nav-label">{section.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
          <div className="bo-nav-group">
            <span>Tu cuenta</span>
            <NavLink to="/admin/mi-acceso" end>
              <span className="bo-nav-icon">
                <KeyIcon size={18} />
              </span>
              <span className="bo-nav-label">Mi acceso</span>
            </NavLink>
          </div>
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
        <PageMain className="bo-main">
          <Routes>
            <Route path="mi-acceso" element={<AccessOverview sections={allowed} />} />
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
                  title={
                    requestedSection
                      ? `Acceso no habilitado: ${requestedSection.label}`
                      : 'Sección no disponible'
                  }
                  text={
                    requestedSection
                      ? 'Esta tarea no está habilitada para tu cuenta. Si la necesitas para tu trabajo, consulta a la administración de SYSCON.'
                      : 'No encontramos esta sección. Puedes continuar desde el panel.'
                  }
                  action={
                    <Link className="button button-primary" to="/admin">
                      Ir al panel
                    </Link>
                  }
                />
              }
            />
          </Routes>
        </PageMain>
      </div>
    </div>
  );
}
