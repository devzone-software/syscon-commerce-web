import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import filtersIcon from '../../../images/home/filters.svg';
import {
  catalogParams,
  filterProducts,
  groupProducts,
  readFilters,
  sortOptions,
} from '../../lib/catalog';
import type { Product } from '../../types';
import { Empty, ProductCard } from '../../ui';
import { ActiveFilters } from './ActiveFilters';
import { CatalogFilters } from './CatalogFilters';
import '../../../css/storefront.css';

const FIRST_PAGE = 8;
const NEXT_PAGE = 8;
const count = new Intl.NumberFormat('es-PE');

/**
 * "Nuestros productos" from the Figma home: quick chips, control bar, filter sidebar and a
 * 4-column grid with "Cargar más productos". Filters live in the URL so links can share them.
 */
export function ProductBrowser({
  products,
  eyebrow,
  title,
  headingLevel = 'h2',
}: {
  products: Product[];
  eyebrow: string;
  title: string;
  headingLevel?: 'h1' | 'h2';
}) {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const paramsKey = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const [visible, setVisible] = useState(FIRST_PAGE);
  useEffect(() => setVisible(FIRST_PAGE), [paramsKey]);

  const { results, categories, brands, allCategories, inStock } = useMemo(() => {
    const anyCategory = filterProducts(products, { ...filters, category: '' });
    return {
      results: filterProducts(products, filters),
      // Facet counts reflect every other active filter.
      categories: groupProducts(anyCategory, 'category'),
      allCategories: anyCategory.length,
      brands: groupProducts(filterProducts(products, { ...filters, brand: '' }), 'brand'),
      inStock: filterProducts(products, { ...filters, onlyAvailable: true }).length,
    };
  }, [products, filters]);
  const shown = results.slice(0, visible);

  const update = (changes: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setParams(next, { replace, preventScrollReset: true });
  };
  const clear = () => {
    const next = new URLSearchParams();
    if (filters.sort !== 'relevancia') next.set(catalogParams.sort, filters.sort);
    setParams(next, { preventScrollReset: true });
  };
  const Heading = headingLevel;

  return (
    <section className="browser" aria-labelledby="browser-title">
      <div className="browser-head">
        <div className="section-title">
          <p className="section-eyebrow">{eyebrow}</p>
          <Heading id="browser-title" className="is-large">
            {title}
          </Heading>
        </div>
        <div className="browser-chips" role="group" aria-label="Filtro rápido por categoría">
          <button
            type="button"
            className={!filters.category ? 'is-active' : undefined}
            aria-pressed={!filters.category}
            onClick={() => update({ [catalogParams.category]: '' })}
          >
            Todos ({count.format(allCategories)})
          </button>
          {categories.slice(0, 5).map((option) => (
            <button
              key={option.name}
              type="button"
              className={filters.category === option.name ? 'is-active' : undefined}
              aria-pressed={filters.category === option.name}
              onClick={() => update({ [catalogParams.category]: option.name })}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      <div className="browser-bar">
        <div className="browser-bar-group">
          <button
            type="button"
            className="browser-filters-toggle"
            aria-expanded={filtersOpen}
            aria-controls="browser-sidebar"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <img src={filtersIcon} alt="" />
            Filtros
          </button>
          <p aria-live="polite">
            Mostrando <strong>{shown.length ? `1 - ${shown.length}` : '0'}</strong> de{' '}
            {count.format(results.length)} productos
          </p>
        </div>
        <div className="browser-bar-group">
          <label className="browser-select">
            <span>Categoría:</span>
            <select
              value={filters.category}
              onChange={(event) => update({ [catalogParams.category]: event.target.value })}
            >
              <option value="">Todas las categorías</option>
              {categories.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="browser-select">
            <span>Ordenar por:</span>
            <select
              value={filters.sort}
              onChange={(event) =>
                update({
                  [catalogParams.sort]:
                    event.target.value === 'relevancia' ? '' : event.target.value,
                })
              }
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="browser-layout">
        <aside
          id="browser-sidebar"
          className={`browser-sidebar${filtersOpen ? ' is-open' : ''}`}
          aria-label="Filtros del catálogo"
        >
          <CatalogFilters
            filters={filters}
            categories={categories}
            brands={brands}
            inStock={inStock}
            onChange={update}
          />
        </aside>
        <div className="browser-results">
          <ActiveFilters filters={filters} onChange={update} onClear={clear} />
          {shown.length ? (
            <div className="browser-grid">
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          ) : (
            <Empty
              title="Sin resultados"
              text="No hay productos que coincidan con la búsqueda y los filtros elegidos."
              action={
                <button type="button" className="button button-primary" onClick={clear}>
                  Limpiar filtros
                </button>
              }
            />
          )}
          {results.length > 0 && (
            <div className="browser-more">
              <p>
                Mostrando <strong>{shown.length}</strong> de{' '}
                <strong>{count.format(results.length)}</strong> productos
              </p>
              <progress max={results.length} value={shown.length} aria-hidden="true" />
              {shown.length < results.length && (
                <button type="button" onClick={() => setVisible((n) => n + NEXT_PAGE)}>
                  ↻ Cargar más productos
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
