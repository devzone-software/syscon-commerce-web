import { Link } from 'react-router-dom';
import { ProductImage } from '../ProductImage';
import { isServicePlan, planPriceSuffix } from '../../lib/servicePlans';
import { normalize } from '../../lib/catalog';
import { money } from '../../state';
import type { Product } from '../../types';

/**
 * Home-page showcase card: it only promotes the product (picture, name, price). The whole
 * card opens the product page, which is where "Comprar ahora" and "Agregar al carrito" live.
 */
export function PromoCard({ product }: { product: Product }) {
  const available = product.stock > 0;
  const price = Number(product.price);
  const [soles, cents] = price.toFixed(2).split('.');
  const plan = isServicePlan(product);
  // Licenses and antivirus are delivered as keys: no store pickup to promote.
  const digital = /licenc|software|antivirus/.test(normalize(product.category ?? ''));
  return (
    <Link
      to={`/producto/${product.id}`}
      className={`promo-card${available ? '' : ' is-out'}`}
      aria-label={`${product.name}, ${money(price)}${available ? '' : ', agotado'}. Ver producto`}
    >
      <span className="promo-card-media">
        <ProductImage product={product} />
        {!available && <span className="promo-card-badge">Agotado</span>}
      </span>
      <span className="promo-card-body">
        {product.category && <span className="promo-card-category">{product.category}</span>}
        <span className="promo-card-title">{product.name}</span>
        <span className="promo-card-price" aria-hidden="true">
          <small>S/</small> {Number(soles).toLocaleString('es-PE')}
          <sup>{cents}</sup>
          {plan && planPriceSuffix(product) && (
            <span className="promo-card-suffix">{planPriceSuffix(product)}</span>
          )}
        </span>
        {available && !plan && (
          <span className="promo-card-perk">
            {digital ? 'Licencia original' : 'Retiro gratis en tienda'}
          </span>
        )}
      </span>
    </Link>
  );
}
