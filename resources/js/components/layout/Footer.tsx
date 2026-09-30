import { Link } from 'react-router-dom';
import { Brand } from './Header';

export function Footer() {
  return (
    <footer className="store-footer">
      <div className="container store-footer-grid">
        <div className="store-footer-about">
          <Brand />
          <p>Catálogo y compras de tecnología en línea.</p>
        </div>
        <nav aria-label="Tienda">
          <strong>Tienda</strong>
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/#categorias">Categorías</Link>
          <Link to="/carrito">Carrito</Link>
        </nav>
        <nav aria-label="Tu cuenta">
          <strong>Tu cuenta</strong>
          <Link to="/cuenta">Mi cuenta</Link>
          <Link to="/cuenta/pedidos">Mis pedidos</Link>
          <Link to="/registro">Crear cuenta</Link>
        </nav>
        <nav aria-label="SYSCON">
          <strong>SYSCON</strong>
          <Link to="/nosotros">Nosotros</Link>
        </nav>
      </div>
      <div className="container store-footer-bottom">
        © {new Date().getFullYear()} SYSCON Commerce
      </div>
    </footer>
  );
}
