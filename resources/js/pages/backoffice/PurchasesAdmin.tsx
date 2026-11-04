import { useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { formatDateTime } from '../../lib/orders';
import { purchaseLineError, purchaseTotal, type PurchaseLine } from '../../lib/purchases';
import { api } from '../../services/api';
import { money } from '../../state';
import type { Product } from '../../types';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const PER_PAGE = 20;
const emptyLine = (): PurchaseLine => ({ productId: '', quantity: '', unitCost: '' });

function PurchaseForm({ products, onSaved }: { products: Product[]; onSaved: () => void }) {
  const [supplierName, setSupplierName] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([emptyLine()]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const setLine = (index: number, change: Partial<PurchaseLine>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...change } : line)));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (supplierName.trim().length < 2) return setError('Indica el proveedor.');
    const found = lines.map(purchaseLineError).find(Boolean);
    if (found) return setError(found);
    if (new Set(lines.map((line) => line.productId)).size !== lines.length)
      return setError('Cada producto va en una sola línea.');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const saved = await api.createPurchase({
        supplierName: supplierName.trim(),
        documentRef: documentRef.trim() || null,
        notes: notes.trim() || null,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitCost: line.unitCost.trim(),
        })),
      });
      setMessage(
        `Compra registrada por ${money(Number(saved.total))}: ${saved.items.length} productos ingresaron al inventario.`,
      );
      setSupplierName('');
      setDocumentRef('');
      setNotes('');
      setLines([emptyLine()]);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="bo-card form-stack"
      onSubmit={submit}
      noValidate
      aria-labelledby="purchase-title"
    >
      <h2 id="purchase-title">Registrar compra al por mayor</h2>
      <p className="muted">
        Las unidades se suman al stock y quedan disponibles para la venta al{' '}
        <strong>precio del catálogo</strong>; el costo unitario se guarda como último costo del
        producto.
      </p>
      <div className="field-row">
        <label className="field">
          Proveedor
          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            maxLength={255}
            required
          />
        </label>
        <label className="field">
          Factura o guía (opcional)
          <input
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
            maxLength={60}
            placeholder="F001-000123"
          />
        </label>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col" className="num">
                Cantidad
              </th>
              <th scope="col" className="num">
                Costo unitario (S/)
              </th>
              <th scope="col" className="num">
                Subtotal
              </th>
              <th scope="col">
                <span className="visually-hidden">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const product = byId.get(line.productId);
              const subtotal = Number(line.quantity) * Number(line.unitCost);
              return (
                <tr key={index}>
                  <td>
                    <select
                      aria-label={`Producto de la línea ${index + 1}`}
                      value={line.productId}
                      onChange={(e) => setLine(index, { productId: e.target.value })}
                    >
                      <option value="">Elige un producto…</option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.sku} · {option.name}
                        </option>
                      ))}
                    </select>
                    {product && (
                      <small>
                        Stock disponible {product.stock} · precio de venta{' '}
                        {money(Number(product.price))}
                      </small>
                    )}
                  </td>
                  <td className="num">
                    <input
                      aria-label={`Cantidad de la línea ${index + 1}`}
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(e) => setLine(index, { quantity: e.target.value })}
                    />
                  </td>
                  <td className="num">
                    <input
                      aria-label={`Costo unitario de la línea ${index + 1}`}
                      inputMode="decimal"
                      value={line.unitCost}
                      onChange={(e) => setLine(index, { unitCost: e.target.value })}
                      placeholder="0.00"
                    />
                    {product && Number(line.unitCost) >= Number(product.price) && (
                      <small className="field-error">Igual o mayor que el precio de venta</small>
                    )}
                  </td>
                  <td className="num">
                    {Number.isFinite(subtotal) && subtotal > 0 ? money(subtotal) : '—'}
                  </td>
                  <td className="num">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                      >
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setLines((current) => [...current, emptyLine()])}
        >
          Agregar producto
        </button>
        <strong>Total: {money(purchaseTotal(lines))}</strong>
      </div>
      <label className="field">
        Notas (opcional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
        />
      </label>
      {error && <ErrorBox message={error} />}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Registrando…' : 'Registrar compra'}
        </button>
      </div>
    </form>
  );
}

export function PurchasesAdmin() {
  const products = useData(api.products);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useData(() => api.purchases(page), [page]);
  const [open, setOpen] = useState('');

  return (
    <>
      <PageHeader
        title="Compras al por mayor"
        description="Mercadería comprada a proveedores a precio de mayorista que ingresa al inventario para venderse en tienda."
      />
      {products.loading ? (
        <Loading />
      ) : products.error ? (
        <ErrorBox message={products.error} retry={products.reload} />
      ) : (
        <PurchaseForm
          products={products.data ?? []}
          onSaved={() => {
            products.reload();
            if (page === 1) reload();
            else setPage(1);
          }}
        />
      )}
      <section className="bo-card" aria-labelledby="purchases-title">
        <h2 id="purchases-title">Compras registradas</h2>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : data?.items.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Proveedor</th>
                    <th scope="col" className="num">
                      Productos
                    </th>
                    <th scope="col" className="num">
                      Total
                    </th>
                    <th scope="col">Registró</th>
                    <th scope="col">
                      <span className="visually-hidden">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{formatDateTime(purchase.createdAt)}</td>
                      <td>
                        <strong>{purchase.supplierName}</strong>
                        {purchase.documentRef && <small>{purchase.documentRef}</small>}
                        {open === purchase.id && (
                          <ul className="bo-simple-list">
                            {purchase.items.map((item) => (
                              <li key={item.productId}>
                                <span>
                                  <strong>
                                    {item.quantity} × {item.name}
                                  </strong>
                                  <small>
                                    {item.sku} · {money(Number(item.unitCost))} c/u ·{' '}
                                    {money(Number(item.subtotal))}
                                  </small>
                                </span>
                              </li>
                            ))}
                            {purchase.notes && (
                              <li>
                                <span>
                                  <small>{purchase.notes}</small>
                                </span>
                              </li>
                            )}
                          </ul>
                        )}
                      </td>
                      <td className="num">
                        {purchase.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="num">{money(Number(purchase.total))}</td>
                      <td>{purchase.createdBy ?? '—'}</td>
                      <td className="num">
                        <button
                          type="button"
                          className="link-button"
                          aria-expanded={open === purchase.id}
                          onClick={() => setOpen(open === purchase.id ? '' : purchase.id)}
                        >
                          {open === purchase.id ? 'Ocultar' : 'Detalle'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={Math.ceil(data.total / PER_PAGE)} onChange={setPage} />
          </>
        ) : (
          <Empty title="Sin compras" text="Las compras que registres aparecerán aquí." />
        )}
      </section>
    </>
  );
}
