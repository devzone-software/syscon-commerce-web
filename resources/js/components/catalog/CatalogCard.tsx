import { Link } from 'react-router-dom';
import cartIcon from '../../../images/catalog/cart.svg';
import { money } from '../../state';
import { useConfirmAdd } from '../cart/AddToCartDialog';
import type { Product } from '../../types';
import { ProductImage } from '../ProductImage';
import '../../../css/products.css';

/** Product card of Figma "Client / Productos" (3-column catalog grid). */
export function CatalogCard({ product }: { product: Product }) {
  const add = useConfirmAdd();
  const url = `/producto/${product.id}`;
  const out = product.stock < 1;
  const origin = [product.category, product.brand].filter(Boolean).join(' / ');
  return (
    <article className={`catalog-card${out ? ' is-out' : ''}`}>
      <div className="catalog-card-top">
        <span className="catalog-card-tags">{out && <span className="is-gray">Agotado</span>}</span>
      </div>
      <Link to={url} className="catalog-card-media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
        {product.brand && <span className="catalog-card-label">{product.brand}</span>}
      </Link>
      <div className="catalog-card-meta">
        <span>{origin}</span>
        <code>SKU: {product.sku}</code>
      </div>
      <Link className="catalog-card-title" to={url}>
        {product.name}
      </Link>
      <div className="catalog-card-foot">
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
