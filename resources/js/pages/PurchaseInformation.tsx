import { Link } from 'react-router-dom';
import { PageHero, PageSection } from '../components/layout/PageHero';
import { ShoppingBackLink } from '../components/shared/ShoppingBackLink';
import { DeliveryPreview } from '../components/product/DeliveryPreview';
import { useAccountPath } from '../hooks/useAccountPath';
import { onlineGateway } from '../lib/sales';
import { deliveryCost } from '../lib/delivery';
import { money } from '../state';
import { api } from '../services/api';
import { ErrorBox, useData } from '../ui';

/** Customer information based on current features; it does not invent commercial policies. */
export function PurchaseInformation() {
  const accountPath = useAccountPath();
  const methods = useData(api.paymentMethods);
  const gateway = onlineGateway(methods.data?.gateways);
  const delivery = useData(api.deliveryOptions);
  const pickupCost = deliveryCost('PICKUP', delivery.data);
  const shippingCost = deliveryCost('DELIVERY', delivery.data);
  const price = (cost: number) => (cost === 0 ? 'gratis' : money(cost));
  const deliverySummary = delivery.loading
    ? 'Consultando opciones…'
    : delivery.error
      ? 'Consulta las opciones y tarifas'
      : [
          pickupCost !== null ? `Retiro ${price(pickupCost)}` : 'Retiro no disponible',
          shippingCost !== null ? `Envío ${price(shippingCost)}` : 'Envío no disponible',
        ].join(' · ');
  return (
    <>
      <PageHero
        eyebrow="ANTES DE COMPRAR"
        title="Información de compra"
        text="Abre el tema que necesitas consultar."
      />
      <div className="container shopping-navigation">
        <ShoppingBackLink to={accountPath('/catalogo')}>Volver a productos</ShoppingBackLink>
      </div>
      <PageSection>
        <div className="purchase-information-grid">
          <details className="purchase-information-card">
            <summary>
              <span>
                <strong>Entrega</strong>
                <small>{deliverySummary}</small>
              </span>
              <span className="purchase-disclosure-icon" aria-hidden="true" />
            </summary>
            <div className="purchase-information-body">
              <DeliveryPreview showTitle={false} />
              <p>
                Para retiro en tienda, espera a que tu pedido figure como «Listo para recoger» y
                confirma el punto y horario antes de acercarte.
              </p>
            </div>
          </details>
          <details className="purchase-information-card">
            <summary>
              <span>
                <strong>Pagos</strong>
                <small>
                  {methods.loading
                    ? 'Consultando medios…'
                    : methods.error
                      ? 'Consulta los medios disponibles'
                      : [gateway?.label, methods.data?.manual ? 'Pago con asesor' : null]
                          .filter(Boolean)
                          .join(' · ') || 'Sin medios disponibles'}
                </small>
              </span>
              <span className="purchase-disclosure-icon" aria-hidden="true" />
            </summary>
            <div className="purchase-information-body">
              {methods.loading ? (
                <p role="status">Consultando medios de pago…</p>
              ) : methods.error ? (
                <ErrorBox
                  message="No pudimos consultar los medios de pago."
                  retry={methods.reload}
                />
              ) : (
                <>
                  <ul>
                    {gateway && (
                      <li>
                        <strong>{gateway.label}:</strong> continuarás a la página de pago después de
                        registrar el pedido. La pasarela informa el resultado.
                      </li>
                    )}
                    {methods.data?.manual && (
                      <li>
                        <strong>Pago con asesor:</strong> registra el pedido y sigue las
                        indicaciones de pago. El personal verifica el abono antes de confirmarlo.
                      </li>
                    )}
                  </ul>
                  {!gateway && !methods.data?.manual && (
                    <p>
                      No hay medios de pago disponibles actualmente. Consulta con SYSCON antes de
                      crear un pedido.
                    </p>
                  )}
                  <p>Revisa el total antes de confirmar el pedido.</p>
                </>
              )}
            </div>
          </details>
          <details className="purchase-information-card">
            <summary>
              <span>
                <strong>Comprobantes</strong>
                <small>Elige boleta o factura al comprar</small>
              </span>
              <span className="purchase-disclosure-icon" aria-hidden="true" />
            </summary>
            <div className="purchase-information-body">
              <p>Para factura, registra tu RUC y los datos de facturación en el checkout.</p>
              <p>
                Descarga el comprobante desde tu pedido cuando esté disponible. Es distinto del
                recibo de la pasarela.
              </p>
              <Link className="link-button" to="/cuenta/pedidos">
                Consultar mis pedidos
              </Link>
            </div>
          </details>
          <details className="purchase-information-card">
            <summary>
              <span>
                <strong>Garantía y ayuda</strong>
                <small>Consulta las condiciones de tu producto</small>
              </span>
              <span className="purchase-disclosure-icon" aria-hidden="true" />
            </summary>
            <div className="purchase-information-body">
              <p>
                Consulta la cobertura y condiciones de garantía del producto antes de comprar. Para
                solicitar un cambio, devolución o asistencia, indica tu número de pedido, el
                producto y lo ocurrido.
              </p>

              <Link className="link-button" to={accountPath('/contacto') + '#formulario'}>
                Consultar con SYSCON
              </Link>
            </div>
          </details>
        </div>
      </PageSection>
    </>
  );
}
