import { useEffect, useState } from 'react';

const faqs = [
  {
    q: '¿Cómo puedo comprar y solicitar una factura con mi RUC?',
    a: 'Agrega los productos al carrito e inicia sesión. En el checkout elige boleta o factura, registra los datos y confirma el pedido. Luego podrás consultar el estado del comprobante desde tu cuenta.',
  },
  {
    q: '¿Qué métodos de pago aceptan en la tienda virtual?',
    a: 'El checkout muestra los medios habilitados: pago manual y, cuando está disponible, pago en línea. Un asesor verifica los pagos manuales; la pasarela confirma los pagos en línea.',
  },
  {
    q: '¿Cómo y en cuánto tiempo recibo mi producto?',
    a: 'Una vez confirmado el pago, nuestro equipo prepara el pedido y coordina contigo la entrega o el retiro en almacén.',
  },
  {
    q: '¿Cómo solicito soporte técnico para la activación o instalación de mi producto?',
    a: 'Llámanos a la central o prepara un correo con el formulario de esta página indicando tu número de pedido.',
  },
  {
    q: '¿Cómo consulto el estado de mi pedido?',
    a: 'Ingresa a Mi cuenta > Mis pedidos: verás el estado, el detalle y el pago de cada compra.',
  },
  {
    q: '¿Los productos cuentan con garantía oficial de fábrica?',
    a: 'Consulta la cobertura, el plazo y las condiciones de garantía de cada producto antes de comprar. Un asesor puede ayudarte a verificarlos.',
  },
];

export function ContactFaq() {
  const [open, setOpen] = useState<number | null>(null);
  // "Preguntas" in the account menu opens the contact page right on this section.
  useEffect(() => {
    if (window.location.hash === '#preguntas')
      document.getElementById('preguntas')?.scrollIntoView({ block: 'start' });
  }, []);
  return (
    <section id="preguntas" className="contact-faq" aria-labelledby="contact-faq-title">
      <div className="contact-center">
        <p className="contact-eyebrow">CENTRO DE AYUDA</p>
        <h2 id="contact-faq-title">Preguntas Frecuentes</h2>
        <p>Respuestas rápidas a las consultas más comunes de nuestros clientes.</p>
      </div>
      <ul>
        {faqs.map((faq, index) => (
          <li key={faq.q} className={open === index ? 'is-open' : undefined}>
            <button
              type="button"
              aria-expanded={open === index}
              onClick={() => setOpen(open === index ? null : index)}
            >
              {index + 1}. {faq.q}
            </button>
            {open === index && <p>{faq.a}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
