import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import bookIcon from '../../images/home/libro-reclamaciones.svg';
import { company } from '../components/layout/Header';
import { PageHero, PageSection } from '../components/layout/PageHero';
import {
  complaintError,
  complaintPayload,
  complaintTypeHelp,
  complaintTypeLabels,
  emptyComplaint,
  formatDay,
} from '../lib/complaints';
import { formatDateTime } from '../lib/orders';
import { api } from '../services/api';
import type { Complaint, ComplaintInput } from '../types';
import '../../css/storefront.css';

function Field({
  label,
  optional,
  wide,
  children,
}: {
  label: string;
  optional?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`complaint-field${wide ? ' is-wide' : ''}`}>
      <span>
        {label} {optional ? <small>(opcional)</small> : <em aria-hidden="true">*</em>}
      </span>
      {children}
    </label>
  );
}

/** Proof of the registered sheet, to keep or print. */
function ComplaintProof({ complaint, onNew }: { complaint: Complaint; onNew: () => void }) {
  return (
    <section className="complaint-proof" aria-labelledby="complaint-proof-title">
      <p className="complaint-proof-ok" role="status">
        Registramos tu {complaintTypeLabels[complaint.type].toLowerCase()}. Te enviamos una copia a{' '}
        <strong>{complaint.email}</strong>.
      </p>
      <h2 id="complaint-proof-title">Hoja de reclamación N° {complaint.code}</h2>
      <dl>
        <div>
          <dt>Fecha de registro</dt>
          <dd>{formatDateTime(complaint.createdAt)}</dd>
        </div>
        <div>
          <dt>Responderemos a más tardar el</dt>
          <dd>{formatDay(complaint.dueOn)}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{complaintTypeLabels[complaint.type]}</dd>
        </div>
        <div>
          <dt>Consumidor</dt>
          <dd>
            {complaint.consumerName} · {complaint.documentType} {complaint.documentNumber}
          </dd>
        </div>
        <div>
          <dt>Producto o servicio</dt>
          <dd>
            {complaint.itemDescription}
            {complaint.amount && ` · S/ ${complaint.amount}`}
          </dd>
        </div>
        <div className="is-wide">
          <dt>Detalle</dt>
          <dd>{complaint.detail}</dd>
        </div>
        <div className="is-wide">
          <dt>Pedido del consumidor</dt>
          <dd>{complaint.consumerRequest}</dd>
        </div>
      </dl>
      <div className="complaint-actions">
        <button type="button" className="button button-primary" onClick={() => window.print()}>
          Imprimir constancia
        </button>
        <button type="button" className="button button-secondary" onClick={onNew}>
          Registrar otra hoja
        </button>
      </div>
    </section>
  );
}

/** Virtual Libro de Reclamaciones: the consumer fills in the sheet and gets its number. */
/** What the book is for and which help channels come first (shown before the form). */
function ComplaintIntro({ onStart }: { onStart: () => void }) {
  return (
    <section className="complaint-intro" aria-labelledby="complaint-intro-title">
      <h2 id="complaint-intro-title" className="visually-hidden">
        Antes de registrar una queja o un reclamo
      </h2>
      <p>
        En nuestra página de <Link to="/contacto">Ayuda y contacto</Link>,{' '}
        <strong>
          te orientamos y puedes comunicarte con nosotros por teléfono, WhatsApp o correo
        </strong>{' '}
        para resolver cualquier dificultad con tus compras, pedidos, comprobantes o con la
        instalación de tus equipos.
      </p>
      <ul className="complaint-channels">
        <li>
          <span>Teléfono</span>
          <a href={company.phoneHref}>{company.phone}</a>
        </li>
        <li>
          <span>WhatsApp</span>
          <a href={company.whatsappHref} target="_blank" rel="noopener noreferrer">
            {company.whatsappLabel}
          </a>
        </li>
        <li>
          <span>Correo</span>
          <a href={`mailto:${company.email}`}>{company.email}</a>
        </li>
      </ul>
      <p>
        Sin embargo, si no estás satisfecho con la experiencia que te brindamos,{' '}
        <strong>también cuentas con un Libro de Reclamaciones</strong> para registrar una queja o un
        reclamo.
      </p>

      <div className="complaint-kinds">
        <div>
          <h3>¿Qué es un reclamo?</h3>
          <p>
            Es tu disconformidad con un <strong>producto o servicio que compraste</strong> en
            SYSCON: por ejemplo, un equipo que llegó con fallas, una licencia que no se activó, una
            instalación, la entrega, un cobro o tu comprobante, en tienda o en nuestra web.
          </p>
        </div>
        <div>
          <h3>¿Qué es una queja?</h3>
          <p>
            Es tu disconformidad con la <strong>atención que recibiste</strong> y que no tiene que
            ver con lo que compraste: el trato en tienda, por teléfono, WhatsApp o correo, o los
            tiempos de respuesta.
          </p>
        </div>
      </div>

      <h3>¿Qué sucede después de que registro una queja o un reclamo?</h3>
      <p>
        Al terminar verás el código de tu hoja y te enviaremos una copia a tu correo para que te
        quede como constancia. Además, en un plazo máximo de <strong>15 días hábiles</strong>{' '}
        recibirás nuestra respuesta en ese mismo correo.
      </p>

      <div className="complaints-actions">
        <button type="button" className="button button-primary" onClick={onStart}>
          Ingresar una queja o un reclamo
        </button>
        <Link className="button button-secondary" to="/contacto">
          Prefiero pedir ayuda primero
        </Link>
      </div>
      <p className="complaint-legal">
        La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es
        requisito previo para interponer una denuncia ante el INDECOPI.
      </p>
    </section>
  );
}

export function Complaints() {
  const [sheet, setSheet] = useState<ComplaintInput>(emptyComplaint);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Complaint | null>(null);
  // First an explanation of the book and of our help channels; the form opens on request.
  const [started, setStarted] = useState(false);
  const open = (value: boolean) => {
    setStarted(value);
    window.scrollTo({ top: 0 });
  };
  const set =
    <K extends keyof ComplaintInput>(key: K) =>
    (value: ComplaintInput[K]) =>
      setSheet((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = complaintError(sheet);
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      setDone(await api.submitComplaint(complaintPayload(sheet)));
      setSheet(emptyComplaint());
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Atención al cliente"
        title="Libro de Reclamaciones"
        text="Conforme al Código de Protección y Defensa del Consumidor, puedes registrar aquí un reclamo o una queja."
      />
      <PageSection>
        <div className="complaints-page">
          <img src={bookIcon} alt="" width={120} height={72} />
          <div>
            {done ? (
              <ComplaintProof complaint={done} onNew={() => setDone(null)} />
            ) : !started ? (
              <ComplaintIntro onStart={() => open(true)} />
            ) : (
              <form className="complaint-form" onSubmit={submit} noValidate>
                <button
                  type="button"
                  className="link-button complaint-back"
                  onClick={() => open(false)}
                >
                  ← Volver a la información del Libro de Reclamaciones
                </button>
                <p className="complaint-provider">
                  <strong>Grupo SYSCON Tecnología Informática</strong> · {company.city}
                </p>

                <fieldset>
                  <legend>1. Identificación del consumidor</legend>
                  <div className="complaint-grid">
                    <Field label="Nombre completo" wide>
                      <input
                        value={sheet.consumerName}
                        onChange={(e) => set('consumerName')(e.target.value)}
                        autoComplete="name"
                        maxLength={255}
                      />
                    </Field>
                    <Field label="Tipo de documento">
                      <select
                        value={sheet.documentType}
                        onChange={(e) =>
                          set('documentType')(e.target.value as ComplaintInput['documentType'])
                        }
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">Carné de extranjería</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="RUC">RUC</option>
                      </select>
                    </Field>
                    <Field label="Número de documento">
                      <input
                        value={sheet.documentNumber}
                        onChange={(e) => set('documentNumber')(e.target.value)}
                        inputMode={
                          sheet.documentType === 'DNI' || sheet.documentType === 'RUC'
                            ? 'numeric'
                            : 'text'
                        }
                        maxLength={20}
                      />
                    </Field>
                    <Field label="Domicilio" wide>
                      <input
                        value={sheet.address}
                        onChange={(e) => set('address')(e.target.value)}
                        autoComplete="street-address"
                        maxLength={500}
                      />
                    </Field>
                    <Field label="Teléfono">
                      <input
                        type="tel"
                        value={sheet.phone}
                        onChange={(e) => set('phone')(e.target.value)}
                        autoComplete="tel"
                        maxLength={30}
                      />
                    </Field>
                    <Field label="Correo electrónico">
                      <input
                        type="email"
                        value={sheet.email}
                        onChange={(e) => set('email')(e.target.value)}
                        autoComplete="email"
                        maxLength={255}
                      />
                    </Field>
                    <Field label="Padre, madre o apoderado (si eres menor de edad)" optional wide>
                      <input
                        value={sheet.guardianName}
                        onChange={(e) => set('guardianName')(e.target.value)}
                        maxLength={255}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>2. Identificación del bien contratado</legend>
                  <div className="complaint-choice" role="radiogroup" aria-label="Tipo de bien">
                    {(['PRODUCTO', 'SERVICIO'] as const).map((value) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="itemType"
                          checked={sheet.itemType === value}
                          onChange={() => set('itemType')(value)}
                        />
                        {value === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                      </label>
                    ))}
                  </div>
                  <div className="complaint-grid">
                    <Field label="Descripción del producto o servicio" wide>
                      <input
                        value={sheet.itemDescription}
                        onChange={(e) => set('itemDescription')(e.target.value)}
                        maxLength={500}
                      />
                    </Field>
                    <Field label="Monto reclamado (S/)" optional>
                      <input
                        value={sheet.amount}
                        onChange={(e) => set('amount')(e.target.value)}
                        inputMode="decimal"
                        placeholder="0.00"
                      />
                    </Field>
                    <Field label="N° de pedido o comprobante" optional>
                      <input
                        value={sheet.orderReference}
                        onChange={(e) => set('orderReference')(e.target.value)}
                        maxLength={100}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>3. Detalle de la reclamación</legend>
                  <div className="complaint-choice is-types" role="radiogroup" aria-label="Tipo">
                    {(['RECLAMO', 'QUEJA'] as const).map((value) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="type"
                          checked={sheet.type === value}
                          onChange={() => set('type')(value)}
                        />
                        <span>
                          <strong>{complaintTypeLabels[value]}</strong>
                          <small>{complaintTypeHelp[value]}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="complaint-grid">
                    <Field label="Detalle" wide>
                      <textarea
                        rows={5}
                        value={sheet.detail}
                        onChange={(e) => set('detail')(e.target.value)}
                        maxLength={5000}
                        placeholder="Cuéntanos qué pasó, cuándo y con qué producto o atención."
                      />
                    </Field>
                    <Field label="Pedido (qué solución esperas)" wide>
                      <textarea
                        rows={3}
                        value={sheet.consumerRequest}
                        onChange={(e) => set('consumerRequest')(e.target.value)}
                        maxLength={3000}
                        placeholder="Por ejemplo: cambio del producto, devolución del dinero o reparación."
                      />
                    </Field>
                  </div>
                </fieldset>

                <label className="complaint-accept">
                  <input
                    type="checkbox"
                    checked={sheet.accepted}
                    onChange={(e) => set('accepted')(e.target.checked)}
                  />
                  Declaro que los datos son correctos. Acepto que se usen solo para atender esta
                  hoja, según la <Link to="/privacidad">política de privacidad</Link>.
                </label>
                <p className="complaint-legal">
                  La formulación del reclamo no impide acudir a otras vías de solución de
                  controversias ni es requisito previo para interponer una denuncia ante el
                  INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a
                  quince (15) días hábiles.
                </p>
                {error && (
                  <p className="notice error" role="alert">
                    {error}
                  </p>
                )}
                <div className="complaint-actions">
                  <button type="submit" className="button button-primary" disabled={busy}>
                    {busy ? 'Registrando...' : 'Registrar hoja de reclamación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </PageSection>
    </>
  );
}
