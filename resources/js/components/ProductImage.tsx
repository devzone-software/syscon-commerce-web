import { publicBrand } from '../lib/productPresentation';
import { useState } from 'react';
import { categoryIcon } from '../lib/categoryIcon';
import { referencePhoto } from '../lib/catalogPhotos';
import { catalogPhotoFrames } from '../lib/catalogPhotoFrames';
import type { Product } from '../types';

/** Product photo; without one (or if it fails to load) the icon of its category and its brand. */
export function ProductImage({
  product,
  loading = 'lazy',
}: {
  product: Product;
  loading?: 'lazy' | 'eager';
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const reference = referencePhoto(product);
  const source = reference && !failedSources.includes(reference) ? reference : product.imageUrl;
  const isReference = source === reference && Boolean(reference);
  const frame = reference
    ? catalogPhotoFrames[reference.slice('/examples/catalog-photos/'.length)]
    : undefined;
  const [left, top, width, height, sourceAspect] = frame ?? [0, 0, 1, 1, 1];
  const aspect = (width * sourceAspect) / height;
  const photo =
    source && !failedSources.includes(source) ? (
      <img
        src={source}
        alt={product.name}
        loading={loading}
        style={
          isReference
            ? {
                width: `${100 / width}%`,
                height: `${100 / height}%`,
                left: `${(-100 * left) / width}%`,
                top: `${(-100 * top) / height}%`,
              }
            : undefined
        }
        onError={() => setFailedSources((previous) => [...previous, source])}
      />
    ) : (
      <span className="image-fallback">
        <img src={categoryIcon(product.category ?? '')} alt="" />
        {publicBrand(product) && <small>{publicBrand(product)}</small>}
      </span>
    );
  return isReference ? (
    <span className="product-reference-photo">
      <span className="product-photo-frame">
        <span
          className="product-photo-crop"
          style={{
            width: `min(100cqw, ${100 * aspect}cqh)`,
            height: `min(100cqh, ${100 / aspect}cqw)`,
          }}
        >
          {photo}
        </span>
      </span>
    </span>
  ) : (
    photo
  );
}
