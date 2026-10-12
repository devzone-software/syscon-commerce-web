import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../images/header/logo-grupo-syscon.jpg';
import { company } from '../layout/Header';
import { ArrowLeftIcon, PhoneIcon, ShieldIcon } from '../icons';

export type AuthFeature = { icon: ReactNode; text: ReactNode };

/**
 * Sign in, sign up and password recovery from Figma "02 — Client Web": a slim header, a
 * two-column card (navy panel with the benefits + form) and the legal footer.
 */
export function AuthLayout({
  eyebrow,
  title,
  text,
  features,
  footnote,
  children,
  below,
}: {
  eyebrow: string;
  title: string;
  text: string;
  features: AuthFeature[];
  footnote: string;
  children: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div className="container auth-header-row">
          <Link to="/" aria-label="Grupo SYSCON, ir al inicio">
            <img src={logo} alt="" width={140} height={39} />
          </Link>
          <nav aria-label="Ayuda">
            <Link to="/" className="auth-back">
              <ArrowLeftIcon size={16} /> Volver a la tienda
            </Link>
            <a href={company.phoneHref} className="auth-support">
              <PhoneIcon size={14} /> Soporte: <strong>{company.phone}</strong>
            </a>
          </nav>
        </div>
      </header>
      <main className="auth-main">
        <div className="container">
          <div className="auth-card">
            <aside className="auth-panel">
              <span className="auth-panel-eyebrow">
                <i aria-hidden="true" /> {eyebrow}
              </span>
              <h1>{title}</h1>
              <p>{text}</p>
              <ul>
                {features.map((feature, index) => (
                  <li key={index}>
                    <span className="auth-panel-icon">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <p className="auth-panel-foot">
                <ShieldIcon size={14} /> {footnote}
              </p>
            </aside>
            <section className="auth-form">{children}</section>
          </div>
          {below}
        </div>
      </main>
      <footer className="auth-footer">
        <div className="container auth-footer-row">
          <span>
            © {new Date().getFullYear()} Grupo SYSCON S.A.C. Todos los derechos reservados.
          </span>
          <nav aria-label="Enlaces">
            <Link to="/contacto">Centro de ayuda</Link>
            <Link to="/nosotros">Nosotros</Link>
            <Link to="/contacto">Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
