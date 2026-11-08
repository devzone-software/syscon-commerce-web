import { useState, type FormEvent } from 'react';
import { validateInvoice, customerOf } from '../../lib/billing';
import { api } from '../../services/api';
import { type Invoice, type InvoiceCustomer } from '../../types';
import { ErrorBox } from '../../ui';
import { CustomerFields, type CustomerErrors } from './InvoiceCustomerFields';

export function VoidForm({
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
      <button type="button" className="link-button" disabled={busy} onClick={() => setOpen(true)}>
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

export function CorrectionForm({
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
