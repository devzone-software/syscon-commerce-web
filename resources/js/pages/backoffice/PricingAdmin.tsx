import { useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatCard } from '../../components/backoffice/StatCard';
import { AlertIcon, ArrowRightIcon, BuildingIcon, TrendIcon } from '../../components/icons';
import { api } from '../../services/api';
import { money } from '../../state';
import type { CategoryMargin, PriceReference, PriceSource, PriceSuggestion } from '../../types';
import { ErrorBox, Loading, useData } from '../../ui';

type Tab = 'suggestions' | 'references' | 'sources' | 'margins';
const dateTime = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' });
const when = (value: string | null) => (value ? dateTime.format(new Date(value)) : '—');
const referenceStatus: Record<PriceReference['status'], { label: string; tone: string }> = {
  OK: { label: 'Leído de la web', tone: 'tone-success' },
  MANUAL: { label: 'Escrito a mano', tone: 'tone-info' },
  ERROR: { label: 'No se pudo leer', tone: 'tone-danger' },
  PENDING: { label: 'Sin leer', tone: 'tone-warning' },
};

/** Reference prices from other companies' websites, and the selling price they suggest. */
export function PricingAdmin() {
  const [tab, setTab] = useState<Tab>('suggestions');
  const suggestions = useData(api.priceSuggestions, [], { keepPreviousData: true });
  const pending = suggestions.data?.filter((row) => row.status === 'UP' || row.status === 'DOWN');
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'suggestions', label: 'Sugerencias', count: pending?.length },
    { id: 'references', label: 'Enlaces de productos' },
    { id: 'sources', label: 'Empresas de referencia' },
    { id: 'margins', label: 'Márgenes por categoría' },
  ];
  return (
    <>
      <PageHeader
        title="Precios de referencia"
        description="Guía para fijar tus precios de venta. Toma el precio al que compras por mayor en las webs de tus proveedores (el más bajo, en soles con IGV), le suma el margen que quieres ganar en cada categoría y te muestra cuánto ganas por unidad. Tú decides: nada cambia hasta que apruebes el precio."
      />
      <div className="bo-tabs pricing-tabs" role="tablist" aria-label="Precios de referencia">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label} {item.count !== undefined && <small>{item.count}</small>}
          </button>
        ))}
      </div>
      {tab === 'suggestions' && <Suggestions state={suggestions} goTo={setTab} />}
      {tab === 'references' && <References onChange={suggestions.reload} />}
      {tab === 'sources' && <Sources />}
      {tab === 'margins' && <Margins onChange={suggestions.reload} />}
    </>
  );
}

function Suggestions({
  state,
  goTo,
}: {
  state: ReturnType<typeof useData<PriceSuggestion[]>>;
  goTo: (tab: Tab) => void;
}) {
  const { data, loading, error, reload } = state;
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (row) =>
          filter === 'all' ||
          row.status === 'UP' ||
          row.status === 'DOWN' ||
          row.status === 'NO_MARGIN',
      ),
    [data, filter],
  );
  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      up: all.filter((row) => row.status === 'UP').length,
      down: all.filter((row) => row.status === 'DOWN').length,
      noMargin: all.filter((row) => row.status === 'NO_MARGIN').length,
      tracked: all.length,
    };
  }, [data]);

  const act = async (id: string, action: () => Promise<unknown>, done: string) => {
    setBusy(id);
    setMessage('');
    try {
      await action();
      setMessage(done);
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  // Reads every link one by one, so each request stays short and the progress is visible.
  const refreshAll = async () => {
    setMessage('');
    const references = (await api.priceReferences()).filter((ref) => ref.sourceActive);
    setProgress({ done: 0, total: references.length });
    let failed = 0;
    for (const [index, ref] of references.entries()) {
      try {
        if ((await api.refreshReference(ref.id)).status === 'ERROR') failed++;
      } catch {
        failed++;
      }
      setProgress({ done: index + 1, total: references.length });
    }
    setProgress(null);
    setMessage(
      references.length
        ? `Precios leídos: ${references.length - failed} de ${references.length}.${failed ? ' Revisa los que fallaron en "Enlaces de productos".' : ''}`
        : 'Aún no hay enlaces. Agrégalos en "Enlaces de productos".',
    );
    reload();
  };

  return (
    <>
      <div className="bo-stats">
        <StatCard
          label="Productos con referencia"
          value={counts.tracked}
          icon={<BuildingIcon />}
          tone="blue"
        />
        <StatCard
          label="Para subir el precio"
          value={counts.up}
          icon={<TrendIcon />}
          tone="green"
          hint="Tu ganancia quedó baja"
        />
        <StatCard
          label="Para bajar el precio"
          value={counts.down}
          icon={<ArrowRightIcon />}
          tone="amber"
          hint="Puedes vender más barato"
        />
        <StatCard
          label="Sin margen configurado"
          value={counts.noMargin}
          icon={<AlertIcon />}
          tone={counts.noMargin ? 'red' : 'cyan'}
        />
      </div>
      <section className="bo-card">
        <div className="pricing-toolbar">
          <div className="bo-tabs" role="group" aria-label="Mostrar">
            <button
              type="button"
              aria-pressed={filter === 'pending'}
              onClick={() => setFilter('pending')}
            >
              Por revisar
            </button>
            <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              Todos
            </button>
          </div>
          <button
            type="button"
            className="button button-secondary"
            disabled={Boolean(progress)}
            onClick={() => void refreshAll()}
          >
            {progress
              ? `Leyendo ${progress.done} de ${progress.total}…`
              : 'Actualizar precios de las webs'}
          </button>
        </div>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : !rows.length ? (
          <p className="muted pricing-empty">
            {data?.length
              ? 'Todos tus precios están al día con sus referencias.'
              : 'Todavía no hay precios de referencia. Registra las empresas y luego enlaza tus productos con sus páginas.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table pricing-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" className="num">
                    Precio actual
                  </th>
                  <th scope="col">Costo al por mayor</th>
                  <th scope="col" className="num">
                    Ganancia hoy
                  </th>
                  <th scope="col">Precio sugerido</th>
                  <th scope="col">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const draft = drafts[row.productId] ?? row.suggestedPrice ?? '';
                  const change = row.suggestedPrice
                    ? Number(row.suggestedPrice) - Number(row.currentPrice)
                    : 0;
                  const cost = Number(row.referencePrice);
                  // What one unit leaves today, and with the price about to be approved.
                  const gainToday = Number(row.currentPrice) - cost;
                  const gainDraft = Number(draft) - cost;
                  return (
                    <tr key={row.productId}>
                      <td>
                        <strong>{row.name}</strong>
                        <small>
                          SKU {row.sku} · {row.category ?? 'Sin categoría'}
                          {!row.active && ' · No publicado'}
                        </small>
                      </td>
                      <td className="num">
                        <strong>{money(Number(row.currentPrice))}</strong>
                      </td>
                      <td>
                        <strong>{money(Number(row.referencePrice))}</strong>
                        <small>
                          {row.referenceSource} · {when(row.checkedAt)}
                        </small>
                        {row.references.length > 1 && (
                          <small className="pricing-others">
                            Otras:{' '}
                            {row.references
                              .slice(1)
                              .map((ref) => `${ref.source} ${money(Number(ref.price))}`)
                              .join(' · ')}
                          </small>
                        )}
                      </td>
                      <td className="num">
                        <strong
                          className={
                            gainToday < 0 ||
                            Number(row.currentMargin) < Number(row.categoryMargin ?? 0)
                              ? 'pricing-low'
                              : undefined
                          }
                        >
                          {gainToday < 0 ? '−' : ''}
                          {money(Math.abs(gainToday))}
                        </strong>
                        <small>
                          por unidad · {row.currentMargin} %
                          {row.categoryMargin ? ` (meta ${Number(row.categoryMargin)} %)` : ''}
                        </small>
                        {gainToday < 0 && (
                          <small className="pricing-low">Vendes por debajo del costo</small>
                        )}
                      </td>
                      <td>
                        {row.status === 'NO_MARGIN' ? (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => goTo('margins')}
                          >
                            Configura el margen de {row.category ?? 'la categoría'}
                          </button>
                        ) : (
                          <>
                            <label className="pricing-input">
                              <span className="visually-hidden">
                                Precio a aprobar para {row.name}
                              </span>
                              S/
                              <input
                                inputMode="decimal"
                                value={draft}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [row.productId]: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            {row.status === 'UP' || row.status === 'DOWN' ? (
                              <span
                                className={`status-badge ${change > 0 ? 'tone-success' : 'tone-warning'}`}
                              >
                                {change > 0 ? 'Subir' : 'Bajar'} {money(Math.abs(change))}
                              </span>
                            ) : (
                              <span className="status-badge tone-info">
                                {row.status === 'OK' ? 'Al día' : 'Revisado'}
                              </span>
                            )}
                            {Number(draft) > 0 && (
                              <small className={gainDraft < 0 ? 'pricing-low' : 'pricing-gain'}>
                                Ganarías {gainDraft < 0 ? '−' : ''}
                                {money(Math.abs(gainDraft))} por unidad (
                                {((gainDraft / cost) * 100).toFixed(1)} %)
                              </small>
                            )}
                          </>
                        )}
                      </td>
                      <td className="pricing-actions">
                        {row.status !== 'NO_MARGIN' && row.status !== 'OK' && (
                          <>
                            <button
                              type="button"
                              className="button button-primary"
                              disabled={busy === row.productId || !Number(draft)}
                              onClick={() =>
                                void act(
                                  row.productId,
                                  () => api.approvePrice(row.productId, Number(draft).toFixed(2)),
                                  `Precio de ${row.name} actualizado a ${money(Number(draft))}.`,
                                )
                              }
                            >
                              Aprobar
                            </button>
                            {row.status !== 'REVIEWED' && (
                              <button
                                type="button"
                                className="link-button"
                                disabled={busy === row.productId}
                                onClick={() =>
                                  void act(
                                    row.productId,
                                    () => api.dismissPrice(row.productId),
                                    `Sugerencia de ${row.name} ignorada hasta que cambie su costo.`,
                                  )
                                }
                              >
                                Ignorar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function References({ onChange }: { onChange: () => void }) {
  const references = useData(api.priceReferences);
  const sources = useData(api.priceSources);
  const products = useData(api.adminProducts);
  const [form, setForm] = useState({ productId: '', sourceId: '', url: '', price: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [manual, setManual] = useState<Record<string, string>>({});

  const sorted = useMemo(
    () => [...(products.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [products.data],
  );
  const activeSources = (sources.data ?? []).filter((source) => source.active);
  const host = activeSources.find((source) => source.id === form.sourceId)?.host;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const saved = await api.savePriceReference({
        productId: form.productId,
        sourceId: form.sourceId,
        url: form.url.trim(),
        price: form.price.trim() ? Number(form.price).toFixed(2) : undefined,
      });
      // Without a typed price, read it from the page right away.
      const read = form.price.trim() ? saved : await api.refreshReference(saved.id);
      setMessage(
        read.status === 'ERROR'
          ? `Enlace guardado, pero ${read.error?.toLowerCase() ?? 'no se pudo leer el precio.'}`
          : `Enlace guardado: ${read.product} en ${read.source}, ${money(Number(read.price))}.`,
      );
      setForm((current) => ({ ...current, url: '', price: '' }));
      references.reload();
      onChange();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id);
    setMessage('');
    try {
      await action();
      references.reload();
      onChange();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (sources.data && !activeSources.length)
    return (
      <section className="bo-card">
        <p className="muted">Primero registra al menos una empresa en "Empresas de referencia".</p>
      </section>
    );
  return (
    <>
      <section className="bo-card" aria-labelledby="pricing-link-title">
        <h2 id="pricing-link-title">Enlazar un producto</h2>
        <p className="bo-card-sub pricing-sub">
          Abre la página del mismo producto en la web de la empresa y copia su dirección. Si la
          página no deja leer el precio, escríbelo a mano.
        </p>
        <form className="pricing-form" onSubmit={(event) => void save(event)}>
          <label className="field">
            <span>Producto</span>
            <select
              required
              value={form.productId}
              onChange={(event) => setForm({ ...form, productId: event.target.value })}
            >
              <option value="">Elige un producto</option>
              {sorted.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.sku}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Empresa</span>
            <select
              required
              value={form.sourceId}
              onChange={(event) => setForm({ ...form, sourceId: event.target.value })}
            >
              <option value="">Elige una empresa</option>
              {activeSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field pricing-url">
            <span>Enlace del producto en su web</span>
            <input
              required
              type="url"
              value={form.url}
              placeholder={host ? `https://${host}/…` : 'https://…'}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Precio a mano (opcional)</span>
            <input
              inputMode="decimal"
              value={form.price}
              placeholder="S/ con IGV"
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </label>
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar enlace'}
          </button>
        </form>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </section>
      <section className="bo-card" aria-labelledby="pricing-links-title">
        <h2 id="pricing-links-title">Enlaces registrados</h2>
        {references.loading ? (
          <Loading />
        ) : references.error ? (
          <ErrorBox message={references.error} retry={references.reload} />
        ) : !references.data?.length ? (
          <p className="muted">Aún no hay enlaces.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Empresa</th>
                  <th scope="col" className="num">
                    Precio
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">Precio a mano</th>
                  <th scope="col">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {references.data.map((ref) => (
                  <tr key={ref.id}>
                    <td>
                      <strong>{ref.product}</strong>
                      <small>SKU {ref.sku}</small>
                    </td>
                    <td>
                      <strong>{ref.source}</strong>
                      <small>
                        <a href={ref.url} target="_blank" rel="noopener noreferrer nofollow">
                          Abrir página
                        </a>
                      </small>
                    </td>
                    <td className="num">
                      <strong>{ref.price ? money(Number(ref.price)) : '—'}</strong>
                      <small>{when(ref.checkedAt)}</small>
                    </td>
                    <td>
                      <span className={`status-badge ${referenceStatus[ref.status].tone}`}>
                        {referenceStatus[ref.status].label}
                      </span>
                      {ref.error && <small>{ref.error}</small>}
                    </td>
                    <td>
                      <form
                        className="pricing-manual"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const value = manual[ref.id];
                          if (value && Number(value) > 0)
                            void run(ref.id, () =>
                              api.manualReferencePrice(ref.id, Number(value).toFixed(2)),
                            );
                        }}
                      >
                        <input
                          inputMode="decimal"
                          aria-label={`Precio a mano de ${ref.product} en ${ref.source}`}
                          placeholder="S/"
                          value={manual[ref.id] ?? ''}
                          onChange={(event) =>
                            setManual({ ...manual, [ref.id]: event.target.value })
                          }
                        />
                        <button className="link-button" disabled={busy === ref.id}>
                          Guardar
                        </button>
                      </form>
                    </td>
                    <td className="pricing-actions">
                      <button
                        type="button"
                        className="link-button"
                        disabled={busy === ref.id}
                        onClick={() => void run(ref.id, () => api.refreshReference(ref.id))}
                      >
                        {busy === ref.id ? 'Leyendo…' : 'Leer ahora'}
                      </button>
                      <button
                        type="button"
                        className="link-button pricing-delete"
                        disabled={busy === ref.id}
                        onClick={() => void run(ref.id, () => api.deleteReference(ref.id))}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Sources() {
  const { data, loading, error, reload } = useData(api.priceSources);
  const [form, setForm] = useState({ name: '', website: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const saved = await api.savePriceSource(form);
      setMessage(`${saved.name} registrada (${saved.host}).`);
      setForm({ name: '', website: '' });
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const toggle = async (source: PriceSource) => {
    try {
      await api.savePriceSource(
        { name: source.name, website: source.host, active: !source.active },
        source.id,
      );
      reload();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  return (
    <>
      <section className="bo-card" aria-labelledby="pricing-source-title">
        <h2 id="pricing-source-title">Registrar empresa</h2>
        <p className="bo-card-sub pricing-sub">
          Las empresas cuyos precios quieres tomar como referencia, por ejemplo los mayoristas a los
          que compras.
        </p>
        <form className="pricing-form" onSubmit={(event) => void save(event)}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="field pricing-url">
            <span>Web</span>
            <input
              required
              value={form.website}
              placeholder="empresa.com.pe"
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
          </label>
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </section>
      <section className="bo-card" aria-labelledby="pricing-sources-title">
        <h2 id="pricing-sources-title">Empresas registradas</h2>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : !data?.length ? (
          <p className="muted">Aún no hay empresas.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Empresa</th>
                  <th scope="col" className="num">
                    Productos enlazados
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <strong>{source.name}</strong>
                      <small>{source.host}</small>
                    </td>
                    <td className="num">{source.links}</td>
                    <td>
                      <span
                        className={`status-badge ${source.active ? 'tone-success' : 'tone-warning'}`}
                      >
                        {source.active ? 'Se compara' : 'Pausada'}
                      </span>
                    </td>
                    <td className="pricing-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => void toggle(source)}
                      >
                        {source.active ? 'Pausar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Margins({ onChange }: { onChange: () => void }) {
  const { data, loading, error, reload } = useData(api.categoryMargins);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const save = async (row: CategoryMargin) => {
    const value = (drafts[row.categoryId] ?? row.margin ?? '').trim();
    setMessage('');
    try {
      await api.saveCategoryMargin(row.categoryId, value === '' ? null : Number(value).toFixed(2));
      setSaved(row.categoryId);
      reload();
      onChange();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  return (
    <section className="bo-card" aria-labelledby="pricing-margins-title">
      <h2 id="pricing-margins-title">Márgenes por categoría</h2>
      <p className="bo-card-sub pricing-sub">
        Porcentaje que se suma al costo de referencia. El resultado se redondea hacia arriba a .90
        (por ejemplo, S/ 262.50 queda en S/ 262.90).
      </p>
      {message && <ErrorBox message={message} />}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Categoría</th>
                <th scope="col">Margen</th>
                <th scope="col">Ejemplo con costo de S/ 100</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row) => {
                const value = drafts[row.categoryId] ?? row.margin ?? '';
                const example =
                  value === '' ? null : Math.ceil(100 * (1 + Number(value) / 100) - 0.9) + 0.9;
                return (
                  <tr key={row.categoryId}>
                    <td>
                      <strong>{row.category}</strong>
                    </td>
                    <td>
                      <label className="pricing-input">
                        <span className="visually-hidden">Margen de {row.category}</span>
                        <input
                          inputMode="decimal"
                          value={value === '' ? '' : String(Number(value) || value)}
                          placeholder="—"
                          onChange={(event) => {
                            setSaved(null);
                            setDrafts({ ...drafts, [row.categoryId]: event.target.value });
                          }}
                        />
                        %
                      </label>
                    </td>
                    <td>
                      {example === null || Number.isNaN(example)
                        ? 'Sin margen: no se sugieren precios'
                        : `Se vende en ${money(example)}`}
                    </td>
                    <td className="pricing-actions">
                      <button type="button" className="link-button" onClick={() => void save(row)}>
                        {saved === row.categoryId ? 'Guardado ✓' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
