import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowIcon } from '../icons';

export function SectionHeading({
  id,
  eyebrow,
  title,
  text,
  link,
}: {
  id: string;
  eyebrow: string;
  title: string;
  text?: ReactNode;
  link?: { to: string; label: string };
}) {
  return (
    <div className="home-section-head">
      <div>
        <span className="home-eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {link && (
        <Link className="home-link" to={link.to}>
          {link.label} <ArrowIcon size={16} />
        </Link>
      )}
    </div>
  );
}
