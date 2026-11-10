import { useState } from 'react';
import { EyeIcon } from '../icons';
import { ProductQuickView } from './ProductQuickView';
import { publicBrand, productHighlights } from '../../lib/productPresentation';
import { Link, useLocation } from 'react-router-dom';
import cartIcon from '../../../images/catalog/cart.svg';
import { money } from '../../state';
import { useConfirmAdd } from '../cart/AddToCartDialog';
import type { Product } from '../../types';
import { ProductImage } from '../ProductImage';
import { cableLength } from '../../lib/catalog';
import '../../../css/products.css';

/** Product card of Figma "Client / Productos" (3-column catalog grid). */
export function CatalogCard({ product }: { product: Product }) {
  const add = useConfirmAdd();
  const [quickView, setQuickView] = useState(false);
  const url = `/producto/${product.id}`;
  const location = useLocation();
  const returnState = { from: location.pathname + location.search };
  const out = product.stock < 1;
  const origin = publicBrand(product) || product.category;
  const highlights = productHighlights(product);
  const length = cableLength(product);
  const secondary = product.imageUrls?.find((image) => image !== product.imageUrl);
  return (
    <article className={`catalog-card${out ? ' is-out' : ''}`}>
      <Link
        to={url}
        state={returnState}
        className="catalog-card-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage product={product} />
        {secondary && (
          <img
            className="catalog-secondary-photo"
            src={secondary}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
        {length && <span className="product-length-label">{length}</span>}
      </Link>
      <button
        type="button"
        className="catalog-quick-trigger"
        onClick={() => setQuickView(true)}
        aria-label={`Vista rápida de ${product.name}`}
        title="Vista rápida"
      >
        <EyeIcon size={19} />
      </button>
      {quickView && <ProductQuickView product={product} onClose={() => setQuickView(false)} />}
      <div className="catalog-card-meta">
        <span>{origin}</span>
      </div>
      <Link className="catalog-card-title" to={url} state={returnState}>
        {product.name}
      </Link>
      {highlights.length > 0 && (
        <ul className="catalog-card-highlights">
          {highlights.map((text) => (
            <li key={text} title={text}>
              {text}
            </li>
          ))}
        </ul>
      )}
      <div className="catalog-card-foot">
        <p className={`catalog-card-stock${out ? ' is-out' : ''}`}>
          <i aria-hidden="true" /> {out ? 'Agotado' : 'Disponible'}
        </p>
        <strong className="catalog-card-price">{money(Number(product.price))}</strong>
        <div className="catalog-card-actions">
          <button
            type="button"
            className="catalog-card-add"
            onClick={() => add(product)}
            disabled={out}
            aria-label={out ? `${product.name}: agotado` : `Agregar ${product.name} al carrito`}
          >
            {!out && <img src={cartIcon} alt="" />} {out ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
