import { Link } from 'react-router-dom';
import { accountHome, can, canUseBackoffice } from '../../lib/auth';
import { useShop } from '../../state';
import mailIcon from '../../../images/footer/mail.svg';
import phoneIcon from '../../../images/footer/phone.svg';
import whatsappIcon from '../../../images/footer/whatsapp.svg';
import { Brand, company } from './Header';

export function Footer() {
  const { user } = useShop();
  const staff = canUseBackoffice(user);
  const managesOrders = can(user, 'orders:manage');
  return (
    <footer className="store-footer">
      <div className="container store-footer-grid">
        <div className="store-footer-about">
          <div className="store-footer-logo">
            <Brand clear />
          </div>
          <p>
            Equipos de seguridad electrónica, redes, cómputo y licencias de software. Instalación y
            mantenimiento en Juliaca y la región Puno.
          </p>
        </div>
        <nav aria-label="Tienda">
          <h2>Tienda</h2>
          <Link to="/catalogo">Productos</Link>
          <Link to="/categorias">Categorías</Link>
        </nav>
        <nav aria-label="Ayuda">
          <h2>Ayuda</h2>
          <Link to="/contacto">Ayuda y contacto</Link>
          <Link to={managesOrders ? '/admin/pedidos' : '/cuenta/pedidos'}>
            {managesOrders ? 'Gestión de pedidos' : 'Estado del pedido'}
          </Link>
        </nav>
        <nav aria-label="Empresa">
          <h2>Empresa</h2>
          <Link to="/nosotros">Nosotros</Link>
          {!user && <Link to="/registro">Crear cuenta</Link>}
          <Link to={accountHome(user)}>{staff ? 'Administración' : 'Mi cuenta'}</Link>
        </nav>
        <div className="store-footer-contact-column">
          <h2>Contacto</h2>
          <ul className="store-footer-contact">
            <li>
              <img src={mailIcon} alt="" />
              <a href={`mailto:${company.salesEmail}`}>{company.salesEmail}</a>
            </li>
            <li>
              <img src={phoneIcon} alt="" />
              <a href={company.phoneHref}>Central: {company.phone}</a>
            </li>
            <li>
              <img src={whatsappIcon} alt="" />
              <a href={company.whatsappHref} target="_blank" rel="noreferrer">
                WhatsApp: {company.whatsappLabel}
              </a>
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
