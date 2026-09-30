import { useState } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { downloadCsv, stockBy, toCsv, type StockSummary } from '../../lib/inventory';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const dimensions = [
  { value: 'category', label: 'Categoría' },
  { value: 'brand', label: 'Marca' },
] as const;

function SummaryTable({ label, rows }: { label: string; rows: StockSummary[] }) {
  const max = Math.max(...rows.map((row) => row.saleValue), 0);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">Stock por {label.toLowerCase()}</caption>
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
              Unidades
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
              <td>
                <strong>{row.name}</strong>
              </td>
              <td className="num">{row.products}</td>
              <td className="num">{row.outOfStock}</td>
              <td className="num">{row.units}</td>
              <td className="num">{money(row.saleValue)}</td>
              <td className="bo-bar-cell" aria-hidden="true">
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
  const { data, loading, error, reload } = useData(api.products);
  const [dimension, setDimension] = useState<'category' | 'brand'>('category');
  const label = dimensions.find((item) => item.value === dimension)!.label;
  const rows = data ? stockBy(data, dimension) : [];

  const exportCsv = () =>
    downloadCsv(
      `reporte-stock-por-${dimension === 'category' ? 'categoria' : 'marca'}.csv`,
      toCsv(
        [label, 'Productos', 'Sin stock', 'Unidades', 'Valor a precio de venta'],
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
        title="Reportes"
        description="Reportes calculados con el catálogo publicado y su stock actual. Los reportes de ventas, comprobantes, caja y clientes requieren endpoints agregados que el backend todavía no ofrece."
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
      ) : rows.length ? (
        <section className="bo-card" aria-labelledby="report-title">
          <div className="checkout-card-head">
            <h2 id="report-title">Catálogo e inventario por {label.toLowerCase()}</h2>
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
