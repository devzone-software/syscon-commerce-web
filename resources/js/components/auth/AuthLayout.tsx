import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../layout/Header';
import { PageMain } from '../layout/PageMain';
import { ArrowLeftIcon, ShieldIcon } from '../icons';
import { company } from '../layout/Header';
import '../../../css/auth.css';

export type AuthFeature = { icon: ReactNode; text: ReactNode };

/**
 * Authentication pages share the storefront header and footer around their form card.
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
      <Header />
      <PageMain className="auth-main" resetKey={title}>
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
      </PageMain>
      <footer className="auth-footer">
        <div className="container auth-footer-row">
          <span>
            © {new Date().getFullYear()} Grupo SYSCON S.A.C. Todos los derechos reservados.
          </span>
          <nav aria-label="Enlaces">
            <Link to="/contacto">Centro de ayuda</Link>
            <Link to="/nosotros">Nosotros</Link>
            <Link to="/contacto">Contacto</Link>
            <Link to="/" className="auth-footer-back">
              <ArrowLeftIcon size={14} /> Volver a la tienda
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
