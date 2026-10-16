import { useState, type ReactNode } from 'react';
import {
  catalogParams,
  type CatalogFilters as Filters,
  type CatalogGroup,
} from '../../lib/catalog';
import '../../../css/storefront.css';

const VISIBLE_OPTIONS = 7;

type Change = (changes: Record<string, string>, replace?: boolean) => void;

/** Collapsible white block of the sidebar (Figma "Filter Block"). */
function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="filter-block" open>
      <summary>{title}</summary>
      <div className="filter-block-body">{children}</div>
    </details>
  );
}

function OptionList({
  name,
  options,
  selected,
  onSelect,
}: {
  name: string;
  options: CatalogGroup[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Keep the selected option visible even when other filters leave it without results.
  const all =
    selected && !options.some((option) => option.name === selected)
      ? [{ name: selected, count: 0 }, ...options]
      : options;
  const visible = expanded ? all : all.slice(0, VISIBLE_OPTIONS);
  return (
    <>
      {visible.map((option) => (
        <label className="filter-option" key={option.name}>
          <input
            type="checkbox"
            name={name}
            checked={selected === option.name}
            onChange={() => onSelect(selected === option.name ? '' : option.name)}
          />
          <span>{option.name}</span>
          <small>{option.count}</small>
        </label>
      ))}
      {all.length > VISIBLE_OPTIONS && (
        <button type="button" className="filter-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Ver menos' : `Ver ${all.length - VISIBLE_OPTIONS} más`}
        </button>
      )}
    </>
  );
}

export function CatalogFilters({
  filters,
  categories,
  brands,
  inStock,
  onChange,
}: {
  filters: Filters;
  categories: CatalogGroup[];
  brands: CatalogGroup[];
  inStock?: number;
  onChange: Change;
}) {
  const price = (key: string, value: string) => onChange({ [key]: value }, true);
  return (
    <div className="catalog-filters">
      {(categories.length > 0 || filters.category) && (
        <FilterBlock title="Categorías">
          <OptionList
            name={catalogParams.category}
            options={categories}
            selected={filters.category}
            onSelect={(value) => onChange({ [catalogParams.category]: value })}
          />
        </FilterBlock>
      )}
      <FilterBlock title="Rango de precio">
        <div className="filter-price">
          <label>
            Desde
            <span>
              S/
              <input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="0"
                value={filters.minPrice ?? ''}
                onChange={(event) => price(catalogParams.minPrice, event.target.value)}
              />
            </span>
          </label>
          <label>
            Hasta
            <span>
              S/
              <input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="Sin límite"
                value={filters.maxPrice ?? ''}
                onChange={(event) => price(catalogParams.maxPrice, event.target.value)}
              />
            </span>
          </label>
        </div>
      </FilterBlock>
      <FilterBlock title="Disponibilidad">
        <label className="filter-option">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={(event) =>
              onChange({ [catalogParams.onlyAvailable]: event.target.checked ? '1' : '' })
            }
          />
          <span>En stock inmediato</span>
          {inStock !== undefined && <small>{inStock}</small>}
        </label>
      </FilterBlock>
      {(brands.length > 0 || filters.brand) && (
        <FilterBlock title="Marcas oficiales">
          <OptionList
            name={catalogParams.brand}
            options={brands}
            selected={filters.brand}
            onSelect={(value) => onChange({ [catalogParams.brand]: value })}
          />
        </FilterBlock>
      )}
    </div>
  );
}
