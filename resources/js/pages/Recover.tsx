import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { company } from '../components/layout/Header';
import {
  HeadsetIcon,
  KeyIcon,
  ListCheckIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
} from '../components/icons';

const recoveryMail = `mailto:${company.email}?subject=${encodeURIComponent(
  'Recuperar acceso a mi cuenta SYSCON',
)}`;

/**
 * Figma "Client / Recuperar contraseña". The backend has no password reset endpoint yet, so the
 * page routes the request to support instead of pretending to send an email.
 */
export function Recover() {
  return (
    <AuthLayout
      eyebrow="Recupera tu acceso"
      title="Recupera tu acceso a Grupo SYSCON"
      text="Protegemos tu cuenta, tus pedidos y tus datos mientras restablecemos tu contraseña."
      features={[
        {
          icon: <ShieldIcon size={16} />,
          text: 'Verificación de identidad por el equipo de soporte.',
        },
        {
          icon: <ListCheckIcon size={16} />,
          text: 'Tus pedidos e historial se conservan intactos.',
        },
        { icon: <HeadsetIcon size={16} />, text: 'Soporte técnico preventa y postventa.' },
        { icon: <LockIcon size={16} />, text: 'Protección de datos personales.' },
      ]}
      footnote="Datos tratados conforme a la Ley N° 29733"
      below={
        <ul className="auth-assurance">
          <li>
            <ShieldIcon size={16} />
            <span>
              <strong>Garantía SYSCON S.A.C.</strong>Partner tecnológico corporativo
            </span>
          </li>
          <li>
            <LockIcon size={16} />
            <span>
              <strong>Acceso protegido</strong>Tu contraseña nunca se comparte
            </span>
          </li>
          <li>
            <HeadsetIcon size={16} />
            <span>
              <strong>Atención corporativa</strong>Lun - Sáb: 8:30 AM - 6:30 PM
            </span>
          </li>
        </ul>
      }
    >
      <div className="auth-step">
        <span className="auth-step-icon">
          <KeyIcon size={18} />
        </span>
        <div>
          <p className="auth-step-label">PASO 01 / VERIFICACIÓN</p>
          <h2>¿Olvidaste tu contraseña?</h2>
        </div>
      </div>
      <p className="auth-lead">
        No te preocupes. Escríbenos desde el correo de tu cuenta o llámanos y nuestro equipo de
        soporte verificará tu identidad para restablecer tu contraseña.
      </p>
      <div className="auth-fields">
        <a className="auth-submit" href={recoveryMail}>
          <MailIcon size={16} /> ESCRIBIR A SOPORTE
        </a>
        <a className="auth-secondary" href={company.phoneHref}>
          <PhoneIcon size={16} /> Llamar al {company.phone}
        </a>
      </div>
      <p className="auth-switch">
        ¿Recordaste tu contraseña? <Link to="/ingresar">Iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
