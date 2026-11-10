import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '../icons';

export function ShoppingBackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="button button-secondary shopping-back">
      <ArrowLeftIcon size={16} /> {children}
    </Link>
  );
}
