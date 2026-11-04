import { useLayoutEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from '../layout/Footer';
import { Header } from '../layout/Header';
import { ShieldIcon } from '../icons';
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
  const { pathname } = useLocation();

  // Reset before paint when opening an auth page or its confirmation screen.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, title]);

  return (
    <div className="auth-shell">
      <Header />
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
      <Footer />
    </div>
  );
}
