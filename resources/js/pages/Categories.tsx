import { categoryPhoto } from '../lib/categoryPhoto';
import { ContentDisclosure } from '../components/shared/ContentDisclosure';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import homeIcon from '../../images/catalog/home.svg';
import searchButtonIcon from '../../images/catalog/search-button.svg';
import logo from '../../images/header/logo-grupo-syscon.jpg';
import trustBoltIcon from '../../images/home/trust-bolt.svg';
import trustLockIcon from '../../images/home/trust-lock.svg';
import trustShieldIcon from '../../images/home/trust-shield.svg';
import trustSupportIcon from '../../images/home/trust-support.svg';
import { ProductImage } from '../components/ProductImage';
import { categoryIcon } from '../lib/categoryIcon';
import { company } from '../components/layout/Header';
import { ArrowRightIcon, CartIcon, HeadsetIcon, SearchIcon, ShieldIcon } from '../components/icons';
import { catalogParams, groupProducts } from '../lib/catalog';
import { api } from '../services/api';
import { money } from '../state';
import { useConfirmAdd } from '../components/cart/AddToCartDialog';
import type { Product } from '../types';
import { useData, ErrorBox, Loading, Empty } from '../ui';
import '../../css/categories.css';
import { isServicePlan, planInquiryUrl } from '../lib/servicePlans';

const byCategory = (name: string) =>
  `/catalogo?${catalogParams.category}=${encodeURIComponent(name)}`;
const byBrand = (name: string) => `/catalogo?${catalogParams.brand}=${encodeURIComponent(name)}`;

const trust = [
  {
    icon: trustLockIcon,
    title: 'Compra Segura',
    text: 'Pagos verificados por nuestro equipo y comprobante según los datos de tu pedido.',
  },
  {
    icon: trustBoltIcon,
    title: 'Entrega coordinada',
    text: 'Consulta las opciones de entrega y retiro disponibles para tu pedido.',
  },
  {
    icon: trustSupportIcon,
    title: 'Soporte Técnico',
    text: 'Consulta la disponibilidad de asesoría, instalación y mantenimiento en la región Puno.',
  },
  {
    icon: trustShieldIcon,
    title: 'Garantía por producto',
    text: 'Consulta las condiciones y el respaldo de cada producto.',
  },
];
const gradients = ['is-navy', 'is-teal', 'is-green'];
const campaignTags = ['EXPLORA EL CATÁLOGO', 'PARA TU NEGOCIO', 'PRODUCTOS DISPONIBLES'];

/** Compact product card of the category rows (SKU, availability, price and actions). */
function ShowcaseCard({ product }: { product: Product }) {
  const add = useConfirmAdd();
  const url = `/producto/${product.id}`;
  const available = product.stock > 0;
  return (
    <article className="showcase-card">
      <div className="showcase-card-top">
        <code>SKU: {product.sku}</code>
        {!available && <span className="is-out">Agotado</span>}
      </div>
      <Link to={url} className="showcase-card-media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
      </Link>
      <Link to={url} className="showcase-card-title">
        {product.name}
      </Link>
      <p className="showcase-card-price">
        <strong>{money(Number(product.price))}</strong>{' '}
        {isServicePlan(product) ? 'al mes' : 'inc. IGV'}
      </p>
      <div className="showcase-card-actions">
        <Link to={url}>Ver detalle</Link>
        {isServicePlan(product) ? (
          <Link to={planInquiryUrl(product)}>Consultar</Link>
        ) : (
          <button
            type="button"
            onClick={() => add(product)}
            disabled={!available}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <CartIcon size={14} /> Agregar
          </button>
        )}
      </div>
    </article>
  );
}

/** Figma "Client / Categorías", fed by the categories, brands and products of the catalog. */
export function Categories() {
  const { data, loading, error, reload } = useData(api.products);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const summary = useMemo(() => {
    const products = data ?? [];
    const categories = groupProducts(products, 'category');
    const inCategory = (name: string) => products.filter((product) => product.category === name);
    return {
      categories,
      brands: groupProducts(products, 'brand'),
      sample: (name: string) =>
        inCategory(name).find((product) => product.imageUrl) ?? inCategory(name)[0],
      brandsOf: (name: string) => groupProducts(inCategory(name), 'brand'),
      inStock: (name: string) =>
        inCategory(name)
          .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
          .slice(0, 4),
    };
  }, [data]);
  const search = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/catalogo?${catalogParams.query}=${encodeURIComponent(value)}` : '/catalogo');
  };

  return (
    <div className="categories-page">
      <div className="categories-crumb">
        <div className="container">
          <nav aria-label="Ruta de navegación">
            <Link to="/">
              <img src={homeIcon} alt="" /> Inicio
            </Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Categorías de Hardware &amp; Software</span>
          </nav>
          {data && (
            <span className="categories-crumb-tag">
              <i aria-hidden="true" /> SYSCON // {summary.categories.length} CATEGORÍAS DE CATÁLOGO
            </span>
          )}
        </div>
      </div>

      <section className="categories-hero">
        <div className="container">
          <span className="categories-hero-pill">
            Índice global de productos corporativos y licencias
          </span>
          <h1>Explora nuestras categorías</h1>
          <p>
            Encuentra rápidamente los productos que necesitas navegando por nuestras principales
            categorías de infraestructura, licenciamiento y estaciones de trabajo.
          </p>
          <form className="categories-search" role="search" onSubmit={search}>
            <SearchIcon size={20} />
            <label className="visually-hidden" htmlFor="categories-search">
              Buscar en el catálogo
            </label>
            <input
              id="categories-search"
              type="search"
              placeholder="Buscar categoría, marca o producto..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">
              <img src={searchButtonIcon} alt="" /> Buscar
            </button>
          </form>
          {summary.categories.length > 0 && (
            <div className="categories-quick">
              <span>FILTRO RÁPIDO:</span>
              {summary.categories.slice(0, 6).map((category) => (
                <Link key={category.name} to={byCategory(category.name)}>
                  <img src={categoryIcon(category.name)} alt="" /> {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="container">
          <Loading />
        </div>
      ) : error ? (
        <div className="container">
          <ErrorBox message={error} retry={reload} />
        </div>
      ) : !summary.categories.length ? (
        <div className="container">
          <Empty
            title="Aún no hay categorías"
            text="Las categorías aparecerán cuando se publiquen productos desde administración."
          />
        </div>
      ) : (
        <>
          <section className="categories-band">
            <div className="container">
              <div className="categories-heading">
                <div>
                  <p className="categories-eyebrow">01 / UNIDADES DE NEGOCIO</p>
                  <h2>Categorías Principales</h2>
                </div>
                <p>
                  Hardware y software: consulta las características, condiciones y precios
                  actualizados.
                </p>
              </div>
              <ul className="category-tiles">
                {summary.categories.map((category) => {
                  const sample = summary.sample(category.name);
                  const brands = summary.brandsOf(category.name);
                  return (
                    <li key={category.name}>
                      <Link to={byCategory(category.name)}>
                        <span
                          className={`category-tile-media${categoryPhoto(category.name) ? ' is-photo' : ''}`}
                        >
                          {categoryPhoto(category.name) ? (
                            <img
                              src={categoryPhoto(category.name)!}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            sample && <ProductImage product={sample} />
                          )}
                        </span>
                        <span className="category-tile-tag">
                          <img src={categoryIcon(category.name)} alt="" />
                          {brands.length} {brands.length === 1 ? 'MARCA' : 'MARCAS'}
                        </span>
                        <strong>{category.name}</strong>
                        <span className="category-tile-text">
                          {brands.length
                            ? `Productos de ${brands
                                .slice(0, 3)
                                .map((brand) => brand.name)
                                .join(', ')} con precios actualizados.`
                            : 'Productos con precios actualizados.'}
                        </span>
                        <span className="category-tile-link">
                          Ver categoría <ArrowRightIcon size={16} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <ContentDisclosure title="Categorías destacadas">
            <section className="categories-band is-soft">
              <div className="container">
                <div className="categories-heading">
                  <div>
                    <p className="categories-eyebrow">02 / CAMPAÑAS ESPECIALIZADAS</p>
                    <h2>Categorías Destacadas</h2>
                  </div>
                </div>
                <ul className="category-campaigns">
                  {summary.categories.slice(0, 3).map((category, index) => (
                    <li key={category.name} className={gradients[index]}>
                      <span>{campaignTags[index]}</span>
                      <h3>{category.name}</h3>
                      <p>
                        Productos seleccionados con precios actualizados y atención especializada
                        para empresas.
                      </p>
                      <Link to={byCategory(category.name)}>
                        Explorar {category.name} <ArrowRightIcon size={14} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </ContentDisclosure>

          <ContentDisclosure title="Categorías y marcas">
            <section className="categories-band">
              <div className="container">
                <div className="categories-heading">
                  <div>
                    <p className="categories-eyebrow">03 / CATEGORÍAS Y MARCAS</p>
                    <h2>Explora por categorías y marcas</h2>
                  </div>
                  <Link className="categories-more" to="/catalogo">
                    Ver catálogo completo con filtros avanzados <ArrowRightIcon size={14} />
                  </Link>
                </div>
                <ul className="category-map">
                  {summary.categories.map((category) => (
                    <li key={category.name}>
                      <Link className="category-map-head" to={byCategory(category.name)}>
                        <img src={categoryIcon(category.name)} alt="" /> {category.name}
                      </Link>
                      <ul>
                        {summary.brandsOf(category.name).map((brand) => (
                          <li key={brand.name}>
                            <Link
                              to={`${byCategory(category.name)}&${catalogParams.brand}=${encodeURIComponent(brand.name)}`}
                            >
                              {brand.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </ContentDisclosure>

          {summary.categories.slice(0, 2).map((category, index) => (
            <ContentDisclosure key={category.name} title={`Productos de ${category.name}`}>
              <section className={`categories-band${index ? '' : ' is-soft'}`}>
                <div className="container">
                  <div className="categories-heading">
                    <div>
                      <p className="categories-eyebrow">SELECCIÓN DEL CATÁLOGO</p>
                      <h2>{category.name}</h2>
                    </div>
                    <Link className="categories-more" to={byCategory(category.name)}>
                      Ver todos los productos de {category.name} <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                  <div className="showcase-grid">
                    {summary.inStock(category.name).map((product) => (
                      <ShowcaseCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            </ContentDisclosure>
          ))}

          <div className="container">
            <section className="categories-cta" aria-labelledby="categories-cta-title">
              <div>
                <span>
                  <ShieldIcon size={14} /> COMPRAS PARA EMPRESAS
                </span>
                <h2 id="categories-cta-title">
                  Encuentra todo lo que necesitas para tu infraestructura IT en un solo lugar
                </h2>
                <p>Software y hardware para empresas peruanas e instituciones públicas.</p>
              </div>
              <div className="categories-cta-actions">
                <Link to="/contacto" className="is-teal">
                  <HeadsetIcon size={16} /> Consultar con un Asesor
                </Link>
                <Link to="/catalogo">
                  Ver Catálogo Completo <ArrowRightIcon size={14} />
                </Link>
              </div>
            </section>
          </div>

          {summary.brands.length > 0 && (
            <section className="categories-band is-soft">
              <div className="container">
                <div className="categories-heading">
                  <div>
                    <p className="categories-eyebrow">04 / PARTNERS &amp; FABRICANTES</p>
                    <h2>Explora por Marcas Destacadas</h2>
                  </div>
                  <p>Marcas tecnológicas disponibles en nuestro catálogo.</p>
                </div>
                <ul className="brand-tiles">
                  {summary.brands.slice(0, 8).map((brand) => (
                    <li key={brand.name}>
                      <Link to={byBrand(brand.name)}>
                        <i>
                          <ShieldIcon size={18} />
                        </i>
                        <span>
                          <strong>{brand.name}</strong>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}

      <div className="container">
        <ul className="categories-trust">
          {trust.map((item) => (
            <li key={item.title}>
              <i>
                <img src={item.icon} alt="" />
              </i>
              <span>
                <strong>{item.title}</strong>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
        <div className="categories-callbar">
          <img className="brand-image" src={logo} alt="Grupo SYSCON" width={132} height={37} />
          <span>
            Central de Atención Telefónica Corporativa:{' '}
            <a href={company.phoneHref}>{company.phone}</a>
          </span>
          <em>
            <ShieldIcon size={14} /> COMPLIANCE IT &amp; LICENCIAMIENTO CORPORATIVO PERÚ
          </em>
        </div>
      </div>
    </div>
  );
}
