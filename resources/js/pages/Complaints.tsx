import { Link } from 'react-router-dom';
import bookIcon from '../../images/home/libro-reclamaciones.svg';
import { company } from '../components/layout/Header';
import { PageHero, PageSection } from '../components/layout/PageHero';
import '../../css/storefront.css';

const details = [
  'Tu nombre completo, DNI o RUC, teléfono y correo.',
  'El número de pedido o comprobante, si tienes uno.',
  'Si es un reclamo (sobre un producto o servicio) o una queja (sobre la atención).',
  'Qué pasó y qué solución esperas.',
];

/**
 * Entry point of the virtual complaints book. The online form is pending legal review, so
 * the page explains how to file a complaint through the company's channels meanwhile.
 */
export function Complaints() {
  return (
    <>
      <PageHero
        eyebrow="Atención al cliente"
        title="Libro de Reclamaciones"
        text="Registra un reclamo o una queja sobre tu compra o sobre nuestra atención."
      />
      <PageSection>
        <div className="complaints-page">
          <img src={bookIcon} alt="" width={120} height={72} />
          <div>
            <p className="notice">
              Estamos habilitando el formulario virtual del Libro de Reclamaciones. Mientras tanto,
              puedes presentar tu reclamo o queja por correo o WhatsApp y te confirmaremos su
              recepción.
            </p>
            <h2>Qué incluir en tu mensaje</h2>
            <ul>
              {details.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="complaints-actions">
              <a
                className="button button-primary"
                href={`mailto:${company.email}?subject=${encodeURIComponent('Libro de Reclamaciones')}`}
              >
                Escribir a {company.email}
              </a>
              <a
                className="button button-secondary"
                href={company.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {company.whatsappLabel}
              </a>
            </div>
            <p className="flow-note">
              ¿Solo tienes una consulta? Usa la página de <Link to="/contacto">contacto</Link>.
            </p>
          </div>
        </div>
      </PageSection>
    </>
  );
}
