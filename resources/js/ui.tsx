import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { money, useShop } from './state';
import { useConfirmAdd } from './components/cart/AddToCartDialog';
import type { Product } from './types';
import cartAddIcon from '../images/home/cart-add.svg';
import { ProductImage } from './components/ProductImage';
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
/**
 * Product card from the Figma home: image with availability, category, name, price and the
 * "Ver producto" / "Agregar" actions. `compact` is the smaller variant of the catalog grid.
 */
export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const add = useConfirmAdd();
  const available = product.stock > 0;
  const details = [product.brand, `SKU ${product.sku}`].filter(Boolean).join(' · ');
  const url = `/producto/${product.id}`;
  return (
    <article className={`card-product${compact ? ' is-compact' : ''}`}>
      <Link to={url} className="card-product-media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
        <span className={`card-product-stock${available ? '' : ' out'}`}>
          {available ? 'DISPONIBLE' : 'SIN STOCK'}
        </span>
      </Link>
      {product.category && <span className="card-product-category">{product.category}</span>}
      <Link className="card-product-title" to={url}>
        {product.name}
      </Link>
      <span className="card-product-meta">{details}</span>
      <strong className="card-product-price">{money(Number(product.price))}</strong>
      <div className="card-product-actions">
        <Link className="card-product-view" to={url}>
          {compact ? 'Ver' : 'Ver producto'}
        </Link>
        <button
          type="button"
          className="card-product-add"
          onClick={() => add(product)}
          disabled={!available}
          aria-label={`Agregar ${product.name} al carrito`}
        >
          <img src={cartAddIcon} alt="" />
          Agregar
        </button>
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
    <Navigate to="/ingresar" replace state={{ from: location.pathname + location.search }} />
  );
}
