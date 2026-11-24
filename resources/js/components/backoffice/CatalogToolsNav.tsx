import { NavLink } from 'react-router-dom';

/** Shared entry points for catalog maintenance; all use the existing catalog permission. */
export function CatalogToolsNav() {
  return (
    <nav className="bo-subnav" aria-label="Herramientas de productos">
      <NavLink to="/admin/productos" end>
        Productos
      </NavLink>
      <NavLink to="/admin/carga-masiva">Importar / exportar</NavLink>
      <NavLink to="/admin/categorias">Categorías y marcas</NavLink>
    </nav>
  );
}
