import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { money, useShop } from './state';
import type { Product } from './types';
import { ProductImage } from './components/ProductImage';
import { CartIcon } from './components/icons';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';

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
  const available = product.stock > 0;
  return (
    <article className="card-product">
      <Link
        to={`/producto/${product.id}`}
        className="card-product-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage product={product} />
      </Link>
      <div className="card-product-body">
        {product.brand && <span className="card-product-brand">{product.brand}</span>}
        <Link className="card-product-title" to={`/producto/${product.id}`}>
          {product.name}
        </Link>
        <span className="card-product-meta">
          {product.category ? `${product.category} · ` : ''}SKU {product.sku}
        </span>
        <div className="card-product-footer">
          <div>
            <strong className="card-product-price">{money(Number(product.price))}</strong>
            <span className={`card-product-stock${available ? '' : ' out'}`}>
              {available ? 'Disponible' : 'Sin stock'}
            </span>
          </div>
          <button
            type="button"
            className="card-product-add"
            onClick={() => add(product)}
            disabled={product.stock < 1}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <CartIcon />
          </button>
        </div>
      </div>
    </article>
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
