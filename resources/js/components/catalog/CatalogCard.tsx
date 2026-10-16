import { Link } from 'react-router-dom';
import cartIcon from '../../../images/catalog/cart.svg';
import { money } from '../../state';
import { useConfirmAdd } from '../cart/AddToCartDialog';
import type { Product } from '../../types';
import { ProductImage } from '../ProductImage';
import '../../../css/products.css';

/** Stock at or below this level shows the red "últimas unidades" state from Figma. */
export const LOW_STOCK = 5;

/** Product card of Figma "Client / Productos" (3-column catalog grid). */
export function CatalogCard({ product }: { product: Product }) {
  const add = useConfirmAdd();
  const url = `/producto/${product.id}`;
  const out = product.stock < 1;
  const low = !out && product.stock <= LOW_STOCK;
  const origin = [product.category, product.brand].filter(Boolean).join(' / ');
  return (
    <article className={`catalog-card${out ? ' is-out' : ''}`}>
      <div className="catalog-card-top">
        <span className="catalog-card-tags">
          {low && <span className="is-red">Últimas unidades</span>}
          {out && <span className="is-gray">Agotado</span>}
        </span>
      </div>
      <Link to={url} className="catalog-card-media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
        {out ? (
          <span className="catalog-card-banner">Sin stock momentáneo</span>
        ) : (
          product.brand && <span className="catalog-card-label">{product.brand}</span>
        )}
      </Link>
      <div className="catalog-card-meta">
        <span>{origin}</span>
        <code>SKU: {product.sku}</code>
      </div>
      <Link className="catalog-card-title" to={url}>
        {product.name}
      </Link>
      <div className="catalog-card-foot">
        <p className={`catalog-card-stock${low ? ' is-low' : out ? ' is-out' : ''}`}>
          <i aria-hidden="true" />
          {out
            ? 'Temporalmente fuera de stock'
            : low
              ? `¡Solo ${product.stock} ${product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}!`
              : `Disponible (${product.stock} unidades)`}
        </p>
        <strong className="catalog-card-price">{money(Number(product.price))}</strong>
        <div className="catalog-card-actions">
          <Link className="catalog-card-view" to={url}>
            Ver detalle
          </Link>
          <button
            type="button"
            className="catalog-card-add"
            onClick={() => add(product)}
            disabled={out}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <img src={cartIcon} alt="" /> Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
