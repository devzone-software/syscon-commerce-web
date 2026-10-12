import { PageHero, PageSection } from '../components/layout/PageHero';

const values = [
  { title: 'Confianza', text: 'Recomendaciones claras.' },
  { title: 'Calidad', text: 'Selección con criterio técnico.' },
  { title: 'Soporte', text: 'Acompañamiento continuo.' },
];

export function About() {
  return (
    <>
      <PageHero
        eyebrow="NOSOTROS"
        title="Tecnología confiable para crecer contigo"
        text="Acompañamos a empresas y profesionales con soluciones de cómputo, redes y seguridad."
      />
      <PageSection title="Quiénes somos">
        <div className="prose">
          <p>
            SYSCON integra productos, asesoría y soporte técnico para ayudar a implementar
            soluciones tecnológicas de forma simple y confiable.
          </p>
          <p>
            Nuestro enfoque combina atención cercana, selección de equipos y acompañamiento durante
            la compra.
          </p>
        </div>
      </PageSection>
      <PageSection title="Lo que nos representa" soft>
        <ul className="info-grid">
          {values.map((value) => (
            <li key={value.title}>
              <div className="info-card is-plain">
                <strong>{value.title}</strong>
                <span>{value.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}
