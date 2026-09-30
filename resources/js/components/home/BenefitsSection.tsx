import { BagIcon, BoxIcon, ClipboardIcon, GridIcon } from '../icons';

// Each item describes a feature that already exists in the store.
const benefits = [
  {
    icon: <GridIcon />,
    title: 'Catálogo en línea',
    text: 'Busca productos por nombre, marca o SKU y filtra por categoría.',
  },
  {
    icon: <BoxIcon />,
    title: 'Disponibilidad visible',
    text: 'Cada producto indica si tiene stock antes de agregarlo al carrito.',
  },
  {
    icon: <BagIcon />,
    title: 'Pedidos en línea',
    text: 'Confirma tu pedido desde tu cuenta; el precio y el stock se validan al crearlo.',
  },
  {
    icon: <ClipboardIcon />,
    title: 'Seguimiento en tu cuenta',
    text: 'Consulta el estado y el detalle de tus pedidos cuando lo necesites.',
  },
];

export function BenefitsSection() {
  return (
    <section className="home-benefits" aria-labelledby="home-benefits-title">
      <div className="container">
        <h2 id="home-benefits-title" className="visually-hidden">
          Cómo comprar en SYSCON
        </h2>
        <ul className="home-benefit-grid">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="home-benefit">
              <span className="home-benefit-icon">{benefit.icon}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
