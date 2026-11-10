import { useEffect, useState, type FormEvent } from 'react';
import {
  documentLabel,
  invoiceTypeLabel,
  invoiceTypes,
  noteReasonFor,
  noteReasons,
  notePayload,
  seriesFor,
  seriesPrefix,
  validateInvoice,
  customerOf,
  type InvoiceInput,
} from '../../lib/billing';
import { isUuid } from '../../lib/validation';
import { api } from '../../services/api';
import { money } from '../../state';
import { type Invoice, type InvoiceSeries, type Order } from '../../types';
import { ErrorBox } from '../../ui';
import { CustomerFields } from './InvoiceCustomerFields';

export function InvoiceForm({
  orderId,
  series,
  onCreated,
}: {
  orderId: string;
  series: InvoiceSeries[];
  onCreated: (invoice: Invoice) => void;
}) {
  const [form, setForm] = useState<InvoiceInput>({
    orderId,
    type: '03',
    series: '',
    customerDocumentType: '1',
    customerDocumentNumber: '',
    customerName: '',
    referencedSerialNumber: '',
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateInvoice>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prefill, setPrefill] = useState('');
  const [products, setProducts] = useState<Order['details'] | null>(null);
  const set = (patch: Partial<InvoiceInput>) => setForm((current) => ({ ...current, ...patch }));
  const isNote = form.type === '07' || form.type === '08';
  const reason = noteReasonFor(form.type, form.noteCode);
  const available = seriesFor(series, form.type, form.referencedSerialNumber);
  const chosen = available.find((item) => item.series === form.series) ?? available[0];

  // The order keeps the billing data chosen at checkout; it is copied here so it can be reviewed.
  const loadFromOrder = async (id: string) => {
    if (!isUuid(id)) {
      setErrors({ orderId: 'Ingresa el ID (UUID) de un pedido pagado.' });
      return;
    }
    setPrefill('');
    try {
      const order = await api.order(id.trim().toLowerCase());
      setProducts(order.details);
      if (!order.billing) {
        setPrefill('Este pedido no tiene datos de facturación registrados; complétalos a mano.');
        return;
      }
      const { type, documentType, documentNumber, name } = order.billing;
      // A note keeps its type; the order only provides the customer.
      setForm((current) => ({
        ...current,
        type: current.type === '07' || current.type === '08' ? current.type : type,
        series: '',
        customerDocumentType: documentType,
        customerDocumentNumber: documentNumber,
        customerName: name,
      }));
      setPrefill(
        `Datos tomados del pedido: ${invoiceTypeLabel(type)} · ${documentLabel(documentType)} ${documentNumber}. Revísalos antes de generar.`,
      );
    } catch (e) {
      setPrefill((e as Error).message);
    }
  };

  useEffect(() => {
    if (isUuid(orderId)) loadFromOrder(orderId);
    // Only when arriving from an order (?pedido=).
  }, [orderId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateInvoice(form);
    if (!isUuid(form.orderId)) found.orderId = 'Ingresa el ID (UUID) de un pedido pagado.';
    if (reason?.mode === 'items' && !products)
      found.items = 'Carga el pedido para elegir los productos devueltos.';
    if (!isNote && !chosen)
      found.series = 'No hay una serie activa para este comprobante; regístrala abajo.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      // Retrying is safe: the platform returns the order's document if it already exists.
      const invoice = await api.createInvoice({
        orderId: form.orderId.trim().toLowerCase(),
        type: form.type,
        series: form.series || null,
        ...customerOf(form),
        referencedSerialNumber: isNote ? form.referencedSerialNumber.trim().toUpperCase() : null,
        ...(isNote ? notePayload(form) : {}),
      });
      onCreated(invoice);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (key: keyof InvoiceInput) =>
    errors[key] && (
      <small id={`invoice-${key}-error`} className="field-error">
        {errors[key]}
      </small>
    );
  const invalid = (key: keyof InvoiceInput) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `invoice-${key}-error` : undefined,
  });

  return (
    <form
      className="bo-card form-stack"
      onSubmit={submit}
      noValidate
      aria-labelledby="invoice-form-title"
    >
      <h2 id="invoice-form-title">Preparar borrador</h2>
      <p className="notice">
        El comprobante se genera sobre un pedido <strong>pagado</strong> y toma sus líneas y total,
        con el IGV incluido en los precios separado por línea. Las notas parten de un comprobante
        aceptado y nunca acreditan más que su total. La serie y el correlativo los asigna el sistema
        al generarlo; si repites la solicitud de un pedido, recuperas el comprobante que ya tiene
        aquí. Crear el borrador no confirma el envío ni la aceptación de SUNAT.
      </p>
      <div className="field-row">
        <label className="field">
          ID del pedido
          <input
            value={form.orderId}
            onChange={(e) => set({ orderId: e.target.value })}
            spellCheck={false}
            {...invalid('orderId')}
          />
          {fieldError('orderId')}
          <button type="button" className="link-button" onClick={() => loadFromOrder(form.orderId)}>
            Usar datos de facturación del pedido
          </button>
        </label>
        <label className="field">
          Tipo de comprobante
          <select
            value={form.type}
            onChange={(e) =>
              set({ type: e.target.value, series: '', noteCode: '', noteReason: '' })
            }
          >
            {invoiceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Serie
          <select
            value={form.series}
            onChange={(e) => set({ series: e.target.value })}
            {...invalid('series')}
          >
            <option value="">
              {available[0] ? `Automática (${available[0].series})` : 'Sin serie activa'}
            </option>
            {available.map((item) => (
              <option key={item.id} value={item.series}>
                {item.series}
              </option>
            ))}
          </select>
          {fieldError('series')}
          <small>
            {chosen
              ? `Número que se asignará: ${chosen.nextNumber}`
              : isNote && !seriesPrefix(form.type, form.referencedSerialNumber)
                ? 'La serie depende del comprobante que se modifica.'
                : 'Registra una serie activa para este tipo.'}
          </small>
        </label>
      </div>
      {prefill && (
        <p className="notice" role="status">
          {prefill}
        </p>
      )}
      {isNote && (
        <label className="field">
          Comprobante que se modifica
          <input
            value={form.referencedSerialNumber}
            onChange={(e) => set({ referencedSerialNumber: e.target.value, series: '' })}
            placeholder="B001-1"
            {...invalid('referencedSerialNumber')}
          />
          {fieldError('referencedSerialNumber')}
          <small>Debe estar aceptado y pertenecer al mismo pedido.</small>
        </label>
      )}
      {(form.type === '07' || form.type === '08') && (
        <>
          <div className="field-row">
            <label className="field">
              Motivo
              <select
                value={form.noteCode ?? ''}
                onChange={(e) => {
                  const next = noteReasonFor(form.type, e.target.value);
                  // The explanation starts as the reason's name unless it was already written.
                  const keep = form.noteReason && form.noteReason !== reason?.label;
                  set({
                    noteCode: e.target.value,
                    noteReason: keep ? form.noteReason : next?.label,
                  });
                }}
                {...invalid('noteCode')}
              >
                <option value="">Selecciona…</option>
                {noteReasons[form.type]
                  .filter(
                    (item) => !(item.invoiceOnly && form.referencedSerialNumber?.startsWith('B')),
                  )
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value} · {item.label}
                    </option>
                  ))}
              </select>
              {fieldError('noteCode')}
              {reason && <small>{reason.help}</small>}
            </label>
            <label className="field">
              Sustento
              <input
                value={form.noteReason ?? ''}
                onChange={(e) => set({ noteReason: e.target.value })}
                maxLength={250}
                {...invalid('noteReason')}
              />
              {fieldError('noteReason')}
              <small>Figura en el XML y en el documento impreso.</small>
            </label>
            {reason?.mode === 'amount' && (
              <label className="field">
                Importe con IGV (S/)
                <input
                  value={form.amount ?? ''}
                  onChange={(e) => set({ amount: e.target.value })}
                  inputMode="decimal"
                  placeholder="0.00"
                  {...invalid('amount')}
                />
                {fieldError('amount')}
              </label>
            )}
          </div>
          {reason?.mode === 'items' && (
            <fieldset
              className="field"
              aria-describedby={errors.items ? 'invoice-items-error' : undefined}
            >
              <legend>Unidades devueltas</legend>
              {products ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col" className="num">
                          Vendidas
                        </th>
                        <th scope="col" className="num">
                          Precio
                        </th>
                        <th scope="col" className="num">
                          Devueltas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((item) => (
                        <tr key={item.productId}>
                          <td>
                            <strong>{item.name}</strong>
                            <small>SKU {item.sku}</small>
                          </td>
                          <td className="num">{item.quantity}</td>
                          <td className="num">{money(Number(item.unitPrice))}</td>
                          <td className="num">
                            <input
                              aria-label={`Unidades devueltas de ${item.name}`}
                              value={form.items?.[item.productId] ?? ''}
                              onChange={(e) =>
                                set({ items: { ...form.items, [item.productId]: e.target.value } })
                              }
                              inputMode="numeric"
                              placeholder="0"
                              size={4}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">Carga el pedido para elegir los productos devueltos.</p>
              )}
              {fieldError('items')}
            </fieldset>
          )}
        </>
      )}
      <CustomerFields
        idPrefix="invoice"
        value={form}
        errors={errors}
        onChange={(patch) => set(patch)}
      />
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Preparando…' : 'Crear o consultar borrador'}
        </button>
      </div>
    </form>
  );
}
