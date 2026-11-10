import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShieldIcon } from '../icons';
import { Link } from 'react-router-dom';
import { accountHome, can, canUseBackoffice } from '../../lib/auth';
import { useShop } from '../../state';
import chipIcon from '../../../images/footer/chip.svg';
import mailIcon from '../../../images/footer/mail.svg';
import phoneIcon from '../../../images/footer/phone.svg';
import whatsappIcon from '../../../images/footer/whatsapp.svg';
import { company } from './Header';

export function Footer() {
  const { user } = useShop();
  const [mercadoPago, setMercadoPago] = useState(false);
  useEffect(() => {
    let active = true;
    api
      .paymentMethods()
      .then((methods) => {
        if (active) setMercadoPago(methods.gateways.includes('MERCADOPAGO'));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const staff = canUseBackoffice(user);
  const managesOrders = can(user, 'orders:manage');
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
            Redes, cómputo, seguridad y licencias. Asesoría, instalación y mantenimiento en Juliaca y
            Puno.
          </p>
          <Link className="store-footer-about-link" to="/nosotros">
            Conoce SYSCON →
          </Link>
        </div>
        <nav aria-label="Tienda">
          <h2>Tienda</h2>
          <Link to="/catalogo">Productos</Link>
          <Link to="/categorias">Categorías</Link>
          {!user && <Link to="/registro">Crear cuenta</Link>}
          <Link to={accountHome(user)}>{staff ? 'Administración' : 'Mi cuenta'}</Link>
        </nav>
        <nav aria-label="Ayuda">
          <h2>Ayuda</h2>
          <Link to="/contacto">Ayuda y contacto</Link>
          <Link to="/informacion-de-compra">Entrega y condiciones de compra</Link>
          <Link to={managesOrders ? '/admin/pedidos' : '/cuenta/pedidos'}>
            {managesOrders ? 'Gestión de pedidos' : 'Estado del pedido'}
          </Link>
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
          {mercadoPago && (
            <div className="store-footer-payments">
              <h3>Pagos en línea</h3>
              <span className="store-payment-brand">
                <ShieldIcon size={20} />
                <strong>Mercado Pago</strong>
              </span>
              <p>Pagos procesados por Mercado Pago.</p>
            </div>
          )}
        </div>
      </div>
      <div className="store-footer-bottom">
        <div className="container">
          © {new Date().getFullYear()} Grupo SYSCON Tecnología Informática. Todos los derechos
          reservados.
          <Link to="/informacion-de-compra">Información de compra</Link>
        </div>
      </div>
    </footer>
  );
}
