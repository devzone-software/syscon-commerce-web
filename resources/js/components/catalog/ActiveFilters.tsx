import type { CatalogFilters } from '../../lib/catalog';
import { CloseIcon } from '../icons';

export function ActiveFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: CatalogFilters;
  onChange: (changes: Record<string, string>) => void;
  onClear: () => void;
}) {
  const chips = [
    filters.query && { key: 'q', label: `Búsqueda: “${filters.query}”` },
    filters.category && { key: 'categoria', label: `Categoría: ${filters.category}` },
    filters.brand && { key: 'marca', label: `Marca: ${filters.brand}` },
    filters.onlyAvailable && { key: 'disponible', label: 'Solo con stock' },
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  if (!chips.length) return null;
  return (
    <div className="active-filters">
      <ul>
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              className="chip"
              onClick={() => onChange({ [chip.key]: '' })}
              aria-label={`Quitar filtro ${chip.label}`}
            >
              {chip.label} <CloseIcon />
            </button>
          </li>
        ))}
      </ul>
      {chips.length > 1 && (
        <button type="button" className="link-button" onClick={onClear}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
