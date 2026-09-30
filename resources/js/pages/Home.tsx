import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function Home() {
  const { data, loading, error, reload } = useData(api.products);
  const featured = data?.slice(0, 4) ?? [];
  const categories = [...new Set(data?.map((p) => p.category).filter(Boolean) ?? [])].slice(
    0,
    5,
  ) as string[];
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-kicker">TECNOLOGÍA PARA AVANZAR</span>
            <h1>Todo lo que tu negocio necesita para seguir creciendo.</h1>
            <p>Explora soluciones, compara productos y compra con confianza en un solo lugar.</p>
            <div className="hero-actions">
              <Link className="button button-light" to="/catalogo">
                Explorar catálogo <span>↗</span>
              </Link>
              <Link className="hero-link" to="/nosotros">
                Conoce SYSCON →
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="hero-card">
              <span>SYSCON / 01</span>
              <strong>
                Conecta.
                <br />
                Impulsa.
                <br />
                Crece.
              </strong>
              <span>TECNOLOGÍA A TU ALCANCE</span>
            </div>
          </div>
        </div>
      </section>
      <section className="benefit-strip">
        <div className="container benefit-grid">
          <span>✧ &nbsp; Catálogo actualizado</span>
          <span>▣ &nbsp; Compra protegida</span>
          <span>↗ &nbsp; Pedidos en línea</span>
          <span>◇ &nbsp; Atención empresarial</span>
        </div>
      </section>
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow accent">DESCUBRE</span>
            <h2>Encuentra lo que buscas</h2>
          </div>
          <Link className="arrow-link" to="/catalogo">
            Ver todo el catálogo →
          </Link>
        </div>
        {categories.length > 0 && (
          <div className="category-grid">
            {categories.map((category, i) => (
              <Link
                key={category}
                className={`category-tile category-${i % 5}`}
                to={`/catalogo?categoria=${encodeURIComponent(category)}`}
              >
                <span>0{i + 1}</span>
                <strong>{category}</strong>
                <span>Explorar ↗</span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow accent">SELECCIÓN SYSCON</span>
            <h2>Productos destacados</h2>
          </div>
          <Link className="arrow-link" to="/catalogo">
            Ver productos →
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : featured.length ? (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty
            title="Pronto habrá productos"
            text="El catálogo estará disponible cuando se publiquen productos desde administración."
          />
        )}
      </section>
      <section className="cta-band">
        <div className="container">
          <div>
            <span className="eyebrow">TU PRÓXIMO PASO</span>
            <h2>Una forma más simple de comprar tecnología.</h2>
          </div>
          <Link className="button button-light" to="/catalogo">
            Comenzar ahora ↗
          </Link>
        </div>
      </section>
    </>
  );
}
