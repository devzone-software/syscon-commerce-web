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
  it('identifies reference photography without changing custom product images', () => {
    const html = renderToStaticMarkup(
      <ProductImage
        product={{
          ...product,
          sku: 'DEMO-ADP-USB-ETH',
          brand: 'Demo Linkora',
          imageUrl: '/images/products/demo-adp-usb-eth.svg',
        }}
      />,
    );
    expect(html).toContain('product-photo-frame');
    expect(html).toContain('/examples/catalog-photos/usb-ethernet.jpg');
    expect(renderToStaticMarkup(<ProductImage product={product} />)).not.toContain(
      'Foto referencial',
    );
  });
});
