import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { StockBadge } from '../../components/product/StockBadge';
import { Pagination } from '../../components/shared/Pagination';
import { matchesQuery, paginate } from '../../lib/catalog';
import { downloadCsv, stockTotals, toCsv } from '../../lib/inventory';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const PAGE_SIZE = 25;

export function InventoryAdmin() {
  const { data, loading, error, reload } = useData(api.products);
  const [query, setQuery] = useState('');
  const [onlyOut, setOnlyOut] = useState(false);
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () =>
      (data ?? [])
        .filter((product) => matchesQuery(product, query) && (!onlyOut || product.stock < 1))
        .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'es')),
    [data, query, onlyOut],
  );
  const totals = stockTotals(data ?? []);
  const current = paginate(rows, page, PAGE_SIZE);

  const exportCsv = () =>
    downloadCsv(
      'existencias-syscon.csv',
      toCsv(
        ['SKU', 'Producto', 'Categoría', 'Marca', 'Stock', 'Precio', 'Valor a precio de venta'],
        rows.map((product) => [
          product.sku,
          product.name,
          product.category ?? '',
          product.brand ?? '',
          product.stock,
          Number(product.price).toFixed(2),
          (Math.max(0, product.stock) * Number(product.price)).toFixed(2),
        ]),
      ),
    );

  return (
    <>
      <PageHeader
        title="Existencias"
        description="Stock actual por producto publicado. El backend maneja un único saldo global: todavía no existen almacenes, movimientos, kardex, ajustes ni transferencias."
        actions={
          rows.length > 0 && (
            <button type="button" className="button button-secondary" onClick={exportCsv}>
              Exportar CSV
            </button>
          )
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <>
          <div className="bo-stats">
            <StatCard label="Productos publicados" value={totals.products} />
            <StatCard label="Unidades en stock" value={totals.units} />
            <StatCard label="Productos sin stock" value={totals.outOfStock} />
            <StatCard
              label="Valor a precio de venta"
              value={money(totals.saleValue)}
              hint="Unidades × precio actual; no es un costo."
            />
          </div>
          <section className="bo-card" aria-labelledby="stock-count">
            <div className="bo-filters bo-filters-compact">
              <label className="field">
                Buscar
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Nombre, SKU, marca o categoría"
                />
              </label>
              <label className="facet-option">
                <input
                  type="checkbox"
                  checked={onlyOut}
                  onChange={(event) => {
                    setOnlyOut(event.target.checked);
                    setPage(1);
                  }}
                />
                <span>Solo sin stock</span>
              </label>
            </div>
            <p id="stock-count" className="catalog-count">
              {rows.length} {rows.length === 1 ? 'producto' : 'productos'}, ordenados de menor a
              mayor stock
            </p>
            {current.items.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">Categoría</th>
                      <th scope="col" className="num">
                        Stock
                      </th>
                      <th scope="col" className="num">
                        Precio
                      </th>
                      <th scope="col" className="num">
                        Valor a precio de venta
                      </th>
                      <th scope="col">
                        <span className="visually-hidden">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.items.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <small>SKU {product.sku}</small>
                        </td>
                        <td>{product.category ?? '—'}</td>
                        <td className="num">
                          {product.stock} <StockBadge stock={product.stock} />
                        </td>
                        <td className="num">{money(Number(product.price))}</td>
                        <td className="num">
                          {money(Math.max(0, product.stock) * Number(product.price))}
                        </td>
                        <td className="num">
                          <Link
                            className="link-button"
                            to={`/admin/productos?editar=${encodeURIComponent(product.sku)}`}
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Sin resultados" text="No hay productos que coincidan con el filtro." />
            )}
            <Pagination page={current.page} pages={current.pages} onChange={setPage} />
          </section>
        </>
      )}
    </>
  );
}
