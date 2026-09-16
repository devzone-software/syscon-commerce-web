import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductImage } from './ProductImage';
import type { Product } from '../types';

const product: Product = { id: '1', sku: 'A', name: 'Equipo <seguro>', price: 10, stock: 2, imageUrl: 'https://example.com/image.jpg', category: null, brand: null, active: true };
describe('ProductImage', () => {
  it('escapes product names in the image alt attribute', () => {
    const html = renderToStaticMarkup(<ProductImage product={product} />);
    expect(html).toContain('alt="Equipo &lt;seguro&gt;"');
    expect(html).toContain('loading="lazy"');
  });
  it('renders a fallback when the catalog has no image', () => {
    expect(renderToStaticMarkup(<ProductImage product={{ ...product, imageUrl: null }} />)).toContain('SYSCON');
  });
});
