const steps = ['Carrito', 'Confirmación', 'Pago'];

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="checkout-steps" aria-label="Progreso de la compra">
      {steps.map((step, index) => {
        const number = index + 1;
        const state = number < current ? 'done' : number === current ? 'current' : 'next';
        return (
          <li
            key={step}
            className={`is-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span aria-hidden="true">{number}</span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}
