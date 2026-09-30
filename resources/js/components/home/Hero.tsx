import { Link } from 'react-router-dom';
import { ArrowIcon } from '../icons';

type Stats = { products: number; categories: number; brands: number };

function NetworkArt() {
  const nodes = [
    [70, 80],
    [250, 50],
    [390, 120],
    [60, 250],
    [400, 290],
    [120, 390],
    [300, 400],
  ];
  return (
    <svg className="home-hero-art" viewBox="0 0 460 460" aria-hidden="true" focusable="false">
      <circle className="art-ring" cx="230" cy="230" r="170" />
      <circle className="art-ring" cx="230" cy="230" r="110" />
      {nodes.map(([x, y]) => (
        <line key={`l${x}${y}`} className="art-link" x1="230" y1="230" x2={x} y2={y} />
      ))}
      <polyline
        className="art-link faint"
        points={nodes.map(([x, y]) => `${x},${y}`).join(' ') + ` ${nodes[0].join(',')}`}
      />
      {nodes.map(([x, y], i) => (
        <circle
          key={`n${x}${y}`}
          className={`art-node${i % 3 === 0 ? ' accent' : ''}`}
          cx={x}
          cy={y}
          r="9"
        />
      ))}
      <rect className="art-core" x="180" y="180" width="100" height="100" rx="22" />
      <text className="art-core-text" x="230" y="248" textAnchor="middle">
        S
      </text>
    </svg>
  );
}

export function Hero({ stats }: { stats: Stats | null }) {
  const items = stats
    ? [
        { value: stats.products, label: stats.products === 1 ? 'producto' : 'productos' },
        { value: stats.categories, label: stats.categories === 1 ? 'categoría' : 'categorías' },
        { value: stats.brands, label: stats.brands === 1 ? 'marca' : 'marcas' },
      ].filter((item) => item.value > 0)
    : [];
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="container home-hero-grid">
        <div className="home-hero-copy">
          <span className="home-kicker">Tienda online SYSCON</span>
          <h1 id="home-hero-title">Tecnología para conectar y hacer crecer tu negocio.</h1>
          <p>
            Explora el catálogo de SYSCON, compara productos por categoría y marca, y realiza tu
            pedido en línea desde tu cuenta.
          </p>
          <div className="home-hero-actions">
            <Link className="home-button home-button-primary" to="/catalogo">
              Ver catálogo <ArrowIcon />
            </Link>
            <Link className="home-button home-button-ghost" to="/nosotros">
              Conoce SYSCON
            </Link>
          </div>
          {items.length > 0 && (
            <dl className="home-hero-stats">
              {items.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="home-hero-visual">
          <NetworkArt />
        </div>
      </div>
    </section>
  );
}
