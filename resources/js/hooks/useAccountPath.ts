import { useLocation } from 'react-router-dom';

const accountPaths: Record<string, string> = {
  '/': '/cuenta',
  '/carrito': '/cuenta/carrito',
  '/ofertas': '/cuenta/seleccion',
  '/contacto': '/cuenta/soporte',
  '/nosotros': '/cuenta/nosotros',
};

/** Keep links between shared pages inside the current customer workspace. */
export function useAccountPath() {
  const { pathname } = useLocation();
  return (path: string) =>
    pathname === '/cuenta' || pathname.startsWith('/cuenta/') ? (accountPaths[path] ?? path) : path;
}
