import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductImage } from './ProductImage';
import type { Product } from '../types';

const product: Product = {
  id: '1',
  sku: 'A',
  name: 'Equipo <seguro>',
  price: 10,
  stock: 2,
  imageUrl: 'https://example.com/image.jpg',
  category: null,
  brand: null,
  active: true,
};
describe('ProductImage', () => {
  it('escapes product names in the image alt attribute', () => {
    const html = renderToStaticMarkup(<ProductImage product={product} />);
    expect(html).toContain('alt="Equipo &lt;seguro&gt;"');
    expect(html).toContain('loading="lazy"');
  });
  it('renders the category icon and the brand when the catalog has no image', () => {
    const html = renderToStaticMarkup(
      <ProductImage
        product={{ ...product, imageUrl: null, category: 'Switches', brand: 'TP-Link' }}
      />,
    );
    expect(html).toContain('class="image-fallback"');
    expect(html).toContain('<small>TP-Link</small>');
    expect(html).not.toContain('Equipo');
  });
  it('labels the stock photos of the referencial folder, unless the badge is turned off', () => {
    const photo = { ...product, imageUrl: 'http://api.test/images/products/referencial/a.webp' };
    expect(renderToStaticMarkup(<ProductImage product={photo} />)).toContain('Imagen referencial');
    expect(renderToStaticMarkup(<ProductImage product={photo} badge={false} />)).not.toContain(
      'Imagen referencial',
    );
    // A manufacturer's photo or an illustration is not labeled.
    expect(renderToStaticMarkup(<ProductImage product={product} />)).not.toContain('referencial');
  });
});
