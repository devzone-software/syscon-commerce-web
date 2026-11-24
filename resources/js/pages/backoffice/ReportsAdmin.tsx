import { can, permissions } from '../../lib/auth';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { downloadCsv, toCsv } from '../../lib/csv';
import { stockBy, type StockSummary } from '../../lib/inventory';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const dimensions = [
  { value: 'category', label: 'Categoría' },
  { value: 'brand', label: 'Marca' },
] as const;

function SummaryTable({ label, rows }: { label: string; rows: StockSummary[] }) {
  const max = Math.max(...rows.map((row) => row.saleValue), 0);
  return (
    <div className="table-wrap responsive-table">
      <table className="data-table">
        <caption className="visually-hidden">Disponibilidad por {label.toLowerCase()}</caption>
        <thead>
          <tr>
            <th scope="col">{label}</th>
            <th scope="col" className="num">
              Productos
            </th>
            <th scope="col" className="num">
              Sin stock
            </th>
            <th scope="col" className="num">
              Unidades disponibles
            </th>
            <th scope="col" className="num">
              Valor a precio de venta
            </th>
            <th scope="col">
              <span className="visually-hidden">Participación</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td data-label={label}>
                <strong>{row.name}</strong>
              </td>
              <td data-label="Productos" className="num">
                {row.products}
              </td>
              <td data-label="Sin stock" className="num">
                {row.outOfStock}
              </td>
              <td data-label="Unidades disponibles" className="num">
                {row.units}
              </td>
              <td data-label="Valor a precio de venta" className="num">
                {money(row.saleValue)}
              </td>
              <td data-label="Participación" className="bo-bar-cell" aria-hidden="true">
                <span
                  className="bo-bar"
                  style={{ width: `${max ? (row.saleValue / max) * 100 : 0}%` }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsAdmin() {
  const { user } = useShop();
  const { data, loading, error, reload } = useData(api.products);
  const [dimension, setDimension] = useState<'category' | 'brand'>('category');
  const label = dimensions.find((item) => item.value === dimension)!.label;
  const rows = data ? stockBy(data, dimension) : [];

  const exportCsv = () =>
    downloadCsv(
      `reporte-stock-por-${dimension === 'category' ? 'categoria' : 'marca'}.csv`,
      toCsv(
        [label, 'Productos', 'Sin stock', 'Unidades disponibles', 'Valor a precio de venta'],
        rows.map((row) => [
          row.name,
          row.products,
          row.outOfStock,
          row.units,
          row.saleValue.toFixed(2),
        ]),
      ),
    );

  return (
    <>
      <PageHeader
        title="Resumen del catálogo"
        description="Disponibilidad de los productos publicados, agrupada por categoría o marca. Consulta el stock físico, reservado y disponible en Existencias."
        actions={
          <>
            {can(user, permissions.catalogWrite) && (
              <Link className="button button-secondary" to="/admin/existencias">
                Ver existencias
              </Link>
            )}
            {rows.length > 0 && (
              <button type="button" className="button button-secondary" onClick={exportCsv}>
                Exportar CSV
              </button>
            )}
          </>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : rows.length ? (
        <section className="bo-card" aria-labelledby="report-title">
          <div className="checkout-card-head">
            <h2 id="report-title">Productos publicados por {label.toLowerCase()}</h2>
            <label className="catalog-sort">
              <span>Agrupar por</span>
              <select
                value={dimension}
                onChange={(event) => setDimension(event.target.value as 'category' | 'brand')}
              >
                {dimensions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <SummaryTable label={label} rows={rows} />
          <p className="muted">
            “Valor a precio de venta” multiplica las unidades en stock por el precio actual; no
            representa costo ni ventas realizadas.
          </p>
        </section>
      ) : (
        <Empty title="Sin datos" text="No hay productos publicados para generar reportes." />
      )}
    </>
  );
}
