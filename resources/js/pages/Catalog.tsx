import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';
import { ActiveFilters } from '../components/catalog/ActiveFilters';
import { CatalogFilters } from '../components/catalog/CatalogFilters';
import { Pagination } from '../components/shared/Pagination';
import {
  catalogParams,
  filterProducts,
  groupProducts,
  paginate,
  readFilters,
  sortOptions,
} from '../lib/catalog';

const PAGE_SIZE = 12;

export function Catalog() {
  const { data, loading, error, reload } = useData(api.products);
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const paramsKey = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);

  const { results, categories, brands } = useMemo(() => {
    const products = data ?? [];
    return {
      results: filterProducts(products, filters),
      // Facet counts reflect every other active filter.
      categories: groupProducts(filterProducts(products, { ...filters, category: '' }), 'category'),
      brands: groupProducts(filterProducts(products, { ...filters, brand: '' }), 'brand'),
    };
  }, [data, filters]);
  const { items, page, pages } = paginate(
    results,
    Number(params.get(catalogParams.page) || 1),
    PAGE_SIZE,
  );

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    next.delete(catalogParams.page);
    setParams(next);
  };
  const clear = () => {
    const next = new URLSearchParams();
    if (filters.sort !== 'relevancia') next.set(catalogParams.sort, filters.sort);
    setParams(next);
  };
  const goToPage = (target: number) => {
    const next = new URLSearchParams(params);
    next.set(catalogParams.page, String(target));
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="container page catalog-page">
      <div className="page-heading">
        <span className="eyebrow accent">CATÁLOGO SYSCON</span>
        <h1>{filters.query ? `Resultados para “${filters.query}”` : 'Catálogo de productos'}</h1>
        <p>Busca desde el encabezado y filtra por categoría, marca o disponibilidad.</p>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : !data?.length ? (
        <Empty
          title="Aún no hay productos publicados"
          text="El catálogo se mostrará aquí cuando se publiquen productos desde administración."
        />
      ) : (
        <div className="catalog-layout">
          <aside className="catalog-sidebar" aria-label="Filtros del catálogo">
            <button
              type="button"
              className="catalog-filters-toggle"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
            <div id="catalog-filters" className={filtersOpen ? 'is-open' : undefined}>
              <CatalogFilters
                filters={filters}
                categories={categories}
                brands={brands}
                onChange={update}
              />
            </div>
          </aside>
          <section className="catalog-results" aria-labelledby="catalog-count">
            <div className="catalog-toolbar-row">
              <p id="catalog-count" className="catalog-count" aria-live="polite">
                {results.length} {results.length === 1 ? 'producto' : 'productos'}
              </p>
              <label className="catalog-sort">
                <span>Ordenar por</span>
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
            <ActiveFilters filters={filters} onChange={update} onClear={clear} />
            {items.length ? (
              <div className="product-grid catalog-grid">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
            <Pagination page={page} pages={pages} onChange={goToPage} />
          </section>
        </div>
      )}
    </div>
  );
}
