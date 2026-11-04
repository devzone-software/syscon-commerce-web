import { Link } from 'react-router-dom';
import chipIcon from '../../../images/footer/chip.svg';
import clockIcon from '../../../images/footer/clock.svg';
import mailIcon from '../../../images/footer/mail.svg';
import phoneIcon from '../../../images/footer/phone.svg';
import whatsappIcon from '../../../images/footer/whatsapp.svg';
import { company } from './Header';

export function Footer() {
  return (
    <footer className="store-footer">
      <div className="container store-footer-grid">
        <div className="store-footer-about">
          <Link to="/" className="store-footer-brand" aria-label="SYSCON Tecnología, ir al inicio">
            <img src={chipIcon} alt="" />
            <span>
              SYSCON<small>TECNOLOGÍA</small>
            </span>
          </Link>
          <p>
            Expertos en tecnología informática, hardware empresarial, servidores, licenciamiento
            corporativo y soluciones de red certificadas.
          </p>
        </div>
        <nav aria-label="Tienda">
          <h2>Tienda</h2>
          <Link to="/catalogo">Productos</Link>
          <Link to="/categorias">Categorías</Link>
          <Link to="/ofertas">Ofertas</Link>
        </nav>
        <nav aria-label="Ayuda">
          <h2>Ayuda</h2>
          <Link to="/contacto">Contacto comercial</Link>
          <Link to="/contacto">Soporte técnico</Link>
          <Link to="/cuenta/pedidos">Estado del pedido</Link>
        </nav>
        <nav aria-label="Empresa">
          <h2>Empresa</h2>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/registro">Crear cuenta</Link>
          <Link to="/cuenta">Mi cuenta</Link>
        </nav>
        <div>
          <h2>Contacto</h2>
          <ul className="store-footer-contact">
            <li>
              <img src={mailIcon} alt="" />
              <a href="mailto:ventas@gruposyscon.pe">ventas@gruposyscon.pe</a>
            </li>
            <li>
              <img src={phoneIcon} alt="" />
              <a href={company.phoneHref}>Central: {company.phone}</a>
            </li>
            <li>
              <img src={whatsappIcon} alt="" />
              <a href="https://wa.me/51987654321" target="_blank" rel="noreferrer">
                WhatsApp Oficial: 987 654 321
              </a>
            </li>
            <li>
              <img src={clockIcon} alt="" />
              Lun - Sáb: 8:30 AM - 6:30 PM
            </li>
          </ul>
        </div>
      </div>
      <div className="store-footer-bottom">
        <div className="container">
          © {new Date().getFullYear()} Grupo SYSCON Tecnología Informática. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
