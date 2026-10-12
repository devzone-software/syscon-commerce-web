import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import boxIcon from '../../images/catalog/box.svg';
import clearIcon from '../../images/catalog/clear.svg';
import closeIcon from '../../images/catalog/close.svg';
import filterIcon from '../../images/catalog/filter.svg';
import homeIcon from '../../images/catalog/home.svg';
import invoiceIcon from '../../images/catalog/invoice.svg';
import searchButtonIcon from '../../images/catalog/search-button.svg';
import searchIcon from '../../images/catalog/search.svg';
import { CatalogCard } from '../components/catalog/CatalogCard';
import { CatalogSidebar } from '../components/catalog/CatalogSidebar';
import { ChatIcon, SearchIcon } from '../components/icons';
import {
  catalogParams,
  filterProducts,
  groupProducts,
  pageNumbers,
  paginate,
  readFilters,
  sortOptions,
  type CatalogFilters,
} from '../lib/catalog';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty } from '../ui';

const PAGE_SIZES = [12, 24, 48];
const count = new Intl.NumberFormat('es-PE');

type Chip = { keys: string[]; label: string; value: string };

function appliedFilters(filters: CatalogFilters): Chip[] {
  const price =
    filters.minPrice !== null || filters.maxPrice !== null
      ? `${filters.minPrice !== null ? `S/ ${filters.minPrice}` : 'S/ 0'} - ${
          filters.maxPrice !== null ? `S/ ${filters.maxPrice}` : 'máx.'
        }`
      : '';
  const chips: (Chip | false | '')[] = [
    filters.query && { keys: [catalogParams.query], label: 'Búsqueda', value: filters.query },
    filters.category && {
      keys: [catalogParams.category],
      label: 'Categoría',
      value: filters.category,
    },
    filters.brand && { keys: [catalogParams.brand], label: 'Marca', value: filters.brand },
    price && {
      keys: [catalogParams.minPrice, catalogParams.maxPrice],
      label: 'Precio',
      value: price,
    },
    filters.onlyAvailable && {
      keys: [catalogParams.onlyAvailable],
      label: 'Disponibilidad',
      value: 'En stock',
    },
  ];
  return chips.filter((chip): chip is Chip => Boolean(chip));
}

/** Figma "Client / Productos": compact header with search, filter sidebar and 3-column grid. */
export function Catalog() {
  const { data, loading, error, reload } = useData(api.products);
  const [params, setParams] = useSearchParams();
  const [size, setSize] = useState(PAGE_SIZES[0]);
  const paramsKey = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const [query, setQuery] = useState(filters.query);
  useEffect(() => setQuery(filters.query), [filters.query]);

  const facets = useMemo(() => {
    const products = data ?? [];
    const prices = products.map((product) => Number(product.price));
    return {
      results: filterProducts(products, filters),
      categories: groupProducts(filterProducts(products, { ...filters, category: '' }), 'category'),
      total: filterProducts(products, { ...filters, category: '' }).length,
      brands: groupProducts(filterProducts(products, { ...filters, brand: '' }), 'brand'),
      inStock: filterProducts(products, { ...filters, onlyAvailable: true }).length,
      bounds: [
        Math.floor(prices.length ? Math.min(...prices) : 0),
        Math.ceil(prices.length ? Math.max(...prices) : 0),
      ] as [number, number],
    };
  }, [data, filters]);
  const { items, page, pages } = paginate(
    facets.results,
    Number(params.get(catalogParams.page) || 1),
    size,
  );
  const first = facets.results.length ? (page - 1) * size + 1 : 0;
  const last = (page - 1) * size + items.length;

  const update = (changes: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    next.delete(catalogParams.page);
    setParams(next, { replace });
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
  const search = (event: FormEvent) => {
    event.preventDefault();
    update({ [catalogParams.query]: query.trim() });
  };
  const chips = appliedFilters(filters);

  return (
    <div className="container catalog-page">
      <nav className="catalog-crumb" aria-label="Ruta de navegación">
        <Link to="/">
          <img src={homeIcon} alt="" /> Inicio
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          <img src={boxIcon} alt="" /> Productos
        </span>
      </nav>
      <div className="catalog-head">
        <div>
          <h1>
            Catálogo de Productos{' '}
            {data && <span className="catalog-total">{count.format(data.length)} productos</span>}
          </h1>
          <p>Explora nuestro catálogo empresarial con stock real y precios actualizados.</p>
        </div>
        <div className="catalog-perks">
          <span>
            <img src={invoiceIcon} alt="" />
            <span>
              <small>FACTURACIÓN</small>RUC 20 con IGV
            </span>
          </span>
          <i aria-hidden="true" />
          <span>
            <SearchIcon size={16} />
            <span>
              <small>STOCK</small>Actualizado en línea
            </span>
          </span>
        </div>
      </div>
      <form className="catalog-search" role="search" onSubmit={search}>
        <label>
          <img src={searchIcon} alt="" />
          <span className="visually-hidden">Buscar en el catálogo</span>
          <input
            type="search"
            placeholder="Buscar productos, marcas o SKU"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="submit" className="catalog-search-go">
          <img src={searchButtonIcon} alt="" /> Buscar
        </button>
        <button
          type="button"
          className="catalog-search-clear"
          onClick={() => {
            setQuery('');
            update({ [catalogParams.query]: '' });
          }}
        >
          <img src={clearIcon} alt="" /> Limpiar búsqueda
        </button>
      </form>
      {chips.length > 0 && (
        <div className="catalog-applied">
          <span className="catalog-applied-label">
            <img src={filterIcon} alt="" /> FILTROS APLICADOS:
          </span>
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => update(Object.fromEntries(chip.keys.map((key) => [key, ''])))}
              aria-label={`Quitar filtro ${chip.label}: ${chip.value}`}
            >
              {chip.label}: <strong>{chip.value}</strong> <img src={closeIcon} alt="" />
            </button>
          ))}
          <button type="button" className="catalog-applied-clear" onClick={clear}>
            Limpiar todos
          </button>
        </div>
      )}

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
        <div className="catalog-body">
          <CatalogSidebar
            filters={filters}
            categories={facets.categories}
            brands={facets.brands}
            total={facets.total}
            inStock={facets.inStock}
            priceBounds={facets.bounds}
            onChange={update}
            onClear={clear}
          />
          <section className="catalog-main" aria-label="Resultados">
            <div className="catalog-bar">
              <p aria-live="polite">
                Mostrando{' '}
                <strong>
                  {first} - {last}
                </strong>{' '}
                de {count.format(facets.results.length)} productos
              </p>
              <div>
                <label className="browser-select">
                  <span>Mostrar:</span>
                  <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
                    {PAGE_SIZES.map((option) => (
                      <option key={option} value={option}>
                        {option} productos
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
            {items.length ? (
              <div className="catalog-cards">
                {items.map((product) => (
                  <CatalogCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Empty
                title="Sin resultados"
                text="No hay productos que coincidan con la búsqueda y los filtros elegidos."
              />
            )}
            <div className="catalog-help">
              <span className="catalog-help-icon">
                <SearchIcon size={22} />
              </span>
              <div>
                <h2>¿No encuentras el modelo o licenciamiento exacto?</h2>
                <p>
                  Consulta con nuestro equipo comercial por productos bajo pedido especial,
                  servidores, switches y licenciamiento corporativo.
                </p>
              </div>
              <div className="catalog-help-actions">
                <button type="button" onClick={clear}>
                  Restablecer filtros
                </button>
                <Link to="/contacto">
                  <ChatIcon size={16} /> Consultar Stock Directo
                </Link>
              </div>
            </div>
            <nav className="catalog-pager" aria-label="Paginación">
              <p>
                Página <strong>{page}</strong> de {pages} •{' '}
                <strong>{count.format(facets.results.length)}</strong> resultados encontrados
              </p>
              <div>
                <button
                  type="button"
                  className="catalog-pager-step"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  ‹ Anterior
                </button>
                {pageNumbers(page, pages).map((n, index) =>
                  n === null ? (
                    <span key={`gap-${index}`} aria-hidden="true">
                      ···
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={n === page ? 'is-current' : undefined}
                      aria-current={n === page ? 'page' : undefined}
                      onClick={() => goToPage(n)}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="catalog-pager-step is-next"
                  disabled={page >= pages}
                  onClick={() => goToPage(page + 1)}
                >
                  Siguiente ›
                </button>
              </div>
            </nav>
          </section>
        </div>
      )}
    </div>
  );
}
