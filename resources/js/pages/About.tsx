import { ContentDisclosure } from '../components/shared/ContentDisclosure';
import { Link } from 'react-router-dom';
import { useAccountPath } from '../hooks/useAccountPath';
import team from '../../images/about/team.jpg';
import homeIcon from '../../images/catalog/home.svg';
import {
  ArrowRightIcon,
  BoxIcon,
  BuildingIcon,
  CheckIcon,
  GridIcon,
  HeadsetIcon,
  HelpIcon,
  ListCheckIcon,
  LockIcon,
  MailIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldIcon,
  StoreIcon,
  TagIcon,
  TruckIcon,
} from '../components/icons';
import { groupProducts } from '../lib/catalog';
import { api } from '../services/api';
import { useData } from '../ui';
import '../../css/about.css';

const count = new Intl.NumberFormat('es-PE');

const businessLines = [
  {
    title: 'Seguridad electrónica',
    text: 'Equipos para videovigilancia y seguridad de hogares, negocios e instituciones.',
  },
  {
    title: 'Redes y conectividad',
    text: 'Productos para conectar equipos y desarrollar infraestructura de red.',
  },
  {
    title: 'Cómputo y licencias',
    text: 'Equipos, componentes y software para el trabajo y las necesidades de cada cliente.',
  },
  {
    title: 'Instalación y mantenimiento',
    text: 'Asesoría y servicios técnicos coordinados con el equipo de SYSCON en Juliaca y Puno.',
  },
];

const values = [
  {
    icon: <ShieldIcon size={20} />,
    title: 'Confianza',
    text: 'Construimos relaciones a largo plazo mediante una comunicación transparente y cumplimiento estricto de cada entrega pactada.',
  },
  {
    icon: <CheckIcon size={20} />,
    title: 'Calidad técnica',
    text: 'Orientamos la selección de equipos y coordinamos instalación y mantenimiento en la región Puno.',
  },
  {
    icon: <ListCheckIcon size={20} />,
    title: 'Compromiso',
    text: 'Atendemos a instituciones, microempresas y personas con información clara sobre cada compra.',
  },
  {
    icon: <GridIcon size={20} />,
    title: 'Innovación',
    text: 'Mejoramos el canal digital y la gestión de productos, compras y pedidos.',
  },
  {
    icon: <SearchIcon size={20} />,
    title: 'Transparencia',
    text: 'Antes de confirmar, revisa el precio, la entrega y las condiciones del producto y del comprobante.',
  },
  {
    icon: <HeadsetIcon size={20} />,
    title: 'Atención y soporte',
    text: 'Consulta sobre productos, instalación y mantenimiento disponibles en Juliaca y la región Puno.',
  },
];

const reasons = [
  {
    icon: <ShieldIcon size={18} />,
    title: 'Información y asesoría por producto',
    text: 'Consulta las condiciones y el respaldo de cada producto.',
  },
  {
    icon: <ReceiptIcon size={18} />,
    title: 'Boleta o factura',
    text: 'Indica el tipo de comprobante y registra sus datos durante el pedido.',
  },
  {
    icon: <TruckIcon size={18} />,
    title: 'Opciones de entrega',
    text: 'Consulta las modalidades habilitadas en el checkout y sigue tu pedido desde tu cuenta.',
  },
  {
    icon: <TagIcon size={18} />,
    title: 'Cotizaciones para empresas',
    text: 'Consulta las condiciones para proyectos, licitaciones y compras por volumen.',
  },
  {
    icon: <HelpIcon size={18} />,
    title: 'Servicios técnicos',
    text: 'Consulta la disponibilidad de instalación y mantenimiento en Juliaca y la región Puno.',
  },
  {
    icon: <LockIcon size={18} />,
    title: 'Pago Verificado',
    text: 'Consulta el estado de pago de tus pedidos desde tu cuenta.',
  },
];

const steps = [
  {
    title: 'Selección y Validación',
    text: 'Revisa los detalles del catálogo o solicita orientación sobre los requerimientos de tu proyecto.',
    tag: 'Asesoría previa',
  },
  {
    title: 'Confirmación de condiciones',
    text: 'Consulta precio, disponibilidad, entrega y condiciones antes de confirmar la compra.',
    tag: 'Antes de confirmar',
  },
  {
    title: 'Pago y comprobante',
    text: 'Elige un medio de pago habilitado y solicita boleta o factura durante el pedido.',
    tag: 'Estado en tu cuenta',
  },
  {
    title: 'Acompañamiento Postventa',
    text: 'Consulta las opciones de entrega habilitadas para tu pedido. Instalación y soporte se coordinan en la región Puno.',
    tag: 'Cobertura según servicio',
  },
];

/** Figma "Client / Nosotros". Figures come from the live catalog instead of fixed marketing numbers. */
export function About() {
  const accountPath = useAccountPath();
  const { data } = useData(api.products);
  const products = data ?? [];
  const brands = groupProducts(products, 'brand');
  const stats = [
    {
      icon: <BuildingIcon size={22} />,
      tag: 'Catálogo',
      value: count.format(products.length),
      label: 'Productos publicados en catálogo',
    },
    {
      icon: <BoxIcon size={22} />,
      tag: 'Asesoría',
      value: 'Consulta',
      label: 'Condiciones y respaldo por producto',
    },
    {
      icon: <GridIcon size={22} />,
      tag: 'Líneas',
      value: count.format(groupProducts(products, 'category').length),
      label: 'Categorías de hardware y software',
    },
    {
      icon: <ShieldIcon size={22} />,
      tag: 'Fabricantes',
      value: count.format(brands.length),
      label: 'Marcas tecnológicas disponibles',
    },
  ];

  return (
    <div className="about-page">
      <div className="about-crumb container">
        <Link to={accountPath('/')}>
          <img src={homeIcon} alt="" /> {accountPath('/') === '/cuenta' ? 'Mi cuenta' : 'Inicio'}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Nosotros</span>
      </div>

      <section className="about-hero container" aria-labelledby="about-title">
        <div>
          <span className="about-pill">
            <ShieldIcon size={13} /> Tecnología y seguridad desde Juliaca
          </span>
          <h1 id="about-title">Conoce quiénes somos</h1>
          <p>
            Somos Grupo Syscon S.A.C., una empresa de Juliaca que atiende a instituciones,
            microempresas y personas. Consulta las opciones de entrega de tu pedido y los servicios
            técnicos que se coordinan en la región Puno.
          </p>
          <div className="about-hero-actions">
            <a href="#historia" className="is-primary">
              Conocer nuestra actividad ↓
            </a>
            <Link to={accountPath('/contacto')}>
              <HeadsetIcon size={15} /> Contactar a un Asesor
            </Link>
          </div>
          <ul className="about-hero-flags">
            <li>
              <i className="is-green" /> Boleta o factura según tu compra
            </li>
            <li>
              <i className="is-cyan" /> Servicios en Juliaca y Puno
            </li>
          </ul>
        </div>
        <figure>
          <img src={team} alt="Imagen referencial de un equipo de trabajo tecnológico" />
          <figcaption>
            <i>
              <ShieldIcon size={20} />
            </i>
            <span>
              <strong>Grupo Syscon S.A.C. · Juliaca</strong>
              <code>Imagen referencial</code>
            </span>
          </figcaption>
        </figure>
      </section>

      <ContentDisclosure title="Nuestra empresa y marcas">
        <section className="about-band is-soft">
          <div className="container about-identity">
            <div className="about-brands">
              <p className="about-eyebrow">MARCAS QUE COMERCIALIZAMOS</p>
              <ul>
                {brands.slice(0, 3).map((brand) => (
                  <li key={brand.name}>
                    <ShieldIcon size={18} />
                    <span>
                      <strong>{brand.name}</strong>
                      {brand.count} {brand.count === 1 ? 'producto' : 'productos'} en catálogo
                    </span>
                  </li>
                ))}
              </ul>
              <div className="about-brands-box">
                <span>
                  <small>Condiciones por producto</small>
                  Consulta disponibilidad y garantía
                </span>
                <BoxIcon size={24} />
              </div>
            </div>
            <div className="about-identity-copy">
              <p className="about-eyebrow">NUESTRA IDENTIDAD</p>
              <h2>Tecnología para personas y empresas</h2>
              <p>
                Somos <strong>Grupo Syscon S.A.C.</strong>, una empresa de Juliaca, Puno, dedicada a
                la venta de equipos de cómputo, redes, seguridad electrónica y licencias de
                software.
              </p>
              <p>
                Atendemos a instituciones, microempresas y personas. Coordinamos instalación y
                mantenimiento en Juliaca y la región Puno. Para otras ubicaciones, consulta al
                equipo antes de confirmar la compra.
              </p>
              <p>
                Consulta disponibilidad, costo de entrega y condiciones del producto antes de
                confirmar el pedido.
              </p>
              <ul>
                <li>
                  <ReceiptIcon size={18} /> Comprobantes de compra
                </li>
                <li>
                  <TruckIcon size={18} /> Entrega coordinada
                </li>
              </ul>
            </div>
          </div>
        </section>
      </ContentDisclosure>

      <section className="about-band">
        <ul className="container about-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              <span className="about-stats-top">
                {stat.icon}
                <code>{stat.tag}</code>
              </span>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <ContentDisclosure title="Conoce a SYSCON">
        <section id="historia" className="about-band is-soft">
          <div className="container">
            <div className="about-center">
              <p className="about-eyebrow">NUESTRA ACTIVIDAD</p>
              <h2>Tecnología y atención en Juliaca</h2>
              <p>
                SYSCON combina la venta de tecnología con asesoría, instalación y mantenimiento para
                atender a sus clientes en Juliaca y la región Puno.
              </p>
            </div>
            <ul className="about-business-lines">
              {businessLines.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ContentDisclosure>

      <ContentDisclosure title="Misión y visión">
        <section className="about-band">
          <div className="container about-purpose">
            <article>
              <i>
                <SearchIcon size={22} />
              </i>
              <p className="about-eyebrow is-mono">PROPÓSITO FUNDAMENTAL</p>
              <h2>Nuestra Misión</h2>
              <p>
                Facilitar el acceso a tecnología y soluciones de seguridad a instituciones,
                microempresas y personas, con información clara, cotizaciones oportunas y asistencia
                técnica en la región.
              </p>
              <span>
                <CheckIcon size={14} /> Información y cotizaciones claras
              </span>
            </article>
            <article>
              <i>
                <StoreIcon size={22} />
              </i>
              <p className="about-eyebrow is-mono">DIRECCIÓN DE FUTURO</p>
              <h2>Nuestra Visión</h2>
              <p>
                Ser reconocida en el sur del Perú como una empresa de tecnología y seguridad
                electrónica con procesos integrados y un canal digital confiable.
              </p>
              <span>
                <ArrowRightIcon size={14} /> Servicio en el sur del Perú
              </span>
            </article>
          </div>
        </section>
      </ContentDisclosure>

      <ContentDisclosure title="Nuestros valores">
        <section className="about-band is-soft">
          <div className="container">
            <div className="about-center">
              <p className="about-eyebrow">CULTURA DE EXCELENCIA</p>
              <h2>Nuestros Valores Fundamentales</h2>
              <p>
                Principios que guían cada consulta técnica, cada venta y cada interacción con
                nuestros clientes.
              </p>
            </div>
            <ul className="about-values">
              {values.map((value) => (
                <li key={value.title}>
                  <i>{value.icon}</i>
                  <strong>{value.title}</strong>
                  {value.text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ContentDisclosure>

      <ContentDisclosure title="Por qué elegir SYSCON">
        <section className="about-band">
          <div className="container">
            <div className="about-center">
              <p className="about-eyebrow">QUÉ OFRECE SYSCON</p>
              <h2>¿Por qué elegir a Grupo SYSCON?</h2>
              <p>
                Compara productos y consulta las condiciones de compra y los servicios disponibles.
              </p>
            </div>
            <ul className="about-reasons">
              {reasons.map((reason) => (
                <li key={reason.title}>
                  <i>{reason.icon}</i>
                  <span>
                    <strong>{reason.title}</strong>
                    {reason.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ContentDisclosure>

      <ContentDisclosure title="Cómo comprar">
        <section className="about-band is-soft">
          <div className="container">
            <div className="about-center">
              <p className="about-eyebrow">PASOS DE COMPRA</p>
              <h2>Cómo trabajamos: Tu compra paso a paso</h2>
              <p>Revisa disponibilidad, pago y entrega antes de confirmar el pedido.</p>
            </div>
            <ol className="about-steps">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <code>0{index + 1}</code>
                  <strong>{step.title}</strong>
                  <span>{step.text}</span>
                  <em>
                    <CheckIcon size={13} /> {step.tag}
                  </em>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </ContentDisclosure>

      <ContentDisclosure title="Confianza y condiciones">
        <section className="about-trust">
          <div className="container">
            <div>
              <p className="about-eyebrow is-light">INFORMACIÓN DE COMPRA</p>
              <h2>Revisa las condiciones antes de comprar</h2>
              <p>
                Revisa las condiciones del producto y las opciones de entrega y pago antes de
                confirmar tu pedido.
              </p>
            </div>
            <ul>
              <li>
                <TruckIcon size={20} />
                <strong>Envíos</strong>
                <code>Según disponibilidad</code>
              </li>
              <li>
                <CheckIcon size={20} />
                <strong>Atención local</strong>
                <code>Juliaca y Puno</code>
              </li>
              <li>
                <ReceiptIcon size={20} />
                <strong>Comprobante</strong>
                <code>Boleta o factura</code>
              </li>
              <li>
                <ShieldIcon size={20} />
                <strong>Condiciones</strong>
                <code>Por producto</code>
              </li>
            </ul>
          </div>
        </section>
      </ContentDisclosure>

      <section className="about-band">
        <div className="container">
          <div className="about-cta">
            <div>
              <p className="about-eyebrow">IMPULSO TECNOLÓGICO</p>
              <h2>¿Listo para impulsar tu infraestructura tecnológica?</h2>
              <p>
                Explora nuestro catálogo completo de productos o coordina una cotización corporativa
                personalizada con un asesor asignado.
              </p>
            </div>
            <div className="about-cta-actions">
              <Link to="/catalogo" className="is-primary">
                <StoreIcon size={16} /> Explorar Catálogo de Productos
              </Link>
              <Link to={accountPath('/contacto')}>
                <MailIcon size={16} /> Contactar a un Asesor Comercial
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
