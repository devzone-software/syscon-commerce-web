import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IdLookup } from '../../components/backoffice/IdLookup';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { can, permissions } from '../../lib/auth';
import {
  documentLabel,
  documentTypes,
  invoiceStatusLabels,
  invoiceTypeLabel,
  invoiceTypes,
  invoiceFileUrl,
  invoiceValidity,
  noteReasonFor,
  noteReasons,
  notePayload,
  SERIES,
  seriesFor,
  sendDeadlineNotice,
  seriesPrefix,
  taxPercent,
  validateInvoice,
  type InvoiceInput,
} from '../../lib/billing';
import { formatDateTime, shortId } from '../../lib/orders';
import { limaDate } from '../../lib/reports';
import { isUuid } from '../../lib/validation';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import type { Invoice, InvoiceCustomer, InvoiceSeries, Order } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

type CustomerErrors = Partial<Record<keyof InvoiceCustomer, string>>;

/** Customer identity fields shared by the issue form and the draft correction. */
function CustomerFields({
  value,
  errors,
  onChange,
  idPrefix,
}: {
  value: InvoiceCustomer;
  errors: CustomerErrors;
  onChange: (patch: Partial<InvoiceCustomer>) => void;
  idPrefix: string;
}) {
  const invalid = (key: keyof InvoiceCustomer) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${idPrefix}-${key}-error` : undefined,
  });
  const fieldError = (key: keyof InvoiceCustomer) =>
    errors[key] && (
      <small id={`${idPrefix}-${key}-error`} className="field-error">
        {errors[key]}
      </small>
    );
  return (
    <div className="field-row">
      <label className="field">
        Documento del cliente
        <select
          value={value.customerDocumentType}
          onChange={(e) => onChange({ customerDocumentType: e.target.value })}
          {...invalid('customerDocumentType')}
        >
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {fieldError('customerDocumentType')}
      </label>
      <label className="field">
        Número de documento
        <input
          value={value.customerDocumentNumber}
          onChange={(e) => onChange({ customerDocumentNumber: e.target.value })}
          inputMode="numeric"
          {...invalid('customerDocumentNumber')}
        />
        {fieldError('customerDocumentNumber')}
      </label>
      <label className="field">
        Nombre o razón social
        <input
          value={value.customerName}
          onChange={(e) => onChange({ customerName: e.target.value })}
          {...invalid('customerName')}
        />
        {fieldError('customerName')}
      </label>
    </div>
  );
}

const customerOf = (input: InvoiceCustomer): InvoiceCustomer => ({
  customerDocumentType: input.customerDocumentType,
  customerDocumentNumber: input.customerDocumentNumber.trim(),
  customerName: input.customerName.trim(),
});

function InvoiceForm({
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
      <h2 id="invoice-form-title">Emitir comprobante</h2>
      <p className="notice">
        El comprobante se genera sobre un pedido <strong>pagado</strong> y toma sus líneas y total,
        con el IGV incluido en los precios separado por línea. Las notas parten de un comprobante
        aceptado y nunca acreditan más que su total. La serie y el correlativo los asigna el sistema
        al generarlo; si repites la emisión de un pedido, recuperas el comprobante que ya tiene.
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
          {busy ? 'Generando…' : 'Generar comprobante'}
        </button>
      </div>
    </form>
  );
}

/** Lines as stored with the document: the same amounts the XML carries. */
function InvoiceLines({ invoice }: { invoice: Invoice }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">Detalle del comprobante</caption>
        <thead>
          <tr>
            <th scope="col">Descripción</th>
            <th scope="col" className="num">
              Cantidad
            </th>
            <th scope="col" className="num">
              Precio con IGV
            </th>
            <th scope="col" className="num">
              Valor sin IGV
            </th>
            <th scope="col" className="num">
              IGV
            </th>
            <th scope="col" className="num">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {(invoice.lines ?? []).map((line) => (
            <tr key={line.lineNumber}>
              <td>
                <strong>{line.description}</strong>
                {line.sku && <small>SKU {line.sku}</small>}
              </td>
              <td className="num">{line.quantity}</td>
              <td className="num">{money(Number(line.unitPrice))}</td>
              <td className="num">{money(Number(line.taxableAmount))}</td>
              <td className="num">{money(Number(line.taxAmount))}</td>
              <td className="num">{money(Number(line.lineTotal))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={5}>
              Op. gravada
            </th>
            <td className="num">{money(Number(invoice.taxableAmount))}</td>
          </tr>
          <tr>
            <th scope="row" colSpan={5}>
              IGV {taxPercent(invoice.taxRate ?? '0.18')}
            </th>
            <td className="num">{money(Number(invoice.taxAmount))}</td>
          </tr>
          <tr>
            <th scope="row" colSpan={5}>
              Total
            </th>
            <td className="num">
              <strong>{money(Number(invoice.total))}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Voids an accepted document without a credit note, within SUNAT's deadline. */
function VoidForm({
  series,
  onVoid,
  busy,
}: {
  series: string;
  onVoid: (reason: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const kind = series.startsWith('F') ? 'comunicación de baja' : 'resumen diario';
  const article = series.startsWith('F') ? 'una' : 'un';
  if (!open)
    return (
      <button type="button" className="link-button" onClick={() => setOpen(true)}>
        Anular comprobante ({kind})
      </button>
    );
  return (
    <form
      className="form-stack"
      noValidate
      aria-label="Anular comprobante"
      onSubmit={(event) => {
        event.preventDefault();
        if (reason.trim().length < 3) return setError('Indica el motivo de la anulación.');
        setError('');
        onVoid(reason.trim());
      }}
    >
      <p className="notice">
        Se enviará a SUNAT {article} {kind}. Solo procede dentro de los 7 días de emitido y sin
        notas vigentes; después usa una nota de crédito. Aceptada la anulación, el pedido puede
        facturarse de nuevo.
      </p>
      <label className="field">
        Motivo de la anulación
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} />
        {error && <small className="field-error">{error}</small>}
      </label>
      <div className="form-actions">
        <button type="button" className="link-button" onClick={() => setOpen(false)}>
          Cancelar
        </button>
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar anulación'}
        </button>
      </div>
    </form>
  );
}

function VoidHistory({ voids }: { voids: NonNullable<Invoice['voids']> }) {
  const labels = {
    SENT: 'En proceso',
    ACCEPTED: 'Aceptada',
    REJECTED: 'Rechazada',
    FAILED: 'No enviada',
  };
  return (
    <ul className="bo-simple-list" aria-label="Anulaciones">
      {voids.map((item) => (
        <li key={item.id}>
          <span>
            <strong>
              {item.identifier} · {labels[item.status]}
            </strong>
            <small>
              {item.reason}
              {item.ticket && ` · ticket ${item.ticket}`}
              {item.description &&
                ` · ${item.responseCode ? `${item.responseCode} ` : ''}${item.description}`}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Evidence of every submission and reconciliation with SUNAT. */
function AttemptHistory({ attempts }: { attempts: NonNullable<Invoice['attempts']> }) {
  return (
    <details className="form-stack">
      <summary>Historial de envíos a SUNAT ({attempts.length})</summary>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Acción</th>
              <th scope="col">Resultado</th>
              <th scope="col">Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt, index) => (
              <tr key={index}>
                <td>
                  {formatDateTime(attempt.at)}
                  <small>{attempt.actor ?? 'Sistema'}</small>
                </td>
                <td>{attempt.action === 'RECONCILE' ? 'Conciliación' : 'Envío'}</td>
                <td>{invoiceStatusLabels[attempt.result] ?? attempt.result}</td>
                <td>
                  {attempt.sunatCode && <strong>{attempt.sunatCode} </strong>}
                  {attempt.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Draft only: a document that went through submission may have reached SUNAT. */
function CorrectionForm({
  invoice,
  onSaved,
  onCancel,
}: {
  invoice: Invoice;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<InvoiceCustomer>({
    customerDocumentType: invoice.customerDocumentType ?? '1',
    customerDocumentNumber: invoice.customerDocumentNumber ?? '',
    customerName: invoice.customerName ?? '',
  });
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateInvoice({
      ...value,
      orderId: invoice.orderId,
      type: invoice.type,
      series: '',
      referencedSerialNumber: invoice.referencedSerialNumber ?? '',
    });
    const customerErrors: CustomerErrors = {
      customerDocumentType: found.customerDocumentType,
      customerDocumentNumber: found.customerDocumentNumber,
      customerName: found.customerName,
    };
    setErrors(customerErrors);
    if (Object.values(customerErrors).some(Boolean)) return;
    setBusy(true);
    setError('');
    try {
      await api.updateInvoice(invoice.id, customerOf(value));
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={save} noValidate aria-label="Corregir datos del cliente">
      <CustomerFields
        idPrefix="correction"
        value={value}
        errors={errors}
        onChange={(patch) => setValue((current) => ({ ...current, ...patch }))}
      />
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button type="button" className="link-button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar corrección'}
        </button>
      </div>
    </form>
  );
}

function InvoiceDetail({ id, notice }: { id: string; notice: string }) {
  const { user } = useShop();
  const { data, loading, error, reload } = useData<Invoice>(() => api.invoice(id), [id]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(notice);
  const [submitError, setSubmitError] = useState('');
  const [correcting, setCorrecting] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    setSubmitError('');
    try {
      const result = await api.submitInvoice(id);
      setMessage(
        `Envío procesado. Estado: ${invoiceStatusLabels[result.status] ?? result.status}.`,
      );
      reload();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !data)
    return <ErrorBox message={error || 'Comprobante no encontrado.'} retry={reload} />;
  const deadline = sendDeadlineNotice(data.sendDeadline, limaDate(new Date()));
  const canSubmit = (data.status === 'DRAFT' || data.status === 'FAILED') && !deadline?.expired;
  const runAction = async (action: () => Promise<Invoice>, done: string) => {
    setBusy(true);
    setMessage('');
    setSubmitError('');
    try {
      const result = await action();
      setMessage(`${done}. Estado: ${invoiceStatusLabels[result.status] ?? result.status}.`);
      reload();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const reconcile = async () => {
    setBusy(true);
    setMessage('');
    setSubmitError('');
    try {
      const result = await api.reconcileInvoice(id);
      setMessage(
        `Conciliación procesada. Estado: ${invoiceStatusLabels[result.status] ?? result.status}.`,
      );
      reload();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bo-card" aria-labelledby="invoice-detail-title">
      <div className="order-top">
        <h2 id="invoice-detail-title">
          {invoiceTypeLabel(data.type)} {data.serialNumber}
        </h2>
        <StatusBadge status={data.status} labels={invoiceStatusLabels} />
      </div>
      <dl className="detail-list">
        <div>
          <dt>ID</dt>
          <dd>
            <code>{data.id}</code>
          </dd>
        </div>
        <div>
          <dt>Pedido</dt>
          <dd>
            {can(user, permissions.ordersManage) ? (
              <Link className="link-button" to={`/admin/pedidos?id=${data.orderId}`}>
                {shortId(data.orderId)}
              </Link>
            ) : (
              shortId(data.orderId)
            )}
          </dd>
        </div>
        {data.customerName && (
          <div>
            <dt>Cliente</dt>
            <dd>
              {data.customerName} · {documentLabel(data.customerDocumentType ?? '')}{' '}
              {data.customerDocumentNumber}
            </dd>
          </div>
        )}
        {data.referencedSerialNumber && (
          <div>
            <dt>Modifica a</dt>
            <dd>{data.referencedSerialNumber}</dd>
          </div>
        )}
        {data.noteCode && (
          <div>
            <dt>Motivo</dt>
            <dd>
              {data.noteCode} · {noteReasonFor(data.type, data.noteCode)?.label ?? 'Otro'}
              {data.noteReason && <small> — {data.noteReason}</small>}
            </dd>
          </div>
        )}
        {data.total && !data.lines?.length && (
          <div>
            <dt>Total</dt>
            <dd>{money(Number(data.total))}</dd>
          </div>
        )}
        {data.createdAt && (
          <div>
            <dt>Generado</dt>
            <dd>{formatDateTime(data.createdAt)}</dd>
          </div>
        )}
        {data.sunatCode && (
          <div>
            <dt>Código de respuesta</dt>
            <dd>{data.sunatCode}</dd>
          </div>
        )}
        {data.sunatDescription && (
          <div>
            <dt>Descripción de la respuesta</dt>
            <dd>{data.sunatDescription}</dd>
          </div>
        )}
      </dl>
      {data.lines && data.lines.length > 0 && <InvoiceLines invoice={data} />}
      <p className={data.status === 'ACCEPTED' && !data.test ? 'notice success' : 'notice'}>
        {invoiceValidity(data.status, data.test)}
      </p>
      <div className="form-actions">
        <a
          className="button button-secondary"
          href={invoiceFileUrl(data.id, 'pdf')}
          target="_blank"
          rel="noopener"
        >
          {data.status === 'ACCEPTED' ? 'Ver / imprimir PDF' : 'Vista previa PDF'}
        </a>
        <a className="link-button" href={invoiceFileUrl(data.id, 'xml')} download>
          Descargar XML
        </a>
        {data.hasCdr && (
          <a className="link-button" href={invoiceFileUrl(data.id, 'cdr')} download>
            Descargar CDR
          </a>
        )}
      </div>
      {deadline && (
        <p className={`notice${deadline.expired ? ' error' : ''}`} role="note">
          {deadline.text}
        </p>
      )}
      {data.error && (
        <p className="notice error">
          Último error de envío: {data.error}. El reintento usa el mismo número {data.serialNumber}.
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      {submitError && <ErrorBox message={submitError} />}
      {data.status === 'DRAFT' &&
        (correcting ? (
          <CorrectionForm
            invoice={data}
            onCancel={() => setCorrecting(false)}
            onSaved={() => {
              setCorrecting(false);
              setMessage('Datos del cliente corregidos; el número no cambia.');
              reload();
            }}
          />
        ) : (
          <button type="button" className="link-button" onClick={() => setCorrecting(true)}>
            Corregir datos del cliente
          </button>
        ))}
      {data.status === 'PENDING_CHECK' && (
        <div className="form-actions">
          <button
            type="button"
            className="button button-primary"
            disabled={busy}
            onClick={reconcile}
          >
            {busy ? 'Consultando…' : 'Consultar estado en SUNAT'}
          </button>
        </div>
      )}
      {data.voids && data.voids.length > 0 && <VoidHistory voids={data.voids} />}
      {data.status === 'VOIDING' && (
        <div className="form-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => runAction(() => api.checkInvoiceVoid(id), 'Anulación consultada')}
          >
            Consultar anulación en SUNAT
          </button>
        </div>
      )}
      {data.status === 'ACCEPTED' && (
        <VoidForm
          series={data.serialNumber}
          onVoid={(reason) => runAction(() => api.voidInvoice(id, reason), 'Anulación procesada')}
          busy={busy}
        />
      )}
      {data.attempts && data.attempts.length > 0 && <AttemptHistory attempts={data.attempts} />}
      {canSubmit && !correcting && (
        <div className="form-stack">
          <p className="muted">
            El envío firma el XML con el certificado configurado en la plataforma y lo remite al
            endpoint definido en <code>SUNAT_ENDPOINT</code>. Si faltan credenciales, el backend
            rechaza el envío.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button button-primary"
              disabled={busy}
              onClick={submit}
            >
              {busy
                ? 'Enviando…'
                : data.status === 'FAILED'
                  ? 'Reintentar envío'
                  : 'Enviar comprobante'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function SeriesPanel({ series, onChanged }: { series: InvoiceSeries[]; onChanged: () => void }) {
  const [form, setForm] = useState({ type: '03', series: '', startAfter: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(done);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    const code = form.series.trim().toUpperCase();
    const prefix = seriesPrefix(form.type);
    if (!SERIES.test(code)) return setError('La serie tiene 4 caracteres y empieza con F o B.');
    if (prefix && !code.startsWith(prefix))
      return setError(`${invoiceTypeLabel(form.type)}: la serie empieza con ${prefix}.`);
    const startAfter = Number(form.startAfter || 0);
    if (!Number.isInteger(startAfter) || startAfter < 0)
      return setError('El último número usado debe ser un entero mayor o igual a 0.');
    run(
      'new',
      async () => {
        await api.createInvoiceSeries({ type: form.type, series: code, startAfter });
        setForm({ ...form, series: '', startAfter: '' });
      },
      `Serie ${code} registrada.`,
    );
  };

  return (
    <section className="bo-card" aria-labelledby="series-title">
      <h2 id="series-title">Series</h2>
      <p className="muted">
        Sin serie elegida, cada comprobante usa la primera serie activa de su tipo. Las notas usan
        la letra del comprobante que modifican.
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Serie</th>
              <th scope="col" className="num">
                Último número
              </th>
              <th scope="col">Siguiente</th>
              <th scope="col">
                <span className="visually-hidden">Estado</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((item) => (
              <tr key={item.id}>
                <td>{invoiceTypeLabel(item.type)}</td>
                <td>
                  <strong>{item.series}</strong>
                </td>
                <td className="num">{item.lastNumber}</td>
                <td>{item.active ? item.nextNumber : <span className="muted">Inactiva</span>}</td>
                <td className="num">
                  <button
                    type="button"
                    className="link-button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      run(
                        String(item.id),
                        () => api.setInvoiceSeriesActive(item.id, !item.active),
                        `Serie ${item.series} ${item.active ? 'desactivada' : 'activada'}.`,
                      )
                    }
                  >
                    {item.active ? 'Desactivar' : 'Activar'}
                    <span className="visually-hidden"> {item.series}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="form-stack" onSubmit={create} noValidate aria-label="Registrar serie">
        <div className="field-row">
          <label className="field">
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {invoiceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nueva serie
            <input
              value={form.series}
              onChange={(e) => setForm({ ...form, series: e.target.value })}
              placeholder={form.type === '01' ? 'F002' : 'B002'}
              maxLength={4}
            />
          </label>
          <label className="field">
            Último número ya usado
            <input
              value={form.startAfter}
              onChange={(e) => setForm({ ...form, startAfter: e.target.value })}
              inputMode="numeric"
              placeholder="0"
            />
            <small>Solo si la serie viene de otro sistema.</small>
          </label>
        </div>
        {error && <ErrorBox message={error} />}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="button button-secondary" disabled={Boolean(busy)}>
            {busy === 'new' ? 'Registrando…' : 'Registrar serie'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function BillingAdmin() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const orderId = params.get('pedido') ?? '';
  const [notice, setNotice] = useState('');
  const series = useData(api.invoiceSeries);
  return (
    <>
      <PageHeader
        title="Facturación"
        description="Boletas, facturas y notas con serie y correlativo asignados por el sistema. Abre un comprobante desde su pedido o por su ID."
      />
      <p className="notice error" role="note">
        La integración del backend no está homologada: el XML UBL ya separa base e IGV, pero no se
        ha validado contra el servicio de pruebas de SUNAT ni contra un OSE. No la uses para emisión
        real hasta completar esa validación.
      </p>
      <div className="bo-card">
        <IdLookup
          label="ID del comprobante"
          value={id}
          onSearch={(value) => {
            setNotice('');
            setParams({ id: value });
          }}
        />
      </div>
      {id && <InvoiceDetail key={id + notice} id={id} notice={notice} />}
      {series.loading && !series.data ? (
        <Loading />
      ) : series.error && !series.data ? (
        <ErrorBox message={series.error} retry={series.reload} />
      ) : (
        <>
          <InvoiceForm
            key={orderId}
            orderId={orderId}
            series={series.data ?? []}
            onCreated={(invoice) => {
              setNotice(`Comprobante ${invoice.serialNumber} listo.`);
              setParams({ id: invoice.id });
              series.reload();
              window.scrollTo({ top: 0 });
            }}
          />
          <SeriesPanel series={series.data ?? []} onChanged={series.reload} />
        </>
      )}
    </>
  );
}
