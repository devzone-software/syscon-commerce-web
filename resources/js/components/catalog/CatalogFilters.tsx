import { useState } from 'react';
import type { CatalogFilters as Filters, CatalogGroup } from '../../lib/catalog';

const VISIBLE_OPTIONS = 8;

function FacetGroup({
  legend,
  name,
  options,
  selected,
  onSelect,
}: {
  legend: string;
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
  if (!all.length) return null;
  return (
    <fieldset className="facet">
      <legend>{legend}</legend>
      <label className="facet-option">
        <input type="radio" name={name} checked={!selected} onChange={() => onSelect('')} />
        <span>Todas</span>
      </label>
      {visible.map((option) => (
        <label className="facet-option" key={option.name}>
          <input
            type="radio"
            name={name}
            checked={selected === option.name}
            onChange={() => onSelect(option.name)}
          />
          <span>{option.name}</span>
          <small>{option.count}</small>
        </label>
      ))}
      {all.length > VISIBLE_OPTIONS && (
        <button type="button" className="facet-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Ver menos' : `Ver ${all.length - VISIBLE_OPTIONS} más`}
        </button>
      )}
    </fieldset>
  );
}

export function CatalogFilters({
  filters,
  categories,
  brands,
  onChange,
}: {
  filters: Filters;
  categories: CatalogGroup[];
  brands: CatalogGroup[];
  onChange: (changes: Record<string, string>) => void;
}) {
  return (
    <div className="catalog-filters">
      <fieldset className="facet">
        <legend>Disponibilidad</legend>
        <label className="facet-option">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={(event) => onChange({ disponible: event.target.checked ? '1' : '' })}
          />
          <span>Solo con stock</span>
        </label>
      </fieldset>
      <FacetGroup
        legend="Categoría"
        name="categoria"
        options={categories}
        selected={filters.category}
        onSelect={(value) => onChange({ categoria: value })}
      />
      <FacetGroup
        legend="Marca"
        name="marca"
        options={brands}
        selected={filters.brand}
        onSelect={(value) => onChange({ marca: value })}
      />
    </div>
  );
}
