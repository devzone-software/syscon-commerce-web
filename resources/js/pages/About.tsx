import { Link } from 'react-router-dom';
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

const count = new Intl.NumberFormat('es-PE');

const history = [
  {
    year: '2021',
    title: 'Fundación & Soporte',
    text: 'Inicio de operaciones en Lima enfocado en soporte corporativo y ensamblaje de estaciones de trabajo de alto rendimiento.',
  },
  {
    year: '2022',
    title: 'Alianzas de Canal',
    text: 'Alianzas de distribución con mayoristas autorizados y fabricantes líderes de hardware.',
  },
  {
    year: '2024',
    title: 'Catálogo Digital',
    text: 'Catálogo en línea con stock actualizado y atención comercial para empresas y profesionales.',
  },
  {
    year: '2025',
    title: 'Seguridad & Servidores',
    text: 'Expansión del portafolio hacia ciberseguridad, servidores en rack y soluciones de red para el sector corporativo.',
  },
  {
    year: '2026',
    title: 'Nueva Plataforma',
    text: 'Lanzamiento de la nueva plataforma de comercio electrónico de Grupo SYSCON.',
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
    title: 'Autenticidad',
    text: 'Comercializamos únicamente productos originales con respaldo y trazabilidad ante fabricantes de primer nivel.',
  },
  {
    icon: <ListCheckIcon size={20} />,
    title: 'Compromiso',
    text: 'Asumimos cada pedido, grande o pequeño, con la máxima responsabilidad, celeridad y diligencia operativa.',
  },
  {
    icon: <GridIcon size={20} />,
    title: 'Innovación',
    text: 'Actualizamos constantemente nuestras herramientas y catálogo con los últimos lanzamientos de hardware y software.',
  },
  {
    icon: <SearchIcon size={20} />,
    title: 'Transparencia',
    text: 'Precios con IGV incluido, condiciones de garantía claras por escrito y sin tarifas ocultas al facturar.',
  },
  {
    icon: <HeadsetIcon size={20} />,
    title: 'Soporte Técnico Real',
    text: 'Ingenieros informáticos dedicados a resolver dudas técnicas antes, durante y después de cada compra.',
  },
];

const reasons = [
  {
    icon: <ShieldIcon size={18} />,
    title: 'Productos 100% Confiables & Certificados',
    text: 'Productos originales con respaldo directo de cada fabricante.',
  },
  {
    icon: <ReceiptIcon size={18} />,
    title: 'Facturación Electrónica',
    text: 'Comprobantes autorizados por SUNAT con RUC 20 o Boleta para deducción de gastos.',
  },
  {
    icon: <TruckIcon size={18} />,
    title: 'Envíos a Todo el Perú',
    text: 'Despachos coordinados a nivel nacional con seguimiento de cada pedido.',
  },
  {
    icon: <TagIcon size={18} />,
    title: 'Precios Competitivos Mayoristas',
    text: 'Tarifas para proyectos B2B, licitaciones y compras por volumen.',
  },
  {
    icon: <HelpIcon size={18} />,
    title: 'Soporte Postventa Especializado',
    text: 'Atención telefónica y vía remota por ingenieros capacitados para resolver incidencias.',
  },
  {
    icon: <LockIcon size={18} />,
    title: 'Pago Verificado',
    text: 'Cada pago lo confirma nuestro equipo antes de preparar tu pedido.',
  },
];

const steps = [
  {
    title: 'Selección y Validación',
    text: 'Verificamos compatibilidad y requerimientos técnicos específicos para tu entorno informático antes de procesar.',
    tag: 'Asesoría previa',
  },
  {
    title: 'Cotización y Asesoría Clara',
    text: 'Te proporcionamos costos desglosados con IGV, tiempos de entrega y condiciones de soporte.',
    tag: 'Sin costos ocultos',
  },
  {
    title: 'Procesamiento Seguro',
    text: 'Verificamos tu pago y emitimos el comprobante electrónico correspondiente.',
    tag: 'SUNAT',
  },
  {
    title: 'Acompañamiento Postventa',
    text: 'Asistencia guiada en instalación, configuración o seguimiento de despacho hasta tu plena satisfacción.',
    tag: 'Garantía activa',
  },
];

/** Figma "Client / Nosotros". Figures come from the live catalog instead of fixed marketing numbers. */
export function About() {
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
      tag: 'Stock Real',
      value: count.format(products.reduce((sum, product) => sum + product.stock, 0)),
      label: 'Unidades disponibles en almacén',
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
        <Link to="/">
          <img src={homeIcon} alt="" /> Inicio
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Nosotros</span>
      </div>

      <section className="about-hero container" aria-labelledby="about-title">
        <div>
          <span className="about-pill">
            <ShieldIcon size={13} /> Compromiso y Solvencia Tecnológica en el Perú
          </span>
          <h1 id="about-title">Conoce quiénes somos</h1>
          <p>
            Trabajamos para ofrecer soluciones tecnológicas confiables, productos originales y una
            experiencia de compra segura para empresas y profesionales en todo el país.
          </p>
          <div className="about-hero-actions">
            <a href="#historia" className="is-primary">
              Conocer nuestra historia ↓
            </a>
            <Link to="/contacto">
              <HeadsetIcon size={15} /> Contactar a un Asesor B2B
            </Link>
          </div>
          <ul className="about-hero-flags">
            <li>
              <i className="is-green" /> Facturación RUC 20 SUNAT
            </li>
            <li>
              <i className="is-cyan" /> Atención Inmediata B2B
            </li>
          </ul>
        </div>
        <figure>
          <img src={team} alt="Equipo de Grupo SYSCON trabajando en oficina técnica" />
          <figcaption>
            <i>
              <ShieldIcon size={20} />
            </i>
            <span>
              <strong>Empresa peruana de tecnología</strong>
              <code>Soporte Técnico y Consultoría</code>
            </span>
          </figcaption>
        </figure>
      </section>

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
                <small>Garantía Incondicional</small>
                Trazabilidad Total
              </span>
              <BoxIcon size={24} />
            </div>
          </div>
          <div className="about-identity-copy">
            <p className="about-eyebrow">NUESTRA IDENTIDAD</p>
            <h2>Respaldando la continuidad operativa del Perú</h2>
            <p>
              Somos <strong>Grupo SYSCON</strong>, una empresa especializada en la distribución y
              comercialización de software original, servidores y equipamiento informático de alto
              rendimiento para personas, instituciones y empresas en todo el Perú.
            </p>
            <p>
              Nacimos con el propósito de erradicar la incertidumbre en la adquisición de
              tecnología, brindando a cada cliente asesoramiento técnico honesto, facturación
              electrónica autorizada por SUNAT y soporte postventa continuo con ingenieros
              especializados.
            </p>
            <p>
              Nuestro compromiso diario es ser el aliado estratégico de su infraestructura digital,
              asegurando continuidad operativa y el mejor retorno de inversión tecnológica.
            </p>
            <ul>
              <li>
                <ReceiptIcon size={18} /> Emisión RUC 20 / Boleta
              </li>
              <li>
                <TruckIcon size={18} /> Cobertura Nacional
              </li>
            </ul>
          </div>
        </div>
      </section>

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

      <section id="historia" className="about-band is-soft">
        <div className="container">
          <div className="about-center">
            <p className="about-eyebrow">EVOLUCIÓN ESTRATÉGICA</p>
            <h2>Nuestra Historia y Evolución</h2>
            <p>
              El camino que nos ha consolidado como un referente de confianza tecnológica en el
              mercado corporativo y retail peruano.
            </p>
          </div>
          <ol className="about-timeline">
            {history.map((item, index) => (
              <li key={item.year} className={index === history.length - 1 ? 'is-current' : ''}>
                <span>{item.year}</span>
                <strong>{item.title}</strong>
                {item.text}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="about-band">
        <div className="container about-purpose">
          <article>
            <i>
              <SearchIcon size={22} />
            </i>
            <p className="about-eyebrow is-mono">PROPÓSITO FUNDAMENTAL</p>
            <h2>Nuestra Misión</h2>
            <p>
              Brindar a empresas, profesionales y entidades soluciones de software, hardware y
              conectividad de máxima autenticidad, facilitando su competitividad con precios justos,
              entrega ágil y soporte técnico de clase mundial.
            </p>
            <span>
              <CheckIcon size={14} /> Compromiso de Eficiencia Operativa
            </span>
          </article>
          <article>
            <i>
              <StoreIcon size={22} />
            </i>
            <p className="about-eyebrow is-mono">DIRECCIÓN DE FUTURO</p>
            <h2>Nuestra Visión</h2>
            <p>
              Consolidarnos como la plataforma de tecnología más confiable y preferida del mercado
              peruano, reconocida por nuestra integridad comercial, excelencia en atención al
              cliente y rigurosidad técnica.
            </p>
            <span>
              <ArrowRightIcon size={14} /> Liderazgo Tecnológico 2026-2030
            </span>
          </article>
        </div>
      </section>

      <section className="about-band is-soft">
        <div className="container">
          <div className="about-center">
            <p className="about-eyebrow">CULTURA DE EXCELENCIA</p>
            <h2>Nuestros Valores Fundamentales</h2>
            <p>
              Principios que guían cada consulta técnica, cada venta y cada interacción con nuestros
              clientes.
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

      <section className="about-band">
        <div className="container">
          <div className="about-center">
            <p className="about-eyebrow">DIFERENCIALES COMPETITIVOS</p>
            <h2>¿Por qué elegir a Grupo SYSCON?</h2>
            <p>Brindamos certezas comerciales y técnicas en cada etapa de adquisición.</p>
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

      <section className="about-band is-soft">
        <div className="container">
          <div className="about-center">
            <p className="about-eyebrow">METODOLOGÍA CLARA</p>
            <h2>Cómo trabajamos: Tu compra paso a paso</h2>
            <p>
              Un flujo ágil diseñado para garantizar que recibas la solución exacta que tu
              infraestructura demanda.
            </p>
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

      <section className="about-trust">
        <div className="container">
          <div>
            <p className="about-eyebrow is-light">GARANTÍA CORPORATIVA SYSCON</p>
            <h2>Tu confianza es nuestra prioridad número uno</h2>
            <p>
              Operamos bajo normativas de seguridad, entrega certificada y cumplimiento tributario
              ante los organismos reguladores peruanos.
            </p>
          </div>
          <ul>
            <li>
              <LockIcon size={20} />
              <strong>Conexión</strong>
              <code>Segura</code>
            </li>
            <li>
              <CheckIcon size={20} />
              <strong>Fabricantes</strong>
              <code>Respaldo Directo</code>
            </li>
            <li>
              <BuildingIcon size={20} />
              <strong>SUNAT</strong>
              <code>Factura RUC 20</code>
            </li>
            <li>
              <ShieldIcon size={20} />
              <strong>Garantía</strong>
              <code>Escrita de Fábrica</code>
            </li>
          </ul>
        </div>
      </section>

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
              <Link to="/contacto">
                <MailIcon size={16} /> Contactar a un Asesor Comercial
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
