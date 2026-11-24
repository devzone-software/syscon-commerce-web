import { documentTypes } from '../../lib/billing';
import { type InvoiceCustomer } from '../../types';

export type CustomerErrors = Partial<Record<keyof InvoiceCustomer, string>>;

export function CustomerFields({
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
