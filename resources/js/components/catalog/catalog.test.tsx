import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Pagination } from '../shared/Pagination';

const noop = () => undefined;

describe('catalog components', () => {
  it('hides pagination for a single page', () => {
    expect(renderToStaticMarkup(<Pagination page={1} pages={1} onChange={noop} />)).toBe('');
    expect(renderToStaticMarkup(<Pagination page={1} pages={3} onChange={noop} />)).toContain(
      'Página 1 de 3',
    );
  });
});
