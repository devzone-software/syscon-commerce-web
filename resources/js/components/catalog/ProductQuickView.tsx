import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { money } from '../../state';
import { publicBrand, productHighlights } from '../../lib/productPresentation';
import { productGalleryPhotos } from '../../lib/productGallery';
import { ProductGalleryThumbs } from '../product/ProductGalleryThumbs';
import { ProductImage } from '../ProductImage';
import { CloseIcon, CartIcon, ArrowRightIcon } from '../icons';
import { useConfirmAdd } from '../cart/AddToCartDialog';

export function ProductQuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(0);
  const add = useConfirmAdd();
  const brand = publicBrand(product);
  const highlights = productHighlights(product);
  const photos = productGalleryPhotos(product);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="product-quick-view"
      aria-labelledby="quick-view-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="quick-view-close"
        onClick={onClose}
        aria-label="Cerrar vista rápida"
      >
        <CloseIcon />
      </button>
      <div className="quick-view-layout">
        <div className="quick-view-gallery">
          <div className="quick-view-photo">
            <ProductImage
              key={selected}
              product={selected === 0 ? product : { ...product, imageUrl: photos[selected] }}
              loading="eager"
            />
          </div>
          <ProductGalleryThumbs photos={photos} selected={selected} onSelect={setSelected} />
        </div>
        <div className="quick-view-info">
          <p className="quick-view-category">{product.category}</p>
          <h2 id="quick-view-title">{product.name}</h2>
          {brand && <p>{brand}</p>}
          <strong className="quick-view-price">{money(Number(product.price))}</strong>
          <span className="quick-view-stock">{product.stock > 0 ? 'Disponible' : 'Agotado'}</span>
          {highlights.length > 0 && (
            <ul className="quick-view-highlights">
              {highlights.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          )}
          {product.description && <p className="quick-view-description">{product.description}</p>}
          <div className="quick-view-purchase">
            <button
              type="button"
              className="button button-primary"
              disabled={product.stock < 1}
              onClick={() => {
                onClose();
                add(product);
              }}
            >
              <CartIcon size={18} />
              {product.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
            </button>
            <Link to={`/producto/${product.id}`} onClick={onClose}>
              Ver todas las características <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
