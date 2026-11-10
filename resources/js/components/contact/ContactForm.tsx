import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, MailIcon } from '../icons';
import { company } from '../layout/Header';
import { isEmail } from '../../lib/validation';

const subjects = [
  'Ventas y cotizaciones',
  'Soporte técnico',
  'Seguimiento de pedido',
  'Facturación y cobranzas',
  'Otro',
];

/** Corporate quote message with the details the sales team needs for that kind of project. */
function projectMessage(project: string) {
  const fields = /fibra|internet/i.test(project)
    ? ['Dirección o distrito:', 'Es para hogar o empresa:', 'Velocidad de interés:']
    : /videovigilancia|camara|cámara/i.test(project)
      ? ['Rubro de la empresa:', 'Cantidad aproximada de cámaras:', 'Locales o vehículos a cubrir:']
      : ['Empresa y RUC:', 'Productos y cantidades:', 'Fecha en que lo necesitas:'];
  return [`Quisiera una cotización de ${project.slice(0, 200)}.`, ...fields].join('\n');
}

/** Prepares a message in the visitor's email app; it does not send a request to the API. */
export function ContactForm() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    order: params.get('pedido')?.slice(0, 100) ?? '',
    subject:
      params.has('producto') || params.has('proyecto')
        ? subjects[0]
        : params.has('pedido')
          ? subjects[2]
          : '',
    message: params.has('producto')
      ? `Quisiera consultar sobre ${params.get('producto')?.slice(0, 200)} (SKU: ${params.get('sku')?.slice(0, 100) ?? 'por consultar'}).`
      : params.has('proyecto')
        ? projectMessage(params.get('proyecto') ?? '')
        : params.has('pedido')
          ? 'Quisiera consultar sobre el estado de mi pedido.'
          : '',
  });
  const [error, setError] = useState('');

  // Links such as "Cotizar para mi empresa" open the page on the prefilled form.
  useEffect(() => {
    if (window.location.hash === '#formulario')
      document.getElementById('formulario')?.scrollIntoView({ block: 'start' });
  }, []);
  const set = (key: keyof typeof form) => (value: string) =>
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
    <section id="formulario" className="contact-form" aria-labelledby="contact-form-title">
      <p className="contact-eyebrow">FORMULARIO DE CONTACTO</p>
      <h2 id="contact-form-title">Prepara tu consulta por correo</h2>
      <p className="contact-form-lead">
        Completa tu consulta. Se abrirá tu aplicación de correo con el mensaje preparado para que
        puedas revisarlo y enviarlo a SYSCON.
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
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="contact-submit">
          <button type="submit">
            Preparar correo <ArrowRightIcon size={16} />
          </button>
          <span>
            <MailIcon size={13} /> Se abrirá tu correo; revisa el mensaje y envíalo si estás de
            acuerdo.
          </span>
        </div>
      </form>
    </section>
  );
}
