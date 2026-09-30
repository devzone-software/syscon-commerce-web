import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IdLookup } from '../../components/backoffice/IdLookup';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { can, permissions } from '../../lib/auth';
import {
  documentTypes,
  invoiceStatusLabels,
  invoiceTypeLabel,
  invoiceTypes,
  validateInvoice,
  type InvoiceInput,
} from '../../lib/billing';
import { shortId } from '../../lib/orders';
import { isUuid } from '../../lib/validation';
import { api } from '../../services/api';
import { useShop } from '../../state';
import type { Invoice } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

function InvoiceForm({ orderId, onCreated }: { orderId: string; onCreated: (id: string) => void }) {
  const [form, setForm] = useState<InvoiceInput>({
    orderId,
    type: '03',
    serialNumber: '',
    customerDocumentType: '1',
    customerDocumentNumber: '',
    customerName: '',
    referencedSerialNumber: '',
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateInvoice>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<InvoiceInput>) => setForm((current) => ({ ...current, ...patch }));
  const isNote = form.type === '07' || form.type === '08';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateInvoice(form);
    if (!isUuid(form.orderId)) found.orderId = 'Ingresa el ID (UUID) de un pedido pagado.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const invoice = await api.createInvoice({
        orderId: form.orderId.trim().toLowerCase(),
        type: form.type,
        serialNumber: form.serialNumber.trim().toUpperCase(),
        customerDocumentType: form.customerDocumentType,
        customerDocumentNumber: form.customerDocumentNumber.trim(),
        customerName: form.customerName.trim(),
        referencedSerialNumber: isNote ? form.referencedSerialNumber.trim().toUpperCase() : null,
      });
      onCreated(invoice.id);
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
        El comprobante se genera sobre un pedido <strong>pagado</strong> y toma sus líneas y total.
        La serie y el correlativo se ingresan manualmente: el backend valida que no se repitan, pero
        todavía no los asigna automáticamente.
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
        </label>
        <label className="field">
          Tipo de comprobante
          <select value={form.type} onChange={(e) => set({ type: e.target.value })}>
            {invoiceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Serie y correlativo
          <input
            value={form.serialNumber}
            onChange={(e) => set({ serialNumber: e.target.value })}
            placeholder={form.type === '01' ? 'F001-1' : 'B001-1'}
            {...invalid('serialNumber')}
          />
          {fieldError('serialNumber')}
        </label>
      </div>
      {isNote && (
        <label className="field">
          Comprobante que se modifica
          <input
            value={form.referencedSerialNumber}
            onChange={(e) => set({ referencedSerialNumber: e.target.value })}
            placeholder="B001-1"
            {...invalid('referencedSerialNumber')}
          />
          {fieldError('referencedSerialNumber')}
          <small>Debe estar aceptado y pertenecer al mismo pedido.</small>
        </label>
      )}
      <div className="field-row">
        <label className="field">
          Documento del cliente
          <select
            value={form.customerDocumentType}
            onChange={(e) => set({ customerDocumentType: e.target.value })}
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
            value={form.customerDocumentNumber}
            onChange={(e) => set({ customerDocumentNumber: e.target.value })}
            inputMode="numeric"
            {...invalid('customerDocumentNumber')}
          />
          {fieldError('customerDocumentNumber')}
        </label>
        <label className="field">
          Nombre o razón social
          <input
            value={form.customerName}
            onChange={(e) => set({ customerName: e.target.value })}
            {...invalid('customerName')}
          />
          {fieldError('customerName')}
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Generando…' : 'Generar comprobante'}
        </button>
      </div>
    </form>
  );
}

function InvoiceDetail({ id }: { id: string }) {
  const { user } = useShop();
  const { data, loading, error, reload } = useData<Invoice>(() => api.invoice(id), [id]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

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
  const canSubmit = data.status === 'DRAFT' || data.status === 'FAILED';
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
      {data.error && <p className="notice error">Último error de envío: {data.error}</p>}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      {submitError && <ErrorBox message={submitError} />}
      {canSubmit && (
        <div className="form-stack">
          <p className="muted">
            El envío firma el XML con el certificado configurado en invoice-service y lo remite al
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

export function BillingAdmin() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const orderId = params.get('pedido') ?? '';
  return (
    <>
      <PageHeader
        title="Facturación"
        description="Comprobantes electrónicos generados por invoice-service. El backend no ofrece aún un listado de comprobantes: consulta cada uno por su ID."
      />
      <p className="notice error" role="note">
        La integración del backend no está homologada: el XML UBL todavía no incluye el detalle de
        impuestos (IGV) y el envío se dirige a SUNAT, no a un OSE. No la uses para emisión real
        hasta completar esos cambios en invoice-service.
      </p>
      <div className="bo-card">
        <IdLookup
          label="ID del comprobante"
          value={id}
          onSearch={(value) => setParams({ id: value })}
        />
      </div>
      {id && <InvoiceDetail key={id} id={id} />}
      <InvoiceForm
        key={orderId}
        orderId={orderId}
        onCreated={(created) => setParams({ id: created })}
      />
    </>
  );
}
