import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { ProductForm } from '../../components/backoffice/ProductForm';
import { StockBadge } from '../../components/product/StockBadge';
import { Pagination } from '../../components/shared/Pagination';
import { groupProducts, matchesQuery, paginate } from '../../lib/catalog';
import { emptyProduct, toProductInput } from '../../lib/products';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const PAGE_SIZE = 20;
const stockFilters = [
  { value: '', label: 'Todo el stock' },
  { value: 'con-stock', label: 'Con stock' },
  { value: 'sin-stock', label: 'Sin stock' },
];

export function ProductsAdmin() {
  const { data, loading, error, reload } = useData(api.products);
  const [params, setParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const query = params.get('q') ?? '';
  const category = params.get('categoria') ?? '';
  const stock = params.get('stock') ?? '';
  const editingSku = params.get('editar');
  const creating = params.get('nuevo') === '1';

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next);
  };

  const products = data ?? [];
  const categories = groupProducts(products, 'category').map((group) => group.name);
  const brands = groupProducts(products, 'brand').map((group) => group.name);
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (product) =>
          matchesQuery(product, query) &&
          (!category || product.category === category) &&
          (stock !== 'con-stock' || product.stock > 0) &&
          (stock !== 'sin-stock' || product.stock < 1),
      ),
    [data, query, category, stock],
  );
  const { items, page, pages } = paginate(filtered, Number(params.get('pagina') || 1), PAGE_SIZE);
  const editing = editingSku ? products.find((product) => product.sku === editingSku) : undefined;
  const formOpen = creating || Boolean(editing);

  const closeForm = () => update({ editar: '', nuevo: '' });
  const saved = (text: string) => {
    setMessage(text);
    closeForm();
    reload();
  };

  return (
    <>
      <PageHeader
        title="Productos"
        description="Productos publicados en el catálogo. El backend solo lista los productos activos."
        actions={
          !formOpen && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => update({ nuevo: '1', editar: '' })}
            >
              Nuevo producto
            </button>
          )
        }
      />
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      {formOpen && (
        <ProductForm
          key={editing?.id ?? 'new'}
          initial={editing ? toProductInput(editing) : emptyProduct}
          editing={Boolean(editing)}
          categories={categories}
          brands={brands}
          existingSkus={products.map((product) => product.sku)}
          onSaved={saved}
          onCancel={closeForm}
        />
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <section className="bo-card" aria-labelledby="products-count">
          <div className="bo-filters">
            <label className="field">
              Buscar
              <input
                type="search"
                value={query}
                onChange={(event) => update({ q: event.target.value })}
                placeholder="Nombre, SKU, marca o categoría"
              />
            </label>
            <label className="field">
              Categoría
              <select
                value={category}
                onChange={(event) => update({ categoria: event.target.value })}
              >
                <option value="">Todas</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Stock
              <select value={stock} onChange={(event) => update({ stock: event.target.value })}>
                {stockFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p id="products-count" className="catalog-count">
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
          </p>
          {items.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Marca</th>
                    <th scope="col" className="num">
                      Precio
                    </th>
                    <th scope="col" className="num">
                      Stock
                    </th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <small>SKU {product.sku}</small>
                      </td>
                      <td>{product.category ?? '—'}</td>
                      <td>{product.brand ?? '—'}</td>
                      <td className="num">{money(Number(product.price))}</td>
                      <td className="num">
                        {product.stock} <StockBadge stock={product.stock} />
                      </td>
                      <td className="num">
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            update({ editar: product.sku, nuevo: '' });
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          Editar<span className="visually-hidden"> {product.name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Sin productos" text="No hay productos que coincidan con los filtros." />
          )}
          <Pagination
            page={page}
            pages={pages}
            onChange={(target) => update({ pagina: String(target) })}
          />
        </section>
      )}
    </>
  );
}
