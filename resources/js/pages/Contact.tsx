import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import homeIcon from '../../images/catalog/home.svg';
import {
  ArrowRightIcon,
  BoxIcon,
  BuildingIcon,
  ChatIcon,
  CheckIcon,
  HeadsetIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
} from '../components/icons';
import { company } from '../components/layout/Header';
import { isEmail } from '../lib/validation';
import '../../css/contact.css';

const whatsapp = { label: '+51 987 654 321', href: 'https://wa.me/51987654321' };
const address = 'Av. República de Panamá 3545, San Isidro, Lima';
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}`;

const subjects = [
  'Ventas y cotizaciones',
  'Soporte técnico',
  'Seguimiento de pedido',
  'Facturación y cobranzas',
  'Otro',
];

const faqs = [
  {
    q: '¿Cómo puedo realizar una compra y solicitar factura electrónica con RUC 20?',
    a: 'Agrega los productos al carrito, inicia sesión y confirma tu pedido en el checkout. Indica a tu asesor el RUC para emitir la factura electrónica cuando se confirme el pago.',
  },
  {
    q: '¿Qué métodos de pago aceptan en la tienda virtual?',
    a: 'Trabajamos con pago manual: transferencia bancaria o pago coordinado B2B. Al crear el pedido se registra la solicitud y un asesor confirma el pago tras verificarlo.',
  },
  {
    q: '¿Cómo y en cuánto tiempo recibo mi producto?',
    a: 'Una vez confirmado el pago, nuestro equipo prepara el pedido y coordina contigo la entrega o el retiro en almacén.',
  },
  {
    q: '¿Cómo solicito soporte técnico para la activación o instalación de mi producto?',
    a: 'Escríbenos por WhatsApp, llámanos a la central o envía el formulario de esta página indicando tu número de pedido.',
  },
  {
    q: '¿Cómo consulto el estado de mi pedido?',
    a: 'Ingresa a Mi cuenta > Mis pedidos: verás el estado, el detalle y el pago de cada compra.',
  },
  {
    q: '¿Los productos cuentan con garantía oficial de fábrica?',
    a: 'Sí, comercializamos productos originales con garantía del fabricante. Consulta las condiciones específicas de cada producto con un asesor.',
  },
];

/** Figma "Client / Contacto". The form opens the visitor's email client: the API has no inbox. */
export function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    order: '',
    subject: '',
    message: '',
    accepted: false,
  });
  const [error, setError] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isEmail(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setError('');
    const body = [
      `Nombre: ${form.name}`,
      `Correo: ${form.email}`,
      `Teléfono / WhatsApp: ${form.phone}`,
      ...(form.order ? [`N° de pedido o factura: ${form.order}`] : []),
      '',
      form.message,
    ].join('\n');
    window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(
      `[Web] ${form.subject}`,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="contact-page">
      <div className="container contact-crumb">
        <nav aria-label="Ruta de navegación">
          <Link to="/">
            <img src={homeIcon} alt="" /> Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Contacto</span>
        </nav>
        <span className="contact-crumb-pill">
          <i aria-hidden="true" /> Atención al Cliente y Soporte Corporativo
        </span>
      </div>

      <div className="container">
        <section className="contact-hero" aria-labelledby="contact-title">
          <div>
            <p className="contact-eyebrow">CANAL OFICIAL DE ATENCIÓN</p>
            <h1 id="contact-title">¿Cómo podemos ayudarte?</h1>
            <p className="contact-hero-lead">
              Comunícate con nuestro equipo para consultas comerciales, cotizaciones corporativas
              con <strong>RUC 20</strong>, soporte técnico especializado o información sobre tus
              pedidos.
            </p>
            <p className="contact-hero-note">
              Estamos disponibles para ayudarte antes, durante y después de tu compra con atención
              humana, rigurosa y personalizada.
            </p>
          </div>
          <ul>
            <li>
              <ShieldIcon size={20} />
              <span>
                <strong>Atención Certificada</strong>Ingenieros e IT Sales Specialists
              </span>
            </li>
            <li>
              <ChatIcon size={20} />
              <span>
                <strong>Atención Corporativa</strong>Respuesta rápida por WhatsApp
              </span>
            </li>
          </ul>
        </section>

        <ul className="contact-channels">
          <li>
            <i className="is-green">
              <ChatIcon size={22} />
            </i>
            <p className="contact-eyebrow">LÍNEA DIRECTA 1-TO-1</p>
            <h2>WhatsApp Oficial</h2>
            <p>
              Escríbenos directamente para recibir atención inmediata y cotizaciones al instante.
            </p>
            <code>{whatsapp.label}</code>
            <a href={whatsapp.href} target="_blank" rel="noreferrer" className="is-green">
              <ChatIcon size={16} /> Hablar por WhatsApp
            </a>
          </li>
          <li>
            <i>
              <PhoneIcon size={22} />
            </i>
            <p className="contact-eyebrow">CENTRAL TELEFÓNICA</p>
            <h2>Llamada Directa</h2>
            <p>Comunícate directamente con nuestro equipo de atención comercial y soporte.</p>
            <code>{company.phone}</code>
            <a href={company.phoneHref} className="is-blue">
              <PhoneIcon size={16} /> Llamar ahora
            </a>
          </li>
          <li>
            <i>
              <MailIcon size={22} />
            </i>
            <p className="contact-eyebrow">BANDEJA OFICIAL</p>
            <h2>Correo Electrónico</h2>
            <p>Envíanos tu consulta, requerimientos o pliegos de licitaciones formales.</p>
            <code>{company.email}</code>
            <a href={`mailto:${company.email}`} className="is-navy">
              <ArrowRightIcon size={16} /> Enviar correo
            </a>
          </li>
          <li>
            <i className="is-indigo">
              <HeadsetIcon size={22} />
            </i>
            <p className="contact-eyebrow">HELP DESK &amp; CERTIFICACIÓN</p>
            <h2>Mesa de Ayuda IT</h2>
            <p>¿Asistencia técnica para activación o instalación de tus productos?</p>
            <code className="is-green">Respuesta técnica garantizada</code>
            <a href="#formulario" className="is-teal">
              <ReceiptIcon size={16} /> Solicitar soporte
            </a>
          </li>
        </ul>

        <div className="contact-main">
          <section id="formulario" className="contact-form" aria-labelledby="contact-form-title">
            <p className="contact-eyebrow">FORMULARIO B2B &amp; CONSUMIDOR</p>
            <h2 id="contact-form-title">Envíanos un mensaje</h2>
            <p className="contact-form-lead">
              Completa los detalles de tu requerimiento tecnológico para asignarte el asesor técnico
              comercial adecuado.
            </p>
            <form onSubmit={submit}>
              <div className="contact-grid">
                <label>
                  <span>
                    Nombre Completo <em>*</em>
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => set('name')(event.target.value)}
                    placeholder="Ingresa tu nombre y apellidos"
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>
                    Correo Electrónico <em>*</em> <small>Uso corporativo preferido</small>
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => set('email')(event.target.value)}
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    aria-invalid={error ? true : undefined}
                  />
                </label>
                <label>
                  <span>
                    Teléfono / WhatsApp <em>*</em>
                  </span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) => set('phone')(event.target.value)}
                    placeholder="+51 999 999 999"
                    autoComplete="tel"
                  />
                </label>
                <label>
                  <span>
                    N° de Pedido o Factura <small>(Opcional)</small>
                  </span>
                  <input
                    value={form.order}
                    onChange={(event) => set('order')(event.target.value)}
                    placeholder="Ej. 15A4E7FF"
                  />
                </label>
              </div>
              <label>
                <span>
                  Asunto / Motivo de consulta <em>*</em>
                </span>
                <select
                  required
                  value={form.subject}
                  onChange={(event) => set('subject')(event.target.value)}
                >
                  <option value="" disabled>
                    Selecciona el área de tu consulta...
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  Mensaje en detalle <em>*</em>
                </span>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(event) => set('message')(event.target.value)}
                  placeholder="Cuéntanos en detalle cómo podemos ayudarte con tu requerimiento tecnológico (especificaciones, cantidades estimadas, software o urgencia del despacho)..."
                />
              </label>
              <label className="contact-consent">
                <input
                  type="checkbox"
                  required
                  checked={form.accepted}
                  onChange={(event) => set('accepted')(event.target.checked)}
                />
                <span>
                  Acepto el tratamiento de mis datos personales para atender esta consulta, conforme
                  a la Ley N° 29733 de Perú.
                </span>
              </label>
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              <div className="contact-submit">
                <button type="submit">
                  Enviar mensaje <ArrowRightIcon size={16} />
                </button>
                <span>
                  <LockIcon size={13} /> Se abrirá tu correo con el mensaje listo
                </span>
              </div>
            </form>
          </section>

          <aside className="contact-side">
            <section className="contact-info" aria-labelledby="contact-info-title">
              <p className="contact-eyebrow">CENTRO DE OPERACIONES</p>
              <h2 id="contact-info-title">Información Corporativa</h2>
              <ul>
                <li>
                  <i>
                    <PhoneIcon size={16} />
                  </i>
                  <span>
                    <strong>Teléfono Central</strong>
                    <a href={company.phoneHref}>{company.phone}</a>
                  </span>
                </li>
                <li>
                  <i>
                    <ChatIcon size={16} />
                  </i>
                  <span>
                    <strong>WhatsApp Comercial B2B</strong>
                    <a href={whatsapp.href} target="_blank" rel="noreferrer">
                      {whatsapp.label}
                    </a>
                    <small className="is-green">Cotizaciones y disponibilidad</small>
                  </span>
                </li>
                <li>
                  <i>
                    <MailIcon size={16} />
                  </i>
                  <span>
                    <strong>Correos Oficiales</strong>
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                    <a href="mailto:ventas@gruposyscon.pe">ventas@gruposyscon.pe</a>
                  </span>
                </li>
                <li>
                  <i>
                    <BuildingIcon size={16} />
                  </i>
                  <span>
                    <strong>Sede Fiscal y Despachos</strong>
                    <b>Av. República de Panamá 3545</b>
                    <small>San Isidro, Lima - Perú</small>
                  </span>
                </li>
              </ul>
            </section>
            <section className="contact-hours" aria-labelledby="contact-hours-title">
              <h2 id="contact-hours-title">
                <SearchIcon size={20} /> Horarios de Atención
              </h2>
              <dl>
                <div>
                  <dt>Lunes a Viernes:</dt>
                  <dd>8:30 a. m. - 6:30 p. m.</dd>
                </div>
                <div>
                  <dt>Sábados:</dt>
                  <dd>9:00 a. m. - 1:30 p. m.</dd>
                </div>
                <div>
                  <dt>Domingos y Feriados:</dt>
                  <dd className="is-plain">Cerrado (Web 24/7 Activa)</dd>
                </div>
              </dl>
              <p className="contact-eyebrow">TIEMPO ESTIMADO DE RESPUESTA</p>
              <div className="contact-response">
                <span>
                  <strong>&lt; 5 min</strong>WhatsApp Comercial
                </span>
                <span>
                  <strong>&lt; 2 hrs</strong>Correo electrónico
                </span>
              </div>
            </section>
          </aside>
        </div>

        <section className="contact-areas" aria-labelledby="contact-areas-title">
          <div className="contact-center">
            <p className="contact-eyebrow">ÁREAS ESPECIALIZADAS</p>
            <h2 id="contact-areas-title">Atención técnica y comercial a tu medida</h2>
            <p>Selecciona el canal directo para resolver tu requerimiento sin intermediarios.</p>
          </div>
          <ul>
            <li>
              <i>
                <StoreIcon size={20} />
              </i>
              <h3>Ventas y Licitaciones</h3>
              <p>
                Consulta precios por volumen, disponibilidad de stock y cotizaciones formales con
                RUC 20 para tu organización.
              </p>
              <a href={`mailto:${company.email}?subject=${encodeURIComponent('Ventas')}`}>
                Contactar ventas <ArrowRightIcon size={14} />
              </a>
            </li>
            <li>
              <i className="is-sky">
                <HeadsetIcon size={20} />
              </i>
              <h3>Soporte Técnico IT</h3>
              <p>
                Asistencia remota para activación de licencias, configuración de servidores e
                infraestructura.
              </p>
              <a href="#formulario">
                Solicitar soporte <ArrowRightIcon size={14} />
              </a>
            </li>
            <li>
              <i>
                <TruckIcon size={20} />
              </i>
              <h3>Seguimiento de Pedidos</h3>
              <p>Consulta el estado, el detalle y el pago de cada pedido desde tu cuenta.</p>
              <Link to="/cuenta/pedidos">
                Consultar pedido <ArrowRightIcon size={14} />
              </Link>
            </li>
            <li>
              <i className="is-green">
                <ReceiptIcon size={20} />
              </i>
              <h3>Facturación y Cobranzas</h3>
              <p>Solicita copias de facturas electrónicas, notas de crédito o constancias SUNAT.</p>
              <a href={`mailto:${company.email}?subject=${encodeURIComponent('Facturación')}`}>
                Consultar facturación <ArrowRightIcon size={14} />
              </a>
            </li>
          </ul>
        </section>

        <section className="contact-location" aria-labelledby="contact-location-title">
          <div className="contact-map">
            <p>
              <SearchIcon size={16} /> Plano Geográfico de Operaciones
              <code>Coords: -12.0984, -77.0252</code>
            </p>
            <div>
              <span>
                <BuildingIcon size={22} />
                <span>
                  <strong>Sede Central SYSCON</strong>
                  San Isidro, Lima
                </span>
              </span>
            </div>
          </div>
          <div className="contact-location-copy">
            <p className="contact-eyebrow">CENTRO DE DISTRIBUCIÓN Y OFICINAS</p>
            <h2 id="contact-location-title">Encuéntranos en San Isidro</h2>
            <p>
              Nuestras instalaciones combinan atención a clientes corporativos B2B y almacén para
              retiro de pedidos programados.
            </p>
            <dl>
              <div>
                <dt>
                  <BuildingIcon size={15} /> Dirección:
                </dt>
                <dd>{address}.</dd>
              </div>
              <div>
                <dt>
                  <BoxIcon size={15} /> Retiro en almacén:
                </dt>
                <dd>Lunes a Viernes: 9:00 a. m. a 5:30 p. m. (previa confirmación de pedido).</dd>
              </div>
            </dl>
            <div className="contact-location-actions">
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="is-primary">
                Abrir Google Maps
              </a>
              <a href={wazeUrl} target="_blank" rel="noreferrer">
                Abrir en Waze
              </a>
            </div>
          </div>
        </section>

        <section className="contact-whatsapp" aria-labelledby="contact-whatsapp-title">
          <div>
            <span>
              <ShieldIcon size={12} /> Respuesta Inmediata
            </span>
            <h2 id="contact-whatsapp-title">
              ¿Necesitas una respuesta inmediata o cotización urgente?
            </h2>
            <p>
              Escríbenos directamente a nuestra línea oficial de WhatsApp Business y un asesor
              comercial te atenderá con stock confirmado y precios mayoristas.
            </p>
          </div>
          <a href={whatsapp.href} target="_blank" rel="noreferrer">
            <ChatIcon size={18} /> Chatear por WhatsApp ahora ({whatsapp.label})
          </a>
        </section>

        <section className="contact-faq" aria-labelledby="contact-faq-title">
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

        <section className="contact-commitment" aria-labelledby="contact-commitment-title">
          <div>
            <p className="contact-eyebrow">COMPROMISO SYSCON</p>
            <h2 id="contact-commitment-title">
              Estamos contigo antes, durante y después de tu compra
            </h2>
            <p>
              Nuestro equipo de ingenieros de sistemas acompaña de principio a fin la implementación
              y validez legal de tus licencias y equipos adquiridos.
            </p>
          </div>
          <ul>
            <li>
              <HeadsetIcon size={20} />
              <strong>Soporte Remoto</strong>Sin costo adicional
            </li>
            <li>
              <CheckIcon size={20} />
              <strong>Garantía Escrita</strong>Oficial de fábrica
            </li>
            <li>
              <TruckIcon size={20} />
              <strong>Seguimiento Real</strong>Estado de cada pedido
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
