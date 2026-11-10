import { InfoRows } from '../cart/OrderSummary';
import { deliveryMethodLabels, type DeliveryForm } from '../../lib/delivery';
import { paymentMethodLabel } from '../../lib/sales';

/** Summarizes the customer's choices without storing or changing the order. */
export function PurchaseReview({
  delivery,
  billingType,
  billingName,
  provider,
}: {
  delivery: DeliveryForm;
  billingType: '01' | '03';
  billingName: string;
  provider: string;
}) {
  return (
    <section className="purchase-review" aria-labelledby="purchase-review-title">
      <h3 id="purchase-review-title">Revisa tu elección</h3>
      <InfoRows
        rows={[
          { label: 'Entrega', value: deliveryMethodLabels[delivery.method] },
          {
            label: delivery.method === 'PICKUP' ? 'Retira' : 'Recibe',
            value: delivery.contactName.trim() || 'Completa el contacto',
          },
          ...(delivery.method === 'DELIVERY'
            ? [
                {
                  label: 'Dirección',
                  value:
                    [delivery.address.trim(), delivery.district.trim()]
                      .filter(Boolean)
                      .join(', ') || 'Completa la dirección',
                },
              ]
            : []),
          { label: 'Pago', value: provider === 'MANUAL' ? 'Pago con asesor' : paymentMethodLabel(provider) },
          { label: 'Comprobante', value: billingType === '01' ? 'Factura' : 'Boleta de venta' },
          {
            label: 'A nombre de',
            value: billingName.trim() || 'Completa los datos del comprobante',
          },
        ]}
      />
    </section>
  );
}
