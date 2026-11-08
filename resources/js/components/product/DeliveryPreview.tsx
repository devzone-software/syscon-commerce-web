import { Link } from 'react-router-dom';
import { deliveryCost } from '../../lib/delivery';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData } from '../../ui';

/** Shows the same published delivery rates as checkout before the customer adds a product. */
export function DeliveryPreview() {
  const { data, loading, error, reload } = useData(api.deliveryOptions);
  const pickup = deliveryCost('PICKUP', data);
  const delivery = deliveryCost('DELIVERY', data);
  const price = (value: number) => (value === 0 ? 'Gratis' : money(value));

  return (
    <section className="product-delivery-preview" aria-label="Entrega y tarifas">
      <h2>Entrega y retiro</h2>
      {loading ? (
        <p role="status">Consultando tarifas de entrega…</p>
      ) : error ? (
        <p role="status">
          No pudimos consultar las tarifas.{' '}
          <button type="button" className="link-button" onClick={reload}>
            Reintentar
          </button>
        </p>
      ) : (
        <ul>
          <li>
            <strong>Retiro en tienda:</strong> {pickup === null ? 'No disponible' : price(pickup)}.
            {data?.pickup.address && ` ${data.pickup.address}.`}
            {data?.pickup.hours && ` Horario: ${data.pickup.hours}.`}
          </li>
          <li>
            <strong>Envío a domicilio:</strong>{' '}
            {delivery === null ? 'Sin tarifa disponible' : price(delivery)}.
            {data?.delivery.enabled && data.delivery.areas && ` Cobertura: ${data.delivery.areas}.`}
          </li>
        </ul>
      )}
      <p>
        Revisa la modalidad y el total en el checkout. Para otros destinos,{' '}
        <Link to="/contacto">consulta antes de comprar</Link>.
      </p>
    </section>
  );
}
