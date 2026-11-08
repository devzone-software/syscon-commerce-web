import { CustomerPicker } from '../../components/backoffice/CustomerPicker';
import { SaleResult } from '../../components/backoffice/SaleResult';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { BillingFields } from '../../components/checkout/BillingFields';
import {
  billingPayload,
  invoiceTypeLabel,
  validateBilling,
  type BillingForm,
} from '../../lib/billing';
import { addToCart, cartTotal, setCartQuantity } from '../../lib/cart';
import { matchesQuery } from '../../lib/catalog';
import {
  billingForCustomer,
  cashChange,
  paymentError,
  paymentMethods,
  type SalePayment,
} from '../../lib/sales';
import { api } from '../../services/api';
import { money } from '../../state';
import type { CartLine, CustomerMatch, Invoice, StoreSale } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

const emptyBilling: BillingForm = {
  type: '03',
  documentType: '1',
  documentNumber: '',
  name: '',
  address: '',
};

export function DirectSale() {
  const catalog = useData(api.products);
  const cash = useData(api.cashCurrent);
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerMatch | null>(null);
  const [billing, setBilling] = useState<BillingForm>(emptyBilling);
  const [billingErrors, setBillingErrors] = useState<ReturnType<typeof validateBilling>>({});
  const [payment, setPayment] = useState<SalePayment>({
    method: 'CASH',
    reference: '',
    received: '',
  });
  const [issue, setIssue] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // One key per sale attempt: a retry after a network error does not charge twice.
  const [attempt, setAttempt] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<{
    sale: StoreSale;
    invoice: Invoice | null;
    invoiceError: string;
    change: number;
  } | null>(null);

  const total = cartTotal(lines);
  const cashOpen = cash.data?.status === 'OPEN';
  const cashUnavailable = cash.loading || Boolean(cash.error) || !cashOpen;
  const matches =
    query.trim().length >= 2 && catalog.data
      ? catalog.data.filter((p) => p.active && matchesQuery(p, query)).slice(0, 8)
      : [];
  const payError = lines.length ? paymentError(payment, total) : null;

  const pickCustomer = (picked: CustomerMatch | null) => {
    setCustomer(picked);
    setBilling(picked ? billingForCustomer(picked) : emptyBilling);
    setBillingErrors({});
  };

  const reset = () => {
    setLines([]);
    setQuery('');
    pickCustomer(null);
    setPayment({ method: 'CASH', reference: '', received: '' });
    setResult(null);
    setError('');
    setAttempt(crypto.randomUUID());
    catalog.reload();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!cash.data || cash.loading || cash.error)
      return setError('Abre una caja antes de cobrar esta venta.');
    const found = validateBilling(billing, total);
    setBillingErrors(found);
    if (!lines.length) return setError('Agrega al menos un producto.');
    if (Object.keys(found).length || payError) return;
    setBusy(true);
    try {
      const billingData = billingPayload(billing);
      const sale = await api.createSale({
        items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        customerId: customer?.id ?? null,
        billing: billingData,
        payment: {
          method: payment.method,
          reference: payment.method === 'CASH' ? null : payment.reference.trim(),
        },
        idempotencyKey: attempt,
      });
      let invoice: Invoice | null = null;
      let invoiceError = '';
      if (issue) {
        try {
          const draft = await api.createInvoice({
            orderId: sale.id,
            type: billingData.type,
            series: null,
            customerDocumentType: billingData.documentType,
            customerDocumentNumber: billingData.documentNumber,
            customerName: billingData.name,
            referencedSerialNumber: null,
          });
          invoice = draft.status === 'ACCEPTED' ? draft : await api.submitInvoice(draft.id);
        } catch (e) {
          invoiceError = (e as Error).message;
        }
      }
      setResult({
        sale,
        invoice,
        invoiceError,
        change: payment.method === 'CASH' ? cashChange(payment.received, Number(sale.total)) : 0,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (result) return <SaleResult {...result} onNew={reset} />;

  return (
    <>
      <PageHeader
        title="Venta directa"
        description="Venta en tienda: el precio, el stock y el IGV los valida el sistema; el pago queda aprobado y el pedido entregado al registrar."
      />
      {cash.error ? (
        <ErrorBox message="No pudimos comprobar el estado de la caja." retry={cash.reload} />
      ) : !cash.loading && !cashOpen ? (
        <p className="notice error" role="alert">
          No tienes una caja abierta: ábrela en <Link to="/admin/caja">Caja</Link> antes de cobrar.
        </p>
      ) : null}
      <form onSubmit={submit} noValidate className="bo-detail-grid">
        <section className="bo-card form-stack" aria-labelledby="sale-products-title">
          <h2 id="sale-products-title">Productos</h2>
          {catalog.loading && !catalog.data ? (
            <Loading />
          ) : catalog.error ? (
            <ErrorBox message={catalog.error} retry={catalog.reload} />
          ) : (
            <>
              <label className="field">
                Buscar producto
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre, SKU, marca o categoría"
                />
              </label>
              {matches.length > 0 && (
                <ul className="bo-simple-list">
                  {matches.map((product) => (
                    <li key={product.id}>
                      <span>
                        <strong>{product.name}</strong>
                        <small>
                          {product.sku} · {money(Number(product.price))} · stock {product.stock}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="link-button"
                        disabled={product.stock < 1}
                        onClick={() => setLines((current) => addToCart(current, product))}
                      >
                        {product.stock < 1 ? 'Sin stock' : 'Agregar'}
                        <span className="visually-hidden"> {product.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {lines.length > 0 ? (
            <div className="table-wrap responsive-table is-entry">
              <table className="data-table">
                <caption className="visually-hidden">Productos de la venta</caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col" className="num">
                      Cantidad
                    </th>
                    <th scope="col" className="num">
                      Importe
                    </th>
                    <th scope="col">
                      <span className="visually-hidden">Quitar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.product.id}>
                      <td data-label="Producto">
                        <strong>{line.product.name}</strong>
                        <small>
                          {money(Number(line.product.price))} c/u · stock {line.product.stock}
                        </small>
                      </td>
                      <td data-label="Cantidad" className="num">
                        <input
                          type="number"
                          min={1}
                          max={line.product.stock}
                          value={line.quantity}
                          aria-label={`Cantidad de ${line.product.name}`}
                          onChange={(e) =>
                            setLines((current) =>
                              setCartQuantity(current, line.product.id, Number(e.target.value)),
                            )
                          }
                          style={{ width: '5em' }}
                        />
                      </td>
                      <td data-label="Importe" className="num">
                        {money(Number(line.product.price) * line.quantity)}
                      </td>
                      <td data-label="Quitar" className="num">
                        <button
                          type="button"
                          className="link-button"
                          onClick={() =>
                            setLines((current) => setCartQuantity(current, line.product.id, 0))
                          }
                        >
                          Quitar<span className="visually-hidden"> {line.product.name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={2}>
                      Total (IGV incluido)
                    </th>
                    <td className="num">
                      <strong>{money(total)}</strong>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="muted">Busca y agrega los productos que lleva el cliente.</p>
          )}
        </section>

        <section className="bo-card form-stack" aria-labelledby="sale-customer-title">
          <h2 id="sale-customer-title">Cliente y comprobante</h2>
          <CustomerPicker customer={customer} onPick={pickCustomer} />
          <BillingFields
            context="staff"
            type={billing.type}
            form={billing}
            errors={billingErrors}
            onType={(type) =>
              setBilling((current) => ({
                ...current,
                type,
                documentType:
                  type === '01' ? '6' : current.documentType === '6' ? '1' : current.documentType,
              }))
            }
            onChange={(patch) => setBilling((current) => ({ ...current, ...patch }))}
          />

          <h3 className="flow-subtitle">Pago</h3>
          <div className="field-row">
            <label className="field">
              Medio de pago
              <select
                value={payment.method}
                onChange={(e) =>
                  setPayment({ ...payment, method: e.target.value as SalePayment['method'] })
                }
              >
                {paymentMethods.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {payment.method === 'CASH' ? (
              <label className="field">
                Monto recibido (opcional)
                <input
                  value={payment.received}
                  onChange={(e) => setPayment({ ...payment, received: e.target.value })}
                  inputMode="decimal"
                  placeholder={total.toFixed(2)}
                />
                {payment.received && !payError && (
                  <small>Vuelto: {money(cashChange(payment.received, total))}</small>
                )}
              </label>
            ) : (
              <label className="field">
                N.º de operación
                <input
                  value={payment.reference}
                  onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
                  maxLength={255}
                />
              </label>
            )}
          </div>
          {payError && <small className="field-error">{payError}</small>}
          <label className="facet-option">
            <input type="checkbox" checked={issue} onChange={(e) => setIssue(e.target.checked)} />
            <span>
              Solicitar emisión electrónica de {invoiceTypeLabel(billing.type).toLowerCase()}
            </span>
          </label>
          {error && <ErrorBox message={error} />}
          <div className="form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={busy || !lines.length || cashUnavailable}
            >
              {busy ? 'Registrando…' : `Cobrar ${money(total)}`}
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
