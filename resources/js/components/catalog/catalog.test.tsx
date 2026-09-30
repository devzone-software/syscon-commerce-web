import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFilters } from '../../lib/catalog';
import { Pagination } from '../shared/Pagination';
import { ActiveFilters } from './ActiveFilters';
import { CatalogFilters } from './CatalogFilters';

const noop = () => undefined;

describe('catalog components', () => {
  it('keeps a selected facet visible even without results', () => {
    const html = renderToStaticMarkup(
      <CatalogFilters
        filters={readFilters(new URLSearchParams('categoria=Audio'))}
        categories={[{ name: 'Redes', count: 2 }]}
        brands={[]}
        onChange={noop}
      />,
    );
    expect(html).toContain('Audio');
    expect(html).toContain('Redes');
    expect(html).not.toContain('Marca');
  });
  it('renders one removable chip per active filter', () => {
    const html = renderToStaticMarkup(
      <ActiveFilters
        filters={readFilters(new URLSearchParams('q=router&marca=TP-Link&disponible=1'))}
        onChange={noop}
        onClear={noop}
      />,
    );
    expect(html.match(/class="chip"/g)).toHaveLength(3);
    expect(html).toContain('Limpiar filtros');
  });
  it('hides pagination for a single page', () => {
    expect(renderToStaticMarkup(<Pagination page={1} pages={1} onChange={noop} />)).toBe('');
    expect(renderToStaticMarkup(<Pagination page={1} pages={3} onChange={noop} />)).toContain(
      'Página 1 de 3',
    );
  });
});
