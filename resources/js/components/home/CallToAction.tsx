import { Link } from 'react-router-dom';
import { ArrowIcon } from '../icons';

export function CallToAction() {
  return (
    <section className="container home-cta" aria-labelledby="home-cta-title">
      <div>
        <h2 id="home-cta-title">Encuentra lo que necesitas</h2>
        <p>Recorre el catálogo completo y filtra por categoría, marca o nombre.</p>
      </div>
      <Link className="home-button home-button-primary" to="/catalogo">
        Ver catálogo <ArrowIcon />
      </Link>
    </section>
  );
}
