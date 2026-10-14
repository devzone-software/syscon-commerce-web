import { useState } from 'react';
import {
  boletaDocuments,
  isValidRuc,
  normalizeDocument,
  rucStatusText,
  type BillingForm,
} from '../../lib/billing';
import { api } from '../../services/api';

const billingOptions = [
  ['03', 'Boleta de venta', 'Persona natural · DNI, carné de extranjería o pasaporte'],
  ['01', 'Factura', 'Empresa o persona con negocio · RUC'],
] as const;

/** Boleta / factura selector and the customer identity the order keeps for the invoice. */
export function BillingFields({
  type,
  form,
  errors,
  onType,
  onChange,
}: {
  type: BillingForm['type'];
  form: BillingForm;
  errors: Partial<Record<keyof BillingForm, string>>;
  onType: (type: BillingForm['type']) => void;
  onChange: (patch: Partial<BillingForm>) => void;
}) {
  const factura = type === '01';
  const [lookup, setLookup] = useState<{ busy: boolean; text: string; warn: boolean }>({
    busy: false,
    text: '',
    warn: false,
  });
  const ruc = normalizeDocument(form.documentNumber);
  // Fills the business name and address; when the lookup fails the user types them.
  const consult = async () => {
    setLookup({ busy: true, text: '', warn: false });
    try {
      const info = await api.lookupRuc(ruc);
      onChange({ name: info.name ?? form.name, address: info.address ?? '' });
      setLookup({ busy: false, text: rucStatusText(info), warn: info.active === false });
    } catch (e) {
      setLookup({
        busy: false,
        text: `${(e as Error).message} Puedes escribir la razón social.`,
        warn: true,
      });
    }
  };
  const fieldProps = (key: keyof BillingForm) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `billing-${key}-error` : undefined,
  });
  const fieldError = (key: keyof BillingForm) =>
    errors[key] && (
      <p className="field-error" id={`billing-${key}-error`}>
        {errors[key]}
      </p>
    );

  return (
    <fieldset className="billing-fields">
      <legend>Tipo de comprobante</legend>
      <div className="billing-choice">
        {billingOptions.map(([value, title, text]) => (
          <label key={value} className={`billing-option${type === value ? ' is-active' : ''}`}>
            <input
              type="radio"
              name="billing-type"
              value={value}
              checked={type === value}
              onChange={() => onType(value)}
            />
            <span>
              <strong>{title}</strong>
              {text}
            </span>
          </label>
        ))}
      </div>
      <div className="field-row">
        {factura ? (
          <label className="field">
            RUC
            <input
              value={form.documentNumber}
              onChange={(event) => onChange({ documentNumber: event.target.value })}
              inputMode="numeric"
              maxLength={13}
              placeholder="20XXXXXXXXX"
              autoComplete="off"
              {...fieldProps('documentNumber')}
            />
            {fieldError('documentNumber')}
            <button
              type="button"
              className="link-button"
              disabled={lookup.busy || !isValidRuc(ruc)}
              onClick={consult}
            >
              {lookup.busy ? 'Consultando…' : 'Consultar RUC'}
            </button>
            {lookup.text && (
              <small className={lookup.warn ? 'field-error' : undefined} role="status">
                {lookup.text}
              </small>
            )}
          </label>
        ) : (
          <>
            <label className="field">
              Tipo de documento
              <select
                value={form.documentType}
                onChange={(event) =>
                  onChange({ documentType: event.target.value as BillingForm['documentType'] })
                }
                {...fieldProps('documentType')}
              >
                {boletaDocuments.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {fieldError('documentType')}
            </label>
            <label className="field">
              Número de documento
              <input
                value={form.documentNumber}
                onChange={(event) => onChange({ documentNumber: event.target.value })}
                inputMode={form.documentType === '1' ? 'numeric' : 'text'}
                maxLength={15}
                placeholder={form.documentType === '1' ? '8 dígitos' : '6 a 12 letras o números'}
                autoComplete="off"
                {...fieldProps('documentNumber')}
              />
              {fieldError('documentNumber')}
            </label>
          </>
        )}
      </div>
      <label className="field">
        {factura ? 'Razón social' : 'Nombre completo'}
        <input
          value={form.name}
          onChange={(event) => onChange({ name: event.target.value })}
          maxLength={255}
          autoComplete={factura ? 'organization' : 'name'}
          placeholder={factura ? 'Ej. Comercial Andina S.A.C.' : 'Nombres y apellidos'}
          {...fieldProps('name')}
        />
        {fieldError('name')}
      </label>
      {factura && (
        <label className="field">
          <span>
            Dirección fiscal <small>(opcional)</small>
          </span>
          <input
            value={form.address}
            onChange={(event) => onChange({ address: event.target.value })}
            maxLength={255}
            autoComplete="street-address"
            placeholder="Av., calle, número, distrito"
            {...fieldProps('address')}
          />
          {fieldError('address')}
        </label>
      )}
      <p className="flow-note">
        Estos datos se guardan con tu pedido para emitir el comprobante. Si luego cambias tu perfil,
        el pedido conserva los datos con los que compraste.
      </p>
    </fieldset>
  );
}
