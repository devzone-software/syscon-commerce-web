import { Link } from 'react-router-dom';
import { Empty } from '../ui';

export function NotFound() {
  return (
    <div className="container page">
      <Empty
        title="Página no encontrada"
        text="La dirección que buscas no existe."
        action={
          <Link className="button button-primary" to="/">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
