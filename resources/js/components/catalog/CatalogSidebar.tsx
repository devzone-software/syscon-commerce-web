import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import filterIcon from '../../../images/catalog/filter.svg';
import {
  catalogParams,
  normalize,
  type CatalogFilters,
  type CatalogGroup,
} from '../../lib/catalog';
import { ArrowRightIcon, CloseIcon, HeadsetIcon, SearchIcon } from '../icons';
import '../../../css/products.css';

type Change = (changes: Record<string, string>, replace?: boolean) => void;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="side-block" open>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

function Option({
  label,
  count,
  checked,
  onChange,
  strong,
}: {
  label: ReactNode;
  count?: number;
  checked: boolean;
  onChange: () => void;
  strong?: boolean;
}) {
  return (
    <label className={`side-option${checked ? ' is-checked' : ''}${strong ? ' is-strong' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
      {count !== undefined && <small>{count}</small>}
    </label>
  );
}

/**
 * Filter panel of Figma "Client / Productos": categories, price range with a dual slider,
 * brands with their own search and availability, plus the corporate desk banner.
 * On small screens it is a full-screen panel that `open` shows and `onClose` hides.
 */
export function CatalogSidebar({
  filters,
  categories,
  brands,
  total,
  inStock,
  priceBounds,
  results,
  open,
  onChange,
  onClear,
  onClose,
}: {
  filters: CatalogFilters;
  categories: CatalogGroup[];
  brands: CatalogGroup[];
  total: number;
  inStock: number;
  priceBounds: [number, number];
  results: number;
  open: boolean;
  onChange: Change;
  onClear: () => void;
  onClose: () => void;
}) {
  const [brandQuery, setBrandQuery] = useState('');
  const [min, max] = priceBounds;
  const low = filters.minPrice ?? min;
  const high = filters.maxPrice ?? max;
  const span = Math.max(max - min, 1);
  const shownBrands = brands.filter((brand) =>
    normalize(brand.name).includes(normalize(brandQuery)),
  );
  const price = (key: string, value: number, bound: number) =>
    onChange({ [key]: value === bound ? '' : String(value) }, true);

  return (
    <aside
      id="catalog-filters"
      className={`catalog-side${open ? ' is-open' : ''}`}
      aria-label="Filtros del catálogo"
    >
      <div className="side-card">
        <div className="side-head">
          <h2>
            <img src={filterIcon} alt="" /> Filtros
          </h2>
          <button type="button" onClick={onClear}>
            Limpiar filtros
          </button>
          <button
            type="button"
            className="side-close"
            onClick={onClose}
            aria-label="Cerrar filtros"
          >
            <CloseIcon />
          </button>
        </div>
        <Block title="Categorías">
          <Option
            label="Todos"
            count={total}
            checked={!filters.category}
            strong
            onChange={() => onChange({ [catalogParams.category]: '' })}
          />
          {categories.map((category) => (
            <Option
              key={category.name}
              label={category.name}
              count={category.count}
              checked={filters.category === category.name}
              onChange={() =>
                onChange({
                  [catalogParams.category]: filters.category === category.name ? '' : category.name,
                })
              }
            />
          ))}
        </Block>
        <Block title="Rango de Precio (S/)">
          <div
            className="side-range"
            style={{
              ['--from' as string]: `${((low - min) / span) * 100}%`,
              ['--to' as string]: `${((high - min) / span) * 100}%`,
            }}
          >
            <input
              type="range"
              aria-label="Precio mínimo"
              min={min}
              max={max}
              value={low}
              onChange={(event) =>
                price(catalogParams.minPrice, Math.min(Number(event.target.value), high), min)
              }
            />
            <input
              type="range"
              aria-label="Precio máximo"
              min={min}
              max={max}
              value={high}
              onChange={(event) =>
                price(catalogParams.maxPrice, Math.max(Number(event.target.value), low), max)
              }
            />
          </div>
          <div className="side-price">
            <label>
              MÍNIMO
              <span>
                S/
                <input
                  type="number"
                  min={0}
                  value={filters.minPrice ?? ''}
                  placeholder={String(min)}
                  onChange={(event) =>
                    onChange({ [catalogParams.minPrice]: event.target.value }, true)
                  }
                />
              </span>
            </label>
            <label>
              MÁXIMO
              <span>
                S/
                <input
                  type="number"
                  min={0}
                  value={filters.maxPrice ?? ''}
                  placeholder={String(max)}
                  onChange={(event) =>
                    onChange({ [catalogParams.maxPrice]: event.target.value }, true)
                  }
                />
              </span>
            </label>
          </div>
        </Block>
        {(brands.length > 0 || filters.brand) && (
          <Block title="Marca">
            <label className="side-search">
              <SearchIcon size={14} />
              <span className="visually-hidden">Buscar marca</span>
              <input
                type="search"
                placeholder="Buscar marca..."
                value={brandQuery}
                onChange={(event) => setBrandQuery(event.target.value)}
              />
            </label>
            <div className="side-scroll">
              {shownBrands.map((brand) => (
                <Option
                  key={brand.name}
                  label={brand.name}
                  count={brand.count}
                  checked={filters.brand === brand.name}
                  onChange={() =>
                    onChange({
                      [catalogParams.brand]: filters.brand === brand.name ? '' : brand.name,
                    })
                  }
                />
              ))}
            </div>
          </Block>
        )}
        <Block title="Disponibilidad">
          <Option
            label={
              <>
                <i className="side-dot" aria-hidden="true" /> Solo disponibles
              </>
            }
            count={inStock}
            checked={filters.onlyAvailable}
            onChange={() =>
              onChange({ [catalogParams.onlyAvailable]: filters.onlyAvailable ? '' : '1' })
            }
          />
        </Block>
      </div>
      <div className="side-desk">
        <p>
          <HeadsetIcon size={14} /> MESA CORPORATIVA
        </p>
        <h2>¿Compras por volumen?</h2>
        <span>
          Solicita cotizaciones formalizadas con RUC y condiciones de crédito empresarial.
        </span>
        <Link to="/contacto">
          Cotizar con Asesor <ArrowRightIcon size={14} />
        </Link>
      </div>
      <div className="side-apply">
        <button type="button" onClick={onClose}>
          Ver {results} {results === 1 ? 'producto' : 'productos'}
        </button>
      </div>
    </aside>
  );
}
