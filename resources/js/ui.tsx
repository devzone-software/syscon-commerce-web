import { CatalogCard } from './components/catalog/CatalogCard';
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useShop } from './state';
import type { Product } from './types';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { PageMain } from './components/layout/PageMain';

export function useData<T>(
  load: () => Promise<T>,
  deps: unknown[] = [],
  options: { keepPreviousData?: boolean } = {},
) {
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
  return {
    data,
    error,
    loading: loading && (!options.keepPreviousData || data === null),
    refreshing: loading && Boolean(options.keepPreviousData) && data !== null,
    reload: () => setRetry((n) => n + 1),
  };
}
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      {message}{' '}
      {retry && (
        <button type="button" className="link-button" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span>Cargando…</span>
      <div className="loading-skeleton" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
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
/**
 * Product card from the Figma home: image with availability, category, name, price and the
 * "Ver producto" / "Agregar" actions. `compact` is the smaller variant of the catalog grid.
 */
export function ProductCard({ product }: { product: Product; compact?: boolean }) {
  return <CatalogCard product={product} />;
}
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <PageMain>{children}</PageMain>
      <Footer />
    </>
  );
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loadingUser } = useShop();
  const location = useLocation();
  if (loadingUser)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  return user ? (
    children
  ) : (
    <Navigate
      to="/ingresar"
      replace
      state={{
        from: location.pathname + location.search,
        cartPath: (location.state as { cartPath?: unknown } | null)?.cartPath,
      }}
    />
  );
}
