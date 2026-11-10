import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  return (
    <AuthLayout
      eyebrow="Recupera tu acceso"
      title="Recupera tu acceso"
      text="La recuperación de acceso se coordina con el equipo de soporte de SYSCON."
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
        { icon: <LockIcon size={16} />, text: 'No compartas tu contraseña con otras personas.' },
      ]}
      footnote="La recuperación se coordina con el equipo de soporte."
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
        Esta opción prepara una consulta al equipo de soporte. No envía un enlace automático para
        cambiar tu contraseña. Escríbenos desde el correo de tu cuenta para coordinar la
        recuperación.
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
        ¿Recordaste tu contraseña?{' '}
        <Link to="/ingresar" state={location.state}>
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
