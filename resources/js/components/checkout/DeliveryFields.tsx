import { deliveryMethodLabels, type DeliveryForm } from '../../lib/delivery';
import { money } from '../../state';
import type { DeliveryMethod, DeliveryOptions } from '../../types';

type Errors = Partial<Record<keyof DeliveryForm, string>>;

const costLabel = (cost: string | null | undefined) =>
  cost == null ? 'No disponible' : Number(cost) === 0 ? 'Gratis' : money(Number(cost));

/** Pickup or home delivery, with the costs the platform publishes, and the contact who receives. */
export function DeliveryFields({
  form,
  options,
  errors,
  onChange,
}: {
  form: DeliveryForm;
  options: DeliveryOptions | null;
  errors: Errors;
  onChange: (patch: Partial<DeliveryForm>) => void;
}) {
  const home = form.method === 'DELIVERY';
  const fieldProps = (key: keyof DeliveryForm) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `delivery-${key}-error` : undefined,
  });
  const fieldError = (key: keyof DeliveryForm) =>
    errors[key] && (
      <p className="field-error" id={`delivery-${key}-error`}>
        {errors[key]}
      </p>
    );
  const choices: { value: DeliveryMethod; text: string; cost?: string | null; enabled: boolean }[] =
    [
      {
        value: 'PICKUP',
        text: options?.pickup.address
          ? options.pickup.address + (options.pickup.hours ? ' · ' + options.pickup.hours : '')
          : 'Te indicaremos la tienda y el horario al confirmar el pedido.',
        cost: options?.pickup.cost,
        enabled: true,
      },
      {
        value: 'DELIVERY',
        text: options?.delivery.enabled
          ? options.delivery.areas
            ? 'Cobertura: ' + options.delivery.areas
            : 'Llevamos tu pedido a la dirección que indiques.'
          : 'No disponible por ahora.',
        cost: options?.delivery.cost,
        enabled: Boolean(options?.delivery.enabled),
      },
    ];

  return (
    <fieldset className="billing-fields">
      <legend>Modalidad de entrega</legend>
      <div className="billing-choice">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={`billing-option${form.method === choice.value ? ' is-active' : ''}${
              choice.enabled ? '' : ' is-disabled'
            }`}
          >
            <input
              type="radio"
              name="delivery-method"
              value={choice.value}
              checked={form.method === choice.value}
              disabled={!choice.enabled}
              onChange={() => onChange({ method: choice.value })}
            />
            <span>
              <strong>
                {deliveryMethodLabels[choice.value]}
                <em className="billing-option-cost">{options ? costLabel(choice.cost) : '…'}</em>
              </strong>
              {choice.text}
            </span>
          </label>
        ))}
      </div>
      {fieldError('method')}
      <div className="field-row">
        <label className="field">
          {home ? 'Quién recibe' : 'Quién retira'}
          <input
            value={form.contactName}
            onChange={(event) => onChange({ contactName: event.target.value })}
            maxLength={120}
            autoComplete="name"
            placeholder="Nombres y apellidos"
            {...fieldProps('contactName')}
          />
          {fieldError('contactName')}
        </label>
        <label className="field">
          Celular de contacto
          <input
            value={form.contactPhone}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
            inputMode="tel"
            maxLength={11}
            autoComplete="tel-national"
            placeholder="9XXXXXXXX"
            {...fieldProps('contactPhone')}
          />
          {fieldError('contactPhone')}
        </label>
      </div>
      {home && (
        <>
          <div className="field-row">
            <label className="field">
              Dirección de entrega
              <input
                value={form.address}
                onChange={(event) => onChange({ address: event.target.value })}
                maxLength={255}
                autoComplete="street-address"
                placeholder="Av., calle, número, dpto."
                {...fieldProps('address')}
              />
              {fieldError('address')}
            </label>
            <label className="field">
              Distrito
              <input
                value={form.district}
                onChange={(event) => onChange({ district: event.target.value })}
                maxLength={80}
                autoComplete="address-level2"
                placeholder="Ej. Miraflores"
                {...fieldProps('district')}
              />
              {fieldError('district')}
            </label>
          </div>
          <label className="field">
            <span>
              Referencia <small>(opcional)</small>
            </span>
            <input
              value={form.reference}
              onChange={(event) => onChange({ reference: event.target.value })}
              maxLength={255}
              placeholder="Ej. Frente al parque, portón negro"
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
