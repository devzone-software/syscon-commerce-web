import { orderFlow, orderStatusLabels } from '../../lib/orders';

export function OrderTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED') return <p className="notice error">Este pedido fue cancelado.</p>;
  if (status === 'EXPIRED')
    return (
      <p className="notice error">
        Este pedido venció porque no se confirmó su pago a tiempo; los productos reservados se
        liberaron.
      </p>
    );
  const current = orderFlow.indexOf(status);
  return (
    <ol className="order-timeline" aria-label="Estado del pedido">
      {orderFlow.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'next';
        return (
          <li
            key={step}
            className={`is-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span aria-hidden="true" />
            {orderStatusLabels[step]}
          </li>
        );
      })}
    </ol>
  );
}
