import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { CatalogToolsNav } from '../../components/backoffice/CatalogToolsNav';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { downloadCsv, toCsv } from '../../lib/csv';
import { previewImages, imageUpdate, type ImageRow } from '../../lib/productImages';
import { api } from '../../services/api';
import { ErrorBox, Loading, useData } from '../../ui';

export function ProductImagesAdmin() {
  const catalog = useData(api.adminProducts);
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<number, string>>({});
  const [page, setPage] = useState(0);
  const stop = useRef(false);
  const lock = useRef(false);
  useEffect(
    () => () => {
      stop.current = true;
    },
    [],
  );
  const read = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || lock.current) return;
    setRows([]);
    setError('');
    setAccepted(false);
    setResults({});
    setPage(0);
    try {
      if (file.size > 1_000_000) throw Error('El archivo supera 1 MB.');
      setRows(previewImages(await file.text(), await api.adminProducts()));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const valid = rows.filter((r) => !r.errors.length && results[r.line] !== 'Guardado');
  const apply = async () => {
    if (lock.current || !accepted || !valid.length) return;
    lock.current = true;
    stop.current = false;
    setRunning(true);
    setError('');
    for (const row of valid) {
      if (stop.current) break;
      try {
        const payload = imageUpdate(row, await api.adminProducts());
        if (stop.current) break;
        await api.saveProduct(payload);
        setResults((r) => ({ ...r, [row.line]: 'Guardado' }));
      } catch (e) {
        setResults((r) => ({ ...r, [row.line]: (e as Error).message }));
      }
    }
    lock.current = false;
    setRunning(false);
    setAccepted(false);
    catalog.reload();
  };
  return (
    <>
      <CatalogToolsNav />
      <PageHeader
        title="Imágenes por lote"
        description="Asocia enlaces de fotos a tus productos usando su SKU. No sube archivos de imagen ni crea productos."
      />
      <section className="bo-card form-stack">
        <h2>1. Prepara tu archivo</h2>
        <p className="muted">
          CSV con sku e imageUrl. Para quitar una imagen, deja el enlace vacío y escribe remove en
          action. Reemplazar usa replace. Máximo 500 filas.
        </p>
        {catalog.loading ? (
          <Loading />
        ) : catalog.error ? (
          <ErrorBox message={catalog.error} retry={catalog.reload} />
        ) : (
          <button
            type="button"
            className="button button-secondary"
            disabled={running}
            onClick={() =>
              downloadCsv(
                'imagenes-productos.csv',
                toCsv(
                  ['sku', 'imageUrl', 'action'],
                  (catalog.data ?? []).map((p) => [p.sku, p.imageUrl ?? '', 'replace']),
                ),
              )
            }
          >
            Descargar lista de imágenes
          </button>
        )}
        <label className="field">
          Seleccionar CSV
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={running || catalog.loading || Boolean(catalog.error)}
            onChange={read}
          />
        </label>
        {error && <ErrorBox message={error} />}
      </section>
      {rows.length > 0 && (
        <section className="bo-card form-stack">
          <h2>2. Revisa los cambios</h2>
          <p className="muted">
            {rows.length} filas · {rows.filter((r) => r.errors.length).length} con errores ·{' '}
            {Object.values(results).filter((s) => s === 'Guardado').length} guardadas
          </p>
          <ul className="image-batch-list">
            {rows.slice(page * 20, (page + 1) * 20).map((row) => (
              <li key={row.line}>
                <div>
                  <strong>{row.sku || 'Sin SKU'}</strong>
                  <small>{row.product?.name}</small>
                  <span>{row.imageUrl ? 'Cambiar imagen' : 'Quitar imagen'}</span>
                </div>
                <div className="image-batch-links">
                  <small>Actual: {row.product?.imageUrl || 'Sin imagen'}</small>
                  <small>Nueva: {row.imageUrl || 'Sin imagen'}</small>
                  {row.imageUrl && !row.errors.length && (
                    <a
                      href={row.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      Ver imagen
                    </a>
                  )}
                </div>
                <p
                  className={
                    row.errors.length || (results[row.line] && results[row.line] !== 'Guardado')
                      ? 'field-error'
                      : 'muted'
                  }
                  role="status"
                >
                  {row.errors.join(' ') || results[row.line] || 'Pendiente'}
                </p>
              </li>
            ))}
          </ul>
          {rows.length > 20 && (
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>
                {page + 1} / {Math.ceil(rows.length / 20)}
              </span>
              <button
                type="button"
                className="button button-secondary"
                disabled={(page + 1) * 20 >= rows.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
          <p className="flow-note">
            Se conservan los demás datos consultados del producto. Evita editar el catálogo o
            registrar movimientos de stock mientras se aplica el lote.
          </p>
          <label className="facet-option">
            <input
              type="checkbox"
              checked={accepted}
              disabled={running}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            He revisado las imágenes que se cambiarán o quitarán. Las filas con errores se omiten.
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="button button-primary"
              disabled={!accepted || running || !valid.length}
              onClick={apply}
            >
              {running ? 'Aplicando…' : `Aplicar ${valid.length} cambios`}
            </button>
            {running && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  stop.current = true;
                }}
              >
                Detener después del actual
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
