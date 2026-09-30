import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { Pagination } from '../../components/shared/Pagination';
import { paginate } from '../../lib/catalog';
import { downloadCsv } from '../../lib/csv';
import {
  MAX_IMPORT_ROWS,
  previewProductImport,
  productCsvColumns,
  productCsvTemplate,
  productsToCsv,
  type ImportPreview,
  type ImportRow,
} from '../../lib/productCsv';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, ErrorBox, Loading } from '../../ui';

const MAX_FILE_BYTES = 1_000_000;
const PAGE_SIZE = 20;

type Outcome = { status: 'ok' } | { status: 'error'; message: string };

function RowStatus({ row, outcome }: { row: ImportRow; outcome?: Outcome }) {
  if (outcome?.status === 'ok') return <span className="status-badge tone-success">Guardado</span>;
  if (outcome?.status === 'error') return <span className="status-badge tone-danger">Falló</span>;
  if (row.errors.length) return <span className="status-badge tone-danger">Con errores</span>;
  return (
    <span className={`status-badge ${row.action === 'update' ? 'tone-warning' : 'tone-info'}`}>
      {row.action === 'update' ? 'Actualizará' : 'Creará'}
    </span>
  );
}

export function ProductBulkAdmin() {
  const catalog = useData(api.products);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [page, setPage] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [running, setRunning] = useState(false);
  const [outcomes, setOutcomes] = useState<Map<number, Outcome>>(new Map());
  const [finished, setFinished] = useState<'done' | 'stopped' | null>(null);
  const stopRequested = useRef(false);

  const reset = () => {
    setPreview(null);
    setAccepted(false);
    setOutcomes(new Map());
    setFinished(null);
    setOnlyErrors(false);
    setPage(1);
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    reset();
    setFileError('');
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_FILE_BYTES) {
      setFileError('El archivo supera 1 MB. Divídelo en partes más pequeñas.');
      return;
    }
    const published = (catalog.data ?? []).map((product) => product.sku);
    setPreview(previewProductImport(await file.text(), published));
  };

  const valid = preview?.rows.filter((row) => !row.errors.length) ?? [];
  const invalid = (preview?.rows.length ?? 0) - valid.length;
  const updates = valid.filter((row) => row.action === 'update').length;
  const done = [...outcomes.values()];
  const saved = done.filter((outcome) => outcome.status === 'ok').length;
  const failed = done.length - saved;

  // The backend has no bulk endpoint: rows are upserted one by one through the BFF.
  const runImport = async () => {
    setRunning(true);
    setFinished(null);
    stopRequested.current = false;
    const results = new Map<number, Outcome>();
    for (const row of valid) {
      if (stopRequested.current) break;
      try {
        await api.saveProduct(row.input);
        results.set(row.line, { status: 'ok' });
      } catch (e) {
        results.set(row.line, { status: 'error', message: (e as Error).message });
      }
      setOutcomes(new Map(results));
    }
    setFinished(stopRequested.current ? 'stopped' : 'done');
    setRunning(false);
    catalog.reload();
  };

  const rows = (preview?.rows ?? []).filter(
    (row) => !onlyErrors || row.errors.length || outcomes.get(row.line)?.status === 'error',
  );
  const current = paginate(rows, page, PAGE_SIZE);
  const importing = running || finished !== null;

  return (
    <>
      <PageHeader
        title="Carga masiva de productos"
        description="Exporta el catálogo publicado o importa productos desde un archivo CSV. Cada fila se guarda con el mismo upsert por SKU que el formulario de productos."
        actions={
          <Link className="button button-secondary" to="/admin/productos">
            Volver a productos
          </Link>
        }
      />
      <div className="bo-two-columns">
        <section className="bo-card" aria-labelledby="export-title">
          <h2 id="export-title">Exportar</h2>
          <p className="muted">
            Descarga los productos publicados en el mismo formato que acepta la importación. Los
            productos inactivos no se incluyen porque el backend no los lista.
          </p>
          {catalog.loading ? (
            <Loading />
          ) : catalog.error ? (
            <ErrorBox message={catalog.error} retry={catalog.reload} />
          ) : (
            <div className="form-actions">
              <button
                type="button"
                className="button button-primary"
                disabled={!catalog.data?.length}
                onClick={() =>
                  downloadCsv('catalogo-syscon.csv', productsToCsv(catalog.data ?? []))
                }
              >
                Descargar catálogo ({catalog.data?.length ?? 0})
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => downloadCsv('plantilla-productos.csv', productCsvTemplate())}
              >
                Descargar plantilla
              </button>
            </div>
          )}
        </section>
        <section className="bo-card" aria-labelledby="import-title">
          <h2 id="import-title">Importar</h2>
          <p className="muted">
            CSV en UTF-8 separado por punto y coma o coma, con cabecera. Columnas obligatorias:{' '}
            <code>sku, name, price, stock</code>; opcionales:{' '}
            <code>{productCsvColumns.slice(4).join(', ')}</code>. Máximo {MAX_IMPORT_ROWS} filas.
          </p>
          <label className="field">
            Archivo CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={readFile}
              disabled={running || catalog.loading}
            />
          </label>
          {catalog.loading && (
            <p className="muted">Cargando el catálogo para detectar SKU existentes…</p>
          )}
          {fileError && <ErrorBox message={fileError} />}
        </section>
      </div>

      {preview && (
        <section className="bo-card" aria-labelledby="preview-title">
          <div className="checkout-card-head">
            <h2 id="preview-title">Vista previa: {fileName}</h2>
            {!running && (
              <button type="button" className="link-button" onClick={reset}>
                Descartar archivo
              </button>
            )}
          </div>
          {preview.fileErrors.map((message) => (
            <p key={message} className={`notice${preview.rows.length ? '' : ' error'}`}>
              {message}
            </p>
          ))}
          {preview.rows.length > 0 && (
            <>
              <div className="bo-stats">
                <StatCard label="Filas" value={preview.rows.length} />
                <StatCard label="Nuevos" value={valid.length - updates} />
                <StatCard label="Actualizaciones" value={updates} />
                <StatCard label="Con errores" value={invalid} hint="No se importarán." />
              </div>

              {!importing && valid.length > 0 && (
                <div className="form-stack bo-import-confirm">
                  <label className="facet-option">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(event) => setAccepted(event.target.checked)}
                    />
                    <span>
                      Entiendo que las {updates} filas con SKU existente reemplazarán nombre,
                      precio, stock, imagen, categoría, marca y estado, y que el stock no genera
                      movimientos de inventario.
                    </span>
                  </label>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={!accepted}
                      onClick={runImport}
                    >
                      Importar {valid.length} {valid.length === 1 ? 'producto' : 'productos'}
                    </button>
                  </div>
                </div>
              )}

              {importing && (
                <div className="bo-import-progress" aria-live="polite">
                  <progress max={valid.length} value={done.length} />
                  <p>
                    {done.length} de {valid.length} procesados · {saved} guardados
                    {failed > 0 && ` · ${failed} con error`}
                  </p>
                  {running ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        stopRequested.current = true;
                      }}
                    >
                      Detener después de la fila actual
                    </button>
                  ) : (
                    <p className={`notice ${failed ? 'error' : 'success'}`} role="status">
                      {finished === 'stopped'
                        ? `Importación detenida: se procesaron ${done.length} de ${valid.length} filas.`
                        : failed
                          ? `Importación terminada con ${failed} filas fallidas. Revisa el detalle.`
                          : 'Importación terminada correctamente.'}
                    </p>
                  )}
                </div>
              )}

              <div className="catalog-toolbar-row">
                <p className="catalog-count">
                  {rows.length} {rows.length === 1 ? 'fila' : 'filas'}
                </p>
                <label className="facet-option">
                  <input
                    type="checkbox"
                    checked={onlyErrors}
                    onChange={(event) => {
                      setOnlyErrors(event.target.checked);
                      setPage(1);
                    }}
                  />
                  <span>Solo filas con errores</span>
                </label>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col" className="num">
                        Línea
                      </th>
                      <th scope="col">Producto</th>
                      <th scope="col">Categoría / marca</th>
                      <th scope="col" className="num">
                        Precio
                      </th>
                      <th scope="col" className="num">
                        Stock
                      </th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.items.map((row) => {
                      const outcome = outcomes.get(row.line);
                      const messages = [
                        ...row.errors,
                        ...(outcome?.status === 'error' ? [outcome.message] : []),
                      ];
                      return (
                        <tr key={row.line}>
                          <td className="num">{row.line}</td>
                          <td>
                            <strong>{row.input.name || '—'}</strong>
                            <small>
                              SKU {row.input.sku || '—'}
                              {!row.input.active && ' · no publicado'}
                            </small>
                            {messages.map((message) => (
                              <small key={message} className="field-error">
                                {message}
                              </small>
                            ))}
                          </td>
                          <td>
                            {row.input.category ?? '—'}
                            <small>{row.input.brand ?? '—'}</small>
                          </td>
                          <td className="num">
                            {Number.isFinite(row.input.price) ? money(row.input.price) : '—'}
                          </td>
                          <td className="num">
                            {Number.isFinite(row.input.stock) ? row.input.stock : '—'}
                          </td>
                          <td>
                            <RowStatus row={row} outcome={outcome} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={current.page} pages={current.pages} onChange={setPage} />
            </>
          )}
        </section>
      )}
    </>
  );
}
