import { ContentDisclosure } from '../components/shared/ContentDisclosure';
import { Link } from 'react-router-dom';
import { useAccountPath } from '../hooks/useAccountPath';
import homeIcon from '../../images/catalog/home.svg';
import {
  ArrowRightIcon,
  BoxIcon,
  BuildingIcon,
  ChatIcon,
  CheckIcon,
  HeadsetIcon,
  MailIcon,
  PhoneIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
} from '../components/icons';
import { company } from '../components/layout/Header';
import { ContactForm } from '../components/contact/ContactForm';
import { ContactFaq } from '../components/contact/ContactFaq';
import '../../css/contact.css';

const whatsapp = { label: company.whatsappLabel, href: company.whatsappHref };
const address = company.city;
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Figma "Client / Contacto". The form opens the visitor's email client: the API has no inbox. */
export function Contact() {
  const accountPath = useAccountPath();
  const inAccount = accountPath('/') === '/cuenta';

  return (
    <div className={`contact-page${inAccount ? ' is-account' : ''}`}>
      <div className="container contact-crumb">
        <nav aria-label="Ruta de navegación">
          <Link to={accountPath('/')}>
            <img src={homeIcon} alt="" /> {accountPath('/') === '/cuenta' ? 'Mi cuenta' : 'Inicio'}
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
              Ventas, cotizaciones, soporte técnico y consultas sobre tus pedidos.
            </p>
            <p className="contact-hero-note">
              Elige el canal que te resulte más cómodo.
            </p>
          </div>
          <ul>
            <li>
              <ShieldIcon size={20} />
              <span>
                <strong>Atención al cliente</strong>Consultas comerciales y técnicas
              </span>
            </li>
            <li>
              <ChatIcon size={20} />
              <span>
                <strong>Atención Corporativa</strong>Consultas y cotizaciones por WhatsApp
              </span>
            </li>
          </ul>
        </section>

        <ul className="contact-channels">
          <li>
            <i className="is-green">
              <ChatIcon size={22} />
            </i>
            <p className="contact-eyebrow">ATENCIÓN COMERCIAL</p>
            <h2>WhatsApp</h2>
            <p>Escríbenos para consultar disponibilidad y solicitar una cotización.</p>
            <code>{whatsapp.label}</code>
            <a href={whatsapp.href} target="_blank" rel="noreferrer" className="is-green">
              <ChatIcon size={16} /> Hablar por WhatsApp
            </a>
          </li>
          <li>
            <i>
              <PhoneIcon size={22} />
            </i>
            <p className="contact-eyebrow">ATENCIÓN TELEFÓNICA</p>
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
            <p className="contact-eyebrow">CORREO</p>
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
            <p className="contact-eyebrow">AYUDA SOBRE TUS PRODUCTOS</p>
            <h2>Soporte técnico</h2>
            <p>¿Asistencia técnica para activación o instalación de tus productos?</p>
            <a href="#formulario" className="is-teal">
              <ReceiptIcon size={16} /> Solicitar soporte
            </a>
          </li>
        </ul>

        <div className="contact-main">
          <ContactForm />

          <ContentDisclosure title="Datos de la empresa y cobertura">
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
                      <strong>WhatsApp Comercial</strong>
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
                      <a href={`mailto:${company.salesEmail}`}>{company.salesEmail}</a>
                    </span>
                  </li>
                  <li>
                    <i>
                      <BuildingIcon size={16} />
                    </i>
                    <span>
                      <strong>Ubicación</strong>
                      <b>{company.city}</b>
                      <small>Coordina la dirección de retiro antes de acudir.</small>
                    </span>
                  </li>
                </ul>
              </section>
              <section className="contact-hours" aria-labelledby="contact-hours-title">
                <h2 id="contact-hours-title">
                  <SearchIcon size={20} /> Cobertura de atención
                </h2>
                <p>
                  El checkout muestra las modalidades de entrega habilitadas. Para otras
                  ubicaciones, consulta al equipo antes de confirmar tu compra. La instalación y el
                  soporte se coordinan en Juliaca y la región Puno.
                </p>
                <p className="contact-eyebrow">Consulta por WhatsApp los horarios vigentes.</p>
              </section>
            </aside>
          </ContentDisclosure>
        </div>

        <ContentDisclosure title="Áreas de atención">
          <section className="contact-areas" aria-labelledby="contact-areas-title">
            <div className="contact-center">
              <p className="contact-eyebrow">ÁREAS ESPECIALIZADAS</p>
              <h2 id="contact-areas-title">Atención técnica y comercial a tu medida</h2>
              <p>Elige el canal de contacto que prefieras para consultas comerciales o técnicas.</p>
            </div>
            <ul>
              <li>
                <i>
                  <StoreIcon size={20} />
                </i>
                <h3>Ventas y Licitaciones</h3>
                <p>
                  Consulta precios por volumen, disponibilidad y cotizaciones formales con factura
                  para tu organización.
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
                <p>
                  Consulta tus comprobantes disponibles y solicita orientación sobre facturación.
                </p>
                <a href={`mailto:${company.email}?subject=${encodeURIComponent('Facturación')}`}>
                  Consultar facturación <ArrowRightIcon size={14} />
                </a>
              </li>
            </ul>
          </section>
        </ContentDisclosure>

        <ContentDisclosure title="Ubicación y cómo llegar">
          <section className="contact-location" aria-labelledby="contact-location-title">
            <div className="contact-map">
              <p>
                <SearchIcon size={16} /> Zona de atención
                <code>Juliaca · Puno</code>
              </p>
              <div>
                <span>
                  <BuildingIcon size={22} />
                  <span>
                    <strong>SYSCON</strong>
                    Juliaca, Puno
                  </span>
                </span>
              </div>
            </div>
            <div className="contact-location-copy">
              <p className="contact-eyebrow">CONTACTO Y RETIRO COORDINADO</p>
              <h2 id="contact-location-title">Atención en Juliaca</h2>
              <p>
                Coordina con nuestro equipo la dirección exacta y el horario antes de acudir para
                retirar tu pedido.
              </p>
              <dl>
                <div>
                  <dt>
                    <BuildingIcon size={15} /> Ciudad:
                  </dt>
                  <dd>{address}.</dd>
                </div>
                <div>
                  <dt>
                    <BoxIcon size={15} /> Retiro en almacén:
                  </dt>
                  <dd>Dirección y horario por confirmar con el equipo al coordinar tu pedido.</dd>
                </div>
              </dl>
              <div className="contact-location-actions">
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="link-button">
                  Consultar referencia de la ciudad en Google Maps
                </a>
              </div>
            </div>
          </section>
        </ContentDisclosure>

        <ContentDisclosure title="Contactar por WhatsApp">
          <section className="contact-whatsapp" aria-labelledby="contact-whatsapp-title">
            <div>
              <span>
                <ShieldIcon size={12} /> Consulta directa
              </span>
              <h2 id="contact-whatsapp-title">
                ¿Necesitas una cotización o consultar disponibilidad?
              </h2>
              <p>
                Escríbenos por WhatsApp para consultar disponibilidad, cotizaciones y opciones de
                entrega. Un asesor te confirmará las condiciones de tu pedido.
              </p>
            </div>
            <a href={whatsapp.href} target="_blank" rel="noreferrer">
              <ChatIcon size={18} /> Chatear por WhatsApp ahora ({whatsapp.label})
            </a>
          </section>
        </ContentDisclosure>

        <ContactFaq />

        <ContentDisclosure title="Atención y condiciones de compra">
          <section className="contact-commitment" aria-labelledby="contact-commitment-title">
            <div>
              <p className="contact-eyebrow">COMPROMISO SYSCON</p>
              <h2 id="contact-commitment-title">
                Estamos contigo antes, durante y después de tu compra
              </h2>
              <p>
                Consulta sobre instalación, configuración y activación de equipos y licencias
                adquiridos. La disponibilidad de instalación y mantenimiento se coordina en la
                región Puno.
              </p>
            </div>
            <ul>
              <li>
                <HeadsetIcon size={20} />
                <strong>Soporte técnico</strong>Consulta las condiciones de atención
              </li>
              <li>
                <CheckIcon size={20} />
                <strong>Garantía del producto</strong>Consulta las condiciones aplicables
              </li>
              <li>
                <TruckIcon size={20} />
                <strong>Seguimiento del pedido</strong>Consulta su estado desde tu cuenta
              </li>
            </ul>
          </section>
        </ContentDisclosure>
      </div>
    </div>
  );
}
