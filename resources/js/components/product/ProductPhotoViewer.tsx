import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProductImage } from '../ProductImage';
import { referencePhoto } from '../../lib/catalogPhotos';
import { productGalleryPhotos } from '../../lib/productGallery';
import { ProductGalleryThumbs } from './ProductGalleryThumbs';
import type { Product } from '../../types';

export function ProductPhotoViewer({ product }: { product: Product }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = stage.current;
    if (element) {
      element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
      element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
    }
  }, [zoomed]);
  const photos = productGalleryPhotos(product);
  const [selected, setSelected] = useState(0);
  const source = photos[selected] ?? photos[0];
  const displayed =
    selected === 0 && (referencePhoto(product) || product.imageUrl)
      ? product
      : { ...product, imageUrl: source };

  return (
    <div className="product-gallery">
      <div
        className="product-detail-media product-hover-zoom"
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse' || !source || dialog.current?.open) return;
          const element = event.currentTarget;
          element.classList.add('is-magnifying');
        }}
        onPointerLeave={(event) => event.currentTarget.classList.remove('is-magnifying')}
      >
        <ProductImage key={source} product={displayed} loading="eager" />
        {source && (
          <>
            <button
              type="button"
              className="photo-open"
              aria-label={`Ampliar imagen de ${product.name}`}
              aria-haspopup="dialog"
              title="Ampliar imagen"
              onClick={(event) => {
                event.currentTarget.parentElement?.classList.remove('is-magnifying');
                setZoomed(false);
                dialog.current?.showModal();
              }}
            >
              <span className="photo-zoom-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m16 16 4.5 4.5M10.5 7.5v6M7.5 10.5h6" />
                </svg>
              </span>
            </button>
            {createPortal(
              <dialog
                ref={dialog}
                className="photo-viewer"
                aria-label={`Imagen de ${product.name}`}
                onClick={(event) => {
                  if (event.target === event.currentTarget) dialog.current?.close();
                }}
              >
                <div className="photo-viewer-card">
                  <header>
                    <strong>{product.name}</strong>
                    <button
                      type="button"
                      onClick={() => dialog.current?.close()}
                      aria-label="Cerrar imagen"
                    >
                      Cerrar ×
                    </button>
                  </header>
                  <div ref={stage} className={`photo-viewer-stage${zoomed ? ' is-zoomed' : ''}`}>
                    <div className="photo-viewer-canvas">
                      <img src={source} alt={product.name} />
                    </div>
                  </div>
                  <footer>
                    <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>
                      {zoomed ? 'Ver imagen completa' : 'Acercar imagen'}
                    </button>
                  </footer>
                </div>
              </dialog>,
              document.body,
            )}
          </>
        )}
      </div>
      <ProductGalleryThumbs
        photos={photos}
        selected={selected}
        onSelect={(index) => {
          setSelected(index);
          setZoomed(false);
        }}
      />
    </div>
  );
}
