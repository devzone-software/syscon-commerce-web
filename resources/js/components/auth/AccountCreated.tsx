import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, CheckIcon } from '../icons';

const SECONDS = 5;

/** Confirmation after creating an account; goes to the home page by itself after a countdown. */
export function AccountCreated({ onContinue }: { onContinue: () => void }) {
  const [left, setLeft] = useState(SECONDS);
  const done = useRef(false);
  const go = useRef(onContinue);
  go.current = onContinue;
  const leave = () => {
    if (done.current) return;
    done.current = true;
    go.current();
  };

  useEffect(() => {
    const timer = window.setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (left === 0) leave();
  }, [left]);

  return (
    <div className="auth-done" role="status" aria-live="polite">
      <span className="auth-done-icon">
        <CheckIcon size={28} />
      </span>
      <h2>¡Tu cuenta fue creada con éxito!</h2>
      <p>Ya puedes comprar y seguir tus pedidos en SYSCON.</p>
      <p className="auth-done-redirect">
        Te llevaremos a la página de inicio en <strong>{left}</strong>{' '}
        {left === 1 ? 'segundo' : 'segundos'}…
      </p>
      <span className="auth-done-progress" aria-hidden="true">
        <i style={{ animationDuration: `${SECONDS}s` }} />
      </span>
      <button type="button" className="auth-submit" onClick={leave}>
        Ir al inicio ahora <ArrowRightIcon size={16} />
      </button>
    </div>
  );
}
