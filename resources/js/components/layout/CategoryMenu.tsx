import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { catalogParams } from '../../lib/catalog';
import { groupCategories } from '../../lib/categoryMenu';
import { api } from '../../services/api';
import { useData } from '../../ui';
import { ChevronRightIcon } from '../icons';

const categoryUrl = (name: string) =>
  `/catalogo?${catalogParams.category}=${encodeURIComponent(name)}`;

/**
 * "Categorías" of the main navigation (Mercado Libre style): a dark panel with the families
 * and, beside the active one, its categories. Opens on hover or click; Escape closes it.
 */
export function CategoryMenu() {
  const { data } = useData(api.categories);
  const families = groupCategories(data ?? []);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const location = useLocation();
  const closeTimer = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>('.category-menu-toggle')?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };
  const current = families[Math.min(active, families.length - 1)];

  return (
    <div className="category-menu" ref={root} onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        className={`category-menu-toggle${location.pathname === '/categorias' ? ' active' : ''}`}
        aria-expanded={open}
        aria-controls="category-menu-panel"
        // The pointer already opened it on hover; the keyboard (detail 0) toggles it.
        onClick={(event) => (event.detail === 0 ? setOpen((value) => !value) : show())}
      >
        Categorías
        <svg viewBox="0 0 12 8" width="10" height="7" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {open && (
        <div id="category-menu-panel" className="category-menu-panel">
          <ul className="category-menu-families">
            {families.map((family, index) => (
              <li key={family.name}>
                <button
                  type="button"
                  className={index === active ? 'is-active' : undefined}
                  aria-expanded={index === active}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                >
                  {family.name}
                  <ChevronRightIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
          {current && (
            <div className="category-menu-sub">
              <p>{current.name}</p>
              <ul>
                {current.categories.map((category) => (
                  <li key={category}>
                    <Link to={categoryUrl(category)}>{category}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
