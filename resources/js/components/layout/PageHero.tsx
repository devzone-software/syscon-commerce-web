import type { ReactNode } from 'react';

/** Navy band that opens every store page: eyebrow, title and a short description. */
export function PageHero({
  eyebrow,
  title,
  text,
  large = false,
  children,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  large?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`page-hero${large ? ' is-large' : ''}`}>
      <div className="container">
        <p className="page-hero-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p className="page-hero-text">{text}</p>}
        {children}
      </div>
    </section>
  );
}

/** Content band below the hero; `soft` alternates the light grey background. */
export function PageSection({
  title,
  soft = false,
  action,
  children,
}: {
  title?: string;
  soft?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`page-section${soft ? ' is-soft' : ''}`}>
      <div className="container">
        {(title || action) && (
          <div className="page-section-head">
            {title && <h2>{title}</h2>}
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
