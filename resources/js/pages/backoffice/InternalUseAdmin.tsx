import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { formatDateTime } from '../../lib/orders';
import { internalUseError } from '../../lib/purchases';
import { api } from '../../services/api';
import { money } from '../../state';
import type { Product } from '../../types';
import { useData, ErrorBox, Loading, Empty } from '../../ui';

const PER_PAGE = 20;

function InternalUseForm({ products, onSaved }: { products: Product[]; onSaved: () => void }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const product = products.find((option) => option.id === productId);

  const check = (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!product) return setError('Elige el producto.');
    const found = internalUseError(quantity, product.stock, reason);
    if (found) return setError(found);
    setError('');
    setConfirming(true);
  };
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const use = await api.createInternalUse({
        productId,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      setMessage(
        `Se retiraron ${use.quantity} × ${use.name}: ya no están disponibles para la venta.`,
      );
      setProductId('');
      setQuantity('1');
      setReason('');
      setConfirming(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="bo-card form-stack"
      onSubmit={check}
      noValidate
      aria-labelledby="internal-title"
    >
      <h2 id="internal-title">Retirar para uso interno</h2>
      <p className="muted">
        Las unidades retiradas salen del stock:{' '}
        <strong>no se pueden vender en la tienda ni facturar</strong>. Solo se retira lo disponible;
        lo reservado por pedidos pendientes no se toca.
      </p>
      <div className="field-row">
        <label className="field">
          Producto
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setConfirming(false);
            }}
          >
            <option value="">Elige un producto…</option>
            {products.map((option) => (
              <option key={option.id} value={option.id} disabled={option.stock < 1}>
                {option.sku} · {option.name} ({option.stock} disp.)
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Cantidad
          <input
            type="number"
            min="1"
            max={product?.stock}
            step="1"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setConfirming(false);
            }}
          />
        </label>
      </div>
      <label className="field">
        Motivo
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={255}
          placeholder="Ej.: equipo para la oficina, repuesto del taller, muestra para demo"
        />
      </label>
      {error && <ErrorBox message={error} />}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      {confirming && product ? (
        <div className="bo-confirm" role="alertdialog" aria-label="Confirmar retiro">
          <span>
            Vas a retirar{' '}
            <strong>
              {quantity} × {product.name}
            </strong>
            . Quedarán {product.stock - Number(quantity)} unidades disponibles para la venta. Esta
            acción no se deshace desde aquí.
          </span>
          <span className="bo-inline-confirm">
            <button type="button" className="button button-danger" disabled={busy} onClick={save}>
              {busy ? 'Registrando…' : 'Confirmar retiro'}
            </button>
            <button type="button" className="link-button" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </span>
        </div>
      ) : (
        <div className="form-actions">
          <button type="submit" className="button button-primary">
            Retirar del inventario
          </button>
        </div>
      )}
    </form>
  );
}

export function InternalUseAdmin() {
  const products = useData(api.products);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useData(() => api.internalUses(page), [page]);

  return (
    <>
      <PageHeader
        title="Uso interno"
        description="Productos del inventario que se toman para uso de la empresa y dejan de estar a la venta."
      />
      {products.loading ? (
        <Loading />
      ) : products.error ? (
        <ErrorBox message={products.error} retry={products.reload} />
      ) : (
        <InternalUseForm
          products={products.data ?? []}
          onSaved={() => {
            products.reload();
            if (page === 1) reload();
            else setPage(1);
          }}
        />
      )}
      <section className="bo-card" aria-labelledby="internal-list-title">
        <h2 id="internal-list-title">Retiros registrados</h2>
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
                    <th scope="col">Producto</th>
                    <th scope="col" className="num">
                      Cantidad
                    </th>
                    <th scope="col" className="num">
                      Valor a costo
                    </th>
                    <th scope="col">Motivo</th>
                    <th scope="col">Registró</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((use) => (
                    <tr key={use.id}>
                      <td>{formatDateTime(use.createdAt)}</td>
                      <td>
                        <strong>{use.name}</strong>
                        <small>{use.sku}</small>
                      </td>
                      <td className="num">{use.quantity}</td>
                      <td className="num">
                        {use.costValue === null ? '—' : money(Number(use.costValue))}
                      </td>
                      <td>{use.reason}</td>
                      <td>{use.createdBy ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={Math.ceil(data.total / PER_PAGE)} onChange={setPage} />
          </>
        ) : (
          <Empty title="Sin retiros" text="Los retiros para uso interno aparecerán aquí." />
        )}
      </section>
    </>
  );
}
