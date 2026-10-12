import { Link } from 'react-router-dom';
import { PageHero, PageSection } from '../components/layout/PageHero';

export function Contact() {
  return (
    <>
      <PageHero
        eyebrow="CONTACTO"
        title="Conversemos sobre tu próxima solución"
        text="Cuéntanos qué necesitas y nuestro equipo te orientará."
      />
      <PageSection title="Canales de atención">
        <ul className="info-grid">
          <li>
            <Link className="info-card" to="/catalogo">
              <strong>Ventas</strong>
              <span>Productos y cotizaciones</span>
            </Link>
          </li>
          <li>
            <Link className="info-card" to="/cuenta/pedidos">
              <strong>Soporte</strong>
              <span>Seguimiento de tus pedidos</span>
            </Link>
          </li>
          <li>
            <div className="info-card">
              <strong>Horario</strong>
              <span>Lunes a sábado</span>
            </div>
          </li>
        </ul>
      </PageSection>
    </>
  );
}
