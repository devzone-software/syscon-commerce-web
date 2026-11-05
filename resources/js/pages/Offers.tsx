import { Navigate, useSearchParams } from 'react-router-dom';
import { useAccountPath } from '../hooks/useAccountPath';
import { catalogParams } from '../lib/catalog';

/** Existing selection links open the same catalog with availability and price filters. */
export function Offers() {
  const accountPath = useAccountPath();
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  if (!next.has(catalogParams.onlyAvailable)) next.set(catalogParams.onlyAvailable, '1');
  if (!next.has(catalogParams.sort)) next.set(catalogParams.sort, 'precio-asc');
  return (
    <Navigate replace to={{ pathname: accountPath('/catalogo'), search: `?${next.toString()}` }} />
  );
}
