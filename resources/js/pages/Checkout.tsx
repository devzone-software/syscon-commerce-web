import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { InfoRows, OrderSummary } from '../components/cart/OrderSummary';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { useCartReview } from '../hooks/useCartReview';
import { displayName } from '../lib/auth';
import {
  billingFromProfile,
  billingPayload,
  boletaDocuments,
  validateBilling,
  type BillingForm,
} from '../lib/billing';
import { issueMessages } from '../lib/cart';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment, Profile } from '../types';
import { ErrorBox } from '../ui';

export function Checkout() {
  const { cart, clear, user } = useShop();
  const { issues, checking } = useCartReview();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [forms, setForms] = useState(() => initialForms(user));
  const [type, setType] = useState<BillingForm['type']>('03');
  const edited = useRef(false);
  const [showErrors, setShowErrors] = useState(false);

  // Prefill from the stored profile unless the customer already started typing.
  useEffect(() => {
    let active = true;
    api
      .profile()
      .then((profile) => {
        if (!active || edited.current) return;
        setForms(initialForms(user, profile));
        setType(billingFromProfile(profile).type);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // The profile is read once per visit; later user changes do not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const billing = forms[type];
  const errors = validateBilling(billing);
  const update = (patch: Partial<BillingForm>) => {
    edited.current = true;
    setForms((current) => ({ ...current, [type]: { ...current[type], ...patch } }));
  };

  const submit = async () => {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const order = await api.createOrder(
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        billingPayload(billing),
      );
      clear();
      // The manual payment request is idempotent; if it fails the order page offers a retry.
      let payment: Payment | null = null;
      try {
        payment = await api.createPayment(order.id);
      } catch {
        payment = null;
      }
      navigate(`/pedido/${order.id}?nuevo=1`, { state: { payment } });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (!cart.length && !busy) return <Navigate to="/carrito" replace />;
  const blocked = checking || issues.size > 0;

  return (
    <>
      <PageHero
        eyebrow="CHECKOUT SEGURO"
        title="Finaliza tu compra"
        text="Revisa tus datos, los productos y el método de pago antes de confirmar."
      />
      <PageSection title="Datos de compra">
        <InfoRows
          rows={[
            { label: 'Cliente', value: user ? displayName(user) : '—' },
            { label: 'Correo electrónico', value: user?.email ?? '—' },
            { label: 'Entrega', value: 'Coordinación con un asesor de SYSCON' },
          ]}
        />
        <p className="flow-note">
          El pedido quedará vinculado a tu cuenta y podrás seguirlo desde “Mis pedidos”.
        </p>
        <h3 className="flow-subtitle">Comprobante de pago</h3>
        <BillingFields
          type={type}
          form={billing}
          errors={showErrors ? errors : {}}
          onType={(value) => {
            edited.current = true;
            setType(value);
          }}
          onChange={update}
        />
        {showErrors && Object.keys(errors).length > 0 && (
          <p className="notice error" role="alert">
            Revisa los datos del comprobante antes de confirmar.
          </p>
        )}
        <h3 className="flow-subtitle">Productos</h3>
        <ul className="checkout-lines">
          {cart.map(({ product, quantity }) => {
            const issue = issues.get(product.id);
            return (
              <li key={product.id} className="checkout-line">
                <span>
                  {product.name} × {quantity}
                  {issue && <small className="cart-line-issue">{issueMessages[issue]}</small>}
                </span>
                <strong>{money(Number(product.price) * quantity)}</strong>
              </li>
            );
          })}
        </ul>
        <Link className="link-button" to="/carrito">
          Editar carrito
        </Link>
        <h3 className="flow-subtitle">Método de pago</h3>
        <label className="payment-option">
          <input type="radio" name="payment" checked readOnly />
          <span>
            <strong>Pago manual: transferencia bancaria o pago coordinado B2B</strong>
            Tras crear el pedido se registra una solicitud de pago. Un asesor la confirma cuando
            verifica el pago.
          </span>
        </label>
        {error && <ErrorBox message={error} />}
      </PageSection>
      <PageSection title="Resumen del pedido" soft>
        <OrderSummary lines={cart} totalLabel="Total a pagar">
          {issues.size > 0 && (
            <p className="notice error" role="alert">
              Hay productos que requieren atención. <Link to="/carrito">Revisar carrito</Link>
            </p>
          )}
          <button type="button" className="flow-button" disabled={busy || blocked} onClick={submit}>
            {busy
              ? 'Creando pedido…'
              : checking
                ? 'Verificando disponibilidad…'
                : 'Confirmar compra'}
          </button>
        </OrderSummary>
      </PageSection>
    </>
  );
}

type Forms = Record<BillingForm['type'], BillingForm>;
type Identity = { firstName?: string | null; lastName?: string | null } | null;

/** One form per document type, so switching boleta / factura keeps what was typed in each. */
function initialForms(user: Identity, profile?: Profile): Forms {
  const base = billingFromProfile(
    profile ?? { firstName: user?.firstName ?? null, lastName: user?.lastName ?? null },
  );
  const empty = { documentNumber: '', name: '', address: '' };
  return base.type === '01'
    ? { '01': base, '03': { ...empty, type: '03', documentType: '1' } }
    : { '03': base, '01': { ...empty, type: '01', documentType: '6' } };
}

const billingOptions = [
  ['03', 'Boleta de venta', 'Persona natural · DNI, carné de extranjería o pasaporte'],
  ['01', 'Factura', 'Empresa o persona con negocio · RUC'],
] as const;

function BillingFields({
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
