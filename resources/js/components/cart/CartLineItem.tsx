import { Link } from 'react-router-dom';
import { issueMessages, type CartIssue } from '../../lib/cart';
import { money } from '../../state';
import type { CartLine } from '../../types';
import { ProductImage } from '../ProductImage';
import { QuantityStepper } from '../shared/QuantityStepper';

export function CartLineItem({
  line,
  issue,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  issue?: CartIssue;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { product, quantity } = line;
  const blocked = issue === 'unavailable' || issue === 'out-of-stock';
  return (
    <li className={`cart-line${issue ? ' has-issue' : ''}`}>
      <Link
        to={`/producto/${product.id}`}
        className="cart-line-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage product={product} />
      </Link>
      <div className="cart-line-info">
        {product.brand && <span className="card-product-brand">{product.brand}</span>}
        <Link to={`/producto/${product.id}`} className="cart-line-name">
          {product.name}
        </Link>
        <span className="cart-line-meta">
          SKU {product.sku} · {money(Number(product.price))} c/u
        </span>
        {issue && (
          <p className="cart-line-issue" role="alert">
            {issueMessages[issue]}
            {issue === 'exceeds-stock' && (
              <>
                {' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => onQuantity(product.stock)}
                >
                  Ajustar a {product.stock}
                </button>
              </>
            )}
          </p>
        )}
      </div>
      <div className="cart-line-actions">
        {!blocked && (
          <QuantityStepper
            label={`Cantidad de ${product.name}`}
            value={quantity}
            max={product.stock}
            onChange={onQuantity}
          />
        )}
        <strong className="cart-line-total">{money(Number(product.price) * quantity)}</strong>
        <button type="button" className="link-button cart-line-remove" onClick={onRemove}>
          Quitar<span className="visually-hidden"> {product.name}</span>
        </button>
      </div>
    </li>
  );
}
