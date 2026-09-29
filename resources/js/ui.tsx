import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { money, useShop } from './state';
import type { Product } from './types';
import { ProductImage } from './components/ProductImage';

export function useData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    load()
      .then((value) => {
        if (live) setData(value);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [...deps, retry]);
  return { data, error, loading, reload: () => setRetry((n) => n + 1) };
}
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      {message}{' '}
      {retry && (
        <button className="link-button" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      Cargando…
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-mark">◇</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function ProductCard({ product }: { product: Product }) {
  const { add } = useShop();
  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-image">
        <ProductImage product={product} />
      </Link>
      <div className="product-copy">
        <span className="eyebrow">
          {product.category || 'Tecnología'} · {product.brand || 'SYSCON'}
        </span>
        <Link className="product-title" to={`/producto/${product.id}`}>
          {product.name}
        </Link>
        <p className="muted">SKU {product.sku}</p>
        <div className="product-bottom">
          <strong>{money(Number(product.price))}</strong>
          <button
            className="round-button"
            onClick={() => add(product)}
            disabled={product.stock < 1}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {product.stock > 0 ? '+' : '—'}
          </button>
        </div>
      </div>
    </article>
  );
}
export function Header() {
  const { user, count, logout } = useShop();
  const navigate = useNavigate();
  return (
    <>
      <div className="announcement">
        Soluciones de tecnología para tu negocio <span>·</span> Compra segura en SYSCON
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-icon">S</span>
            <span>
              SYSCON<small>COMMERCE</small>
            </span>
          </Link>
          <nav className="desktop-nav">
            <NavLink to="/catalogo">Catálogo</NavLink>
            <NavLink to="/catalogo?categoria=Tecnología">Categorías</NavLink>
            <NavLink to="/nosotros">Nosotros</NavLink>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/cuenta" className="text-action">
                  Mi cuenta
                </Link>
                {user.roles.includes('ROLE_ADMIN') && (
                  <Link to="/admin" className="text-action">
                    Admin
                  </Link>
                )}
                <button
                  className="text-action"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <Link className="text-action" to="/ingresar">
                Ingresar
              </Link>
            )}
            <Link className="cart-link" to="/carrito" aria-label={`Carrito con ${count} productos`}>
              ▣ <span>{count}</span>
            </Link>
          </div>
        </div>
      </header>
      <nav className="mobile-nav">
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/catalogo">Catálogo</NavLink>
        <NavLink to="/carrito">Carrito</NavLink>
        {user?.roles.includes('ROLE_ADMIN') ? (
          <NavLink to="/admin">Admin</NavLink>
        ) : (
          <NavLink to="/cuenta">Cuenta</NavLink>
        )}
      </nav>
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-icon">S</span>
            <span>
              SYSCON<small>COMMERCE</small>
            </span>
          </div>
          <p>Tecnología que impulsa tus proyectos.</p>
        </div>
        <div>
          <strong>Explora</strong>
          <Link to="/catalogo">Productos</Link>
          <Link to="/nosotros">Nosotros</Link>
        </div>
        <div>
          <strong>Tu cuenta</strong>
          <Link to="/cuenta">Perfil y pedidos</Link>
          <Link to="/carrito">Carrito</Link>
        </div>
        <div>
          <strong>Atención</strong>
          <p>Consulta la disponibilidad y el estado de tus pedidos desde tu cuenta.</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} SYSCON Commerce</div>
    </footer>
  );
}
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loadingUser } = useShop();
  if (loadingUser)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  return user ? children : <Navigate to="/ingresar" replace />;
}
