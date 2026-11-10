import { Link } from 'react-router-dom';
import { deliveryCost } from '../../lib/delivery';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData } from '../../ui';
import { TruckIcon, StoreIcon } from '../icons';

/** Delivery rates are read from the same published options used at checkout. */
export function DeliveryPreview({ showTitle = true }: { showTitle?: boolean }) {
  const { data, loading, error, reload } = useData(api.deliveryOptions);
  const pickup = deliveryCost('PICKUP', data);
  const delivery = deliveryCost('DELIVERY', data);
  const price = (value: number) => (value === 0 ? 'Gratis' : money(value));
  return (
    <section className="product-delivery-preview" aria-label="Entrega y tarifas">
      {showTitle && <h2>Entrega y retiro</h2>}
      {loading ? (
        <p role="status">Consultando tarifas…</p>
      ) : error ? (
        <p role="status">
          No pudimos consultar las tarifas.{' '}
          <button type="button" className="link-button" onClick={reload}>
            Reintentar
          </button>
        </p>
      ) : (
        <>
          <div className="delivery-options-compact">
            <div>
              <StoreIcon size={19} />
              <span>Retiro en tienda</span>
              <strong>{pickup === null ? 'No disponible' : price(pickup)}</strong>
            </div>
            <div>
              <TruckIcon size={19} />
              <span>Envío a domicilio</span>
              <strong>{delivery === null ? 'Consultar' : price(delivery)}</strong>
            </div>
          </div>
          <details className="delivery-location-details">
            <summary>Punto de retiro y cobertura</summary>
            {data?.pickup.address && (
              <p>
                <strong>Retiro:</strong> {data.pickup.address}
              </p>
            )}
            {data?.pickup.hours && (
              <p>
                <strong>Horario:</strong> {data.pickup.hours}
              </p>
            )}
            {data?.delivery.enabled && data.delivery.areas && (
              <p>
                <strong>Cobertura:</strong> {data.delivery.areas}
              </p>
            )}
            <p>
              Confirma la modalidad y el total al finalizar tu compra. Para otros destinos,{' '}
              <Link to="/contacto">consulta con nosotros</Link>.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
