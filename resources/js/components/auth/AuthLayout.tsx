import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../layout/Header';
import { PageMain } from '../layout/PageMain';
import { ShieldIcon } from '../icons';
import '../../../css/auth.css';
import { ShoppingBackLink } from '../shared/ShoppingBackLink';

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
  const location = useLocation();
  const state = location.state as { from?: unknown; cartPath?: unknown } | null;
  const buying = state?.from === '/checkout';
  const backTo = buying
    ? state?.cartPath === '/cuenta/carrito'
      ? '/cuenta/carrito'
      : '/carrito'
    : '/';
  return (
    <div className="auth-shell">
      <Header />
      <PageMain className="auth-main" resetKey={title}>
        <div className="container">
          <div className="shopping-navigation">
            <ShoppingBackLink to={backTo}>
              {buying ? 'Volver al carrito' : 'Volver a la tienda'}
            </ShoppingBackLink>
          </div>
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
            <section className="auth-form">
              {buying && (
                <p className="notice" role="status">
                  Tu carrito está guardado. Al ingresar continuarás con tu compra.
                </p>
              )}
              {children}
            </section>
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
            <Link to="/contacto">Ayuda y contacto</Link>
            <Link to="/nosotros">Nosotros</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
