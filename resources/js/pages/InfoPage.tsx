import { Link } from 'react-router-dom';
import { company } from '../components/layout/Header';
import { PageHero, PageSection } from '../components/layout/PageHero';
import '../../css/storefront.css';

type Block = { title: string; paragraphs: string[] };
type Info = { eyebrow: string; title: string; text: string; draft?: boolean; blocks: Block[] };

/** Footer pages. The legal texts are drafts until a lawyer reviews them (see PENDIENTES.md). */
export const infoPages: Record<string, Info> = {
  'trabaja-con-nosotros': {
    eyebrow: 'Empresa',
    title: 'Trabaja con nosotros',
    text: 'Buscamos personas que disfruten la tecnología y la atención al cliente.',
    blocks: [
      {
        title: 'Áreas en las que trabajamos',
        paragraphs: [
          'Ventas y atención al cliente, soporte técnico, instalación de redes y cámaras de seguridad, almacén y despacho, y administración.',
        ],
      },
      {
        title: 'Cómo postular',
        paragraphs: [
          `Envía tu CV a ${company.email} con el asunto "Postulación" e indica el área que te interesa. Si tu perfil coincide con una vacante, te contactaremos.`,
        ],
      },
    ],
  },
  'terminos-y-condiciones': {
    eyebrow: 'Legal',
    title: 'Términos y condiciones',
    text: 'Condiciones para comprar en la tienda en línea de Grupo SYSCON.',
    draft: true,
    blocks: [
      {
        title: 'Precios y disponibilidad',
        paragraphs: [
          'Los precios están en soles e incluyen IGV, salvo que se indique otra cosa. El precio y la disponibilidad se confirman al crear el pedido; un pedido sin pagar reserva los productos por un tiempo limitado.',
        ],
      },
      {
        title: 'Pagos',
        paragraphs: [
          'Los pagos en línea se procesan con Mercado Pago. La tienda no recibe ni guarda los datos de tu tarjeta.',
        ],
      },
      {
        title: 'Entregas',
        paragraphs: [
          'Puedes recoger tu pedido en nuestra tienda o pedir envío a domicilio. El costo y las condiciones del envío se muestran antes de pagar.',
        ],
      },
      {
        title: 'Comprobantes',
        paragraphs: [
          'Emitimos boleta o factura electrónica según los datos que indiques al comprar.',
        ],
      },
      {
        title: 'Garantías, cambios y reclamos',
        paragraphs: [
          'Cada producto tiene sus propias condiciones de garantía. Para reclamos o quejas puedes usar nuestro Libro de Reclamaciones.',
        ],
      },
    ],
  },
  privacidad: {
    eyebrow: 'Legal',
    title: 'Cómo cuidamos tu privacidad',
    text: 'Qué datos usamos, para qué y cómo puedes ejercer tus derechos.',
    draft: true,
    blocks: [
      {
        title: 'Datos que usamos',
        paragraphs: [
          'Tu nombre, documento, correo, teléfono y dirección, y los datos de tus pedidos y comprobantes.',
        ],
      },
      {
        title: 'Para qué los usamos',
        paragraphs: [
          'Para atender tus compras, emitir comprobantes, coordinar entregas, darte soporte y responder tus reclamos. No vendemos tus datos.',
        ],
      },
      {
        title: 'Con quién los compartimos',
        paragraphs: [
          'Solo con quienes hacen posible tu compra: la pasarela de pago, SUNAT para los comprobantes electrónicos y el servicio de entrega.',
        ],
      },
      {
        title: 'Tus derechos',
        paragraphs: [
          `Puedes pedir acceder, corregir o eliminar tus datos, u oponerte a su uso, escribiendo a ${company.email}.`,
        ],
      },
    ],
  },
  accesibilidad: {
    eyebrow: 'Ayuda',
    title: 'Accesibilidad',
    text: 'Queremos que todas las personas puedan comprar en nuestra tienda.',
    blocks: [
      {
        title: 'Lo que hacemos',
        paragraphs: [
          'La tienda se puede usar con el teclado, funciona con lectores de pantalla, respeta la opción de reducir el movimiento de tu equipo y se adapta a celulares.',
        ],
      },
      {
        title: '¿Encontraste una barrera?',
        paragraphs: [
          `Escríbenos a ${company.email} contándonos qué página y qué problema encontraste. Lo revisaremos y te ayudaremos a completar tu compra.`,
        ],
      },
    ],
  },
};

export function InfoPage({ slug }: { slug: keyof typeof infoPages }) {
  const page = infoPages[slug];
  return (
    <>
      <PageHero eyebrow={page.eyebrow} title={page.title} text={page.text} />
      <PageSection>
        <div className="info-page">
          {page.draft && (
            <p className="notice">
              Este texto está en revisión legal y puede cambiar. Si tienes dudas, escríbenos desde{' '}
              <Link to="/contacto">Contacto</Link>.
            </p>
          )}
          {page.blocks.map((block) => (
            <section key={block.title}>
              <h2>{block.title}</h2>
              {block.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
          ))}
        </div>
      </PageSection>
    </>
  );
}
