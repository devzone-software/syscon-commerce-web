import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function Catalog() {
  const { data, loading, error, reload } = useData(api.products);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = params.get('categoria') ?? '';
  const brand = params.get('marca') ?? '';
  const page = Math.max(1, Number(params.get('pagina') || 1));
  const categories = [...new Set(data?.map((p) => p.category).filter(Boolean) ?? [])] as string[];
  const brands = [...new Set(data?.map((p) => p.brand).filter(Boolean) ?? [])] as string[];
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          (!query ||
            `${p.name} ${p.sku} ${p.brand ?? ''}`.toLowerCase().includes(query.toLowerCase())) &&
          (!category || p.category === category) &&
          (!brand || p.brand === brand),
      ),
    [data, query, category, brand],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const visible = filtered.slice((Math.min(page, pages) - 1) * 12, Math.min(page, pages) * 12);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('pagina');
    setParams(next);
  };
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow accent">EXPLORA SYSCON</span>
        <h1>Catálogo de productos</h1>
        <p>Encuentra la tecnología indicada para cada proyecto.</p>
      </div>
      <div className="catalog-toolbar">
        <input
          aria-label="Buscar productos"
          placeholder="Buscar por nombre, SKU o marca…"
          value={query}
          onChange={(e) => update('q', e.target.value)}
        />
        <select
          aria-label="Filtrar por categoría"
          value={category}
          onChange={(e) => update('categoria', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por marca"
          value={brand}
          onChange={(e) => update('marca', e.target.value)}
        >
          <option value="">Todas las marcas</option>
          {brands.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <>
          <p className="result-count">{filtered.length} productos encontrados</p>
          {visible.length ? (
            <div className="product-grid">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty title="Sin resultados" text="Prueba otro término o cambia los filtros." />
          )}
          {pages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() =>
                  setParams({ ...Object.fromEntries(params), pagina: String(page - 1) })
                }
              >
                Anterior
              </button>
              <span>
                Página {Math.min(page, pages)} de {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() =>
                  setParams({ ...Object.fromEntries(params), pagina: String(page + 1) })
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
