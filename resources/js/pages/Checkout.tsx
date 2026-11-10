import { UserIcon } from '../components/icons';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { OrderSummary } from '../components/cart/OrderSummary';
import { BillingFields } from '../components/checkout/BillingFields';
import { DeliveryFields } from '../components/checkout/DeliveryFields';
import { PurchaseReview } from '../components/checkout/PurchaseReview';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { useCartReview } from '../hooks/useCartReview';
import { displayName } from '../lib/auth';
import { onlineGateway, type OnlineGateway } from '../lib/sales';
import {
  billingFromProfile,
  billingPayload,
  validateBilling,
  type BillingForm,
} from '../lib/billing';
import { cartTotal, issueMessages } from '../lib/cart';
import {
  checkoutAttemptKey,
  deliveryCost,
  deliveryFromProfile,
  deliveryPayload,
  forgetCheckoutAttempt,
  validateDelivery,
  type DeliveryForm,
} from '../lib/delivery';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { DeliveryOptions, Payment, Profile } from '../types';
import { ErrorBox, useData } from '../ui';
import { ShoppingBackLink } from '../components/shared/ShoppingBackLink';

export function Checkout() {
  const { cart, clear, user } = useShop();
  const { issues, checking } = useCartReview();
  const navigate = useNavigate();
  const location = useLocation();
  const cartPath =
    (location.state as { cartPath?: string } | null)?.cartPath === '/cuenta/carrito'
      ? '/cuenta/carrito'
      : '/carrito';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const methods = useData(api.paymentMethods);
  const gateway = onlineGateway(methods.data?.gateways);
  const [provider, setProvider] = useState<'MANUAL' | OnlineGateway>('MANUAL');
  const methodsReady = !methods.loading && !methods.error && Boolean(methods.data);
  const providerAvailable =
    methodsReady &&
    (provider === 'MANUAL'
      ? methods.data?.manual === true
      : methods.data?.gateways.includes(provider) === true);
  useEffect(() => {
    if (!methodsReady || providerAvailable) return;
    if (methods.data?.manual) setProvider('MANUAL');
    else if (gateway) setProvider(gateway.provider);
  }, [methodsReady, providerAvailable, methods.data, gateway?.provider]);
  const [forms, setForms] = useState(() => initialForms(user));
  const [type, setType] = useState<BillingForm['type']>('03');
  const [delivery, setDelivery] = useState<DeliveryForm>(() =>
    deliveryFromProfile({ firstName: user?.firstName ?? null, lastName: user?.lastName ?? null }),
  );
  const deliveryOptions = useData<DeliveryOptions>(api.deliveryOptions);
  const options = deliveryOptions.data;
  const edited = useRef(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const showErrors = validationAttempt > 0;
  const checkoutRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!validationAttempt) return;
    const field = checkoutRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    field?.focus();
  }, [validationAttempt]);

  // Prefill from the stored profile unless the customer already started typing.
  useEffect(() => {
    let active = true;
    api
      .profile()
      .then((profile) => {
        if (!active || edited.current) return;
        setForms(initialForms(user, profile));
        setType(billingFromProfile(profile).type);
        setDelivery(deliveryFromProfile(profile));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // The profile is read once per visit; later user changes do not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const billing = forms[type];
  const shipping = deliveryCost(delivery.method, options);
  const billingErrors = validateBilling(billing, cartTotal(cart) + (shipping ?? 0));
  const deliveryErrors = validateDelivery(delivery, options);
  const invalid = Object.keys(billingErrors).length + Object.keys(deliveryErrors).length > 0;
  const updateBilling = (patch: Partial<BillingForm>) => {
    edited.current = true;
    setForms((current) => ({ ...current, [type]: { ...current[type], ...patch } }));
  };
  const updateDelivery = (patch: Partial<DeliveryForm>) => {
    edited.current = true;
    setDelivery((current) => ({ ...current, ...patch }));
  };

  const submit = async () => {
    if (busy || blocked) return;
    if (invalid) {
      setValidationAttempt((attempt) => attempt + 1);
      return;
    }
    setBusy(true);
    setError('');
    const payload = {
      items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      billing: billingPayload(billing),
      delivery: deliveryPayload(delivery),
    };
    try {
      // A retry of this same purchase reuses the key, so it cannot create a second order.
      const order = await api.createOrder({
        ...payload,
        idempotencyKey: checkoutAttemptKey(payload),
      });
      forgetCheckoutAttempt();
      clear();
      // The manual payment request is idempotent; if it fails the order page offers a retry.
      let payment: Payment | null = null;
      try {
        payment = await api.createPayment(order.id, provider);
      } catch {
        payment = null;
      }
      if (provider !== 'MANUAL' && payment?.paymentUrl) {
        window.location.assign(payment.paymentUrl);
        return;
      }
      navigate(`/pedido/${order.id}?nuevo=1`, { state: { payment } });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (!cart.length && !busy) return <Navigate to={cartPath} replace />;
  const blocked =
    !providerAvailable ||
    checking ||
    issues.size > 0 ||
    shipping === null ||
    !options ||
    deliveryOptions.loading ||
    Boolean(deliveryOptions.error);

  return (
    <>
      <PageHero
        eyebrow="TU COMPRA"
        title="Finaliza tu compra"
        text="Elige la entrega y el comprobante, revisa los productos y confirma tu pedido."
      />
      <div className="container shopping-navigation">
        <ShoppingBackLink to={cartPath}>Volver al carrito</ShoppingBackLink>
      </div>
      <div className="container checkout-layout" ref={checkoutRef}>
        <PageSection title="Datos de compra">
          <div className="checkout-identity">
            <span>
              <UserIcon size={21} />
            </span>
            <div>
              <strong>{user ? displayName(user) : 'Mi cuenta'}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <h3 className="checkout-step-title">
            <span>1</span> Entrega
          </h3>
          {deliveryOptions.error ? (
            <ErrorBox
              message={`No pudimos cargar las opciones de entrega. ${deliveryOptions.error}`}
              retry={deliveryOptions.reload}
            />
          ) : (
            <DeliveryFields
              form={delivery}
              options={options}
              errors={showErrors ? deliveryErrors : {}}
              onChange={updateDelivery}
            />
          )}
          <h3 className="checkout-step-title">
            <span>2</span> Comprobante
          </h3>
          <BillingFields
            type={type}
            form={billing}
            errors={showErrors ? billingErrors : {}}
            onType={(value) => {
              edited.current = true;
              setType(value);
            }}
            onChange={updateBilling}
          />
          {showErrors && invalid && (
            <p className="notice error" role="alert">
              Revisa los datos de entrega y del comprobante antes de confirmar.
            </p>
          )}
          <details className="checkout-product-review" open={issues.size > 0 || undefined}>
            <summary>Productos del pedido ({cart.length})</summary>
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
            <Link className="link-button" to={cartPath}>
              Editar carrito
            </Link>
          </details>
          <h3 className="checkout-step-title">
            <span>3</span> Método de pago
          </h3>
          {methods.loading ? (
            <p className="flow-note" role="status">
              Consultando medios de pago…
            </p>
          ) : methods.error ? (
            <ErrorBox
              message={`No pudimos consultar los medios de pago. ${methods.error}`}
              retry={methods.reload}
            />
          ) : !methods.data?.manual && !gateway ? (
            <p className="notice" role="status">
              No hay medios de pago disponibles. Reintenta la consulta o contacta con SYSCON.
              <button type="button" className="link-button" onClick={methods.reload}>
                Reintentar
              </button>
            </p>
          ) : null}
          {methodsReady && methods.data?.manual && (
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                checked={provider === 'MANUAL'}
                onChange={() => setProvider('MANUAL')}
              />
              <span>
                <strong>Transferencia o pago con asesor</strong>
                Crea el pedido y coordina el pago con SYSCON. El personal verificará el abono.
              </span>
            </label>
          )}
          {methodsReady && gateway && (
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                checked={provider === gateway.provider}
                onChange={() => setProvider(gateway.provider)}
              />
              <span>
                <strong>{gateway.label}</strong>Después de registrar el pedido te llevaremos a la
                página de pago.
              </span>
            </label>
          )}
          {error && <ErrorBox message={error} />}
        </PageSection>
        <PageSection title="Resumen del pedido" soft>
          <OrderSummary lines={cart} totalLabel="Total a pagar" shipping={shipping}>
            <PurchaseReview
              delivery={delivery}
              billingType={type}
              billingName={billing.name}
              provider={provider}
            />
            <p className="flow-note purchase-conditions-link">
              <Link to="/informacion-de-compra" target="_blank" rel="noopener">
                Entrega y condiciones de compra
                <span className="visually-hidden"> (se abre en otra pestaña)</span>
              </Link>
            </p>
            {options && !deliveryOptions.loading && !deliveryOptions.error && shipping === null && (
              <div className="notice" role="status">
                No hay una tarifa disponible para esta entrega. Elige otra modalidad o{' '}
                <Link to="/contacto">consulta con SYSCON</Link> antes de confirmar.{' '}
                <button type="button" className="link-button" onClick={deliveryOptions.reload}>
                  Consultar tarifas de nuevo
                </button>
              </div>
            )}
            {issues.size > 0 && (
              <p className="notice error" role="alert">
                Hay productos que requieren atención. <Link to={cartPath}>Revisar carrito</Link>
              </p>
            )}
            <button
              type="button"
              className="flow-button"
              disabled={busy || blocked}
              onClick={submit}
            >
              {busy
                ? 'Creando pedido…'
                : !providerAvailable
                  ? methods.loading
                    ? 'Consultando medios de pago…'
                    : 'Consulta los medios de pago para continuar'
                  : deliveryOptions.error
                    ? 'Entrega no disponible: reintenta la consulta'
                    : checking || deliveryOptions.loading || !options
                      ? 'Verificando disponibilidad…'
                      : shipping === null
                        ? 'Elige una entrega con tarifa disponible'
                        : provider === 'MANUAL'
                          ? 'Confirmar pedido'
                          : provider === 'MERCADOPAGO'
                            ? 'Continuar a Mercado Pago'
                            : 'Continuar al pago de prueba'}
            </button>
          </OrderSummary>
        </PageSection>
      </div>
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
