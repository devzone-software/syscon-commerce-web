import { useState, type FormEvent, type ReactNode } from 'react';
import { cleanProduct, validateProduct, type ProductInput } from '../../lib/products';
import { api } from '../../services/api';
import { ErrorBox } from '../../ui';

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}

export function ProductForm({
  initial,
  editing,
  categories,
  brands,
  existingSkus = [],
  onSaved,
  onCancel,
}: {
  initial: ProductInput;
  editing: boolean;
  categories: string[];
  brands: string[];
  /** Published SKUs: saving a new product with one of them updates that product. */
  existingSkus?: string[];
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateProduct>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<ProductInput>) => setForm((current) => ({ ...current, ...patch }));
  const describedBy = (id: keyof ProductInput) => (errors[id] ? `product-${id}-error` : undefined);
  const overwrites = !editing && existingSkus.includes(form.sku.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const product = cleanProduct(form);
    const found = validateProduct(product);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      await api.saveProduct(product);
      onSaved(editing || overwrites ? 'Producto actualizado.' : 'Producto guardado.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="bo-card form-stack"
      onSubmit={submit}
      noValidate
      aria-labelledby="product-form-title"
    >
      <h2 id="product-form-title">{editing ? `Editar ${initial.name}` : 'Nuevo producto'}</h2>
      <p className="notice">
        El backend guarda por SKU: si el SKU ya existe, el producto se actualiza. El stock que
        ingreses <strong>reemplaza</strong> al actual; todavía no se registran movimientos de
        inventario.
      </p>
      {error && <ErrorBox message={error} />}
      <div className="field-row">
        <Field id="product-sku" label="SKU" error={errors.sku}>
          <input
            id="product-sku"
            value={form.sku}
            onChange={(e) => set({ sku: e.target.value })}
            readOnly={editing}
            aria-invalid={Boolean(errors.sku)}
            aria-describedby={describedBy('sku') ?? (overwrites ? 'product-sku-exists' : undefined)}
            required
          />
          {overwrites && (
            <small id="product-sku-exists" className="field-warning" role="status">
              Ya existe un producto publicado con este SKU: al guardar se reemplazarán sus datos.
            </small>
          )}
        </Field>
        <Field id="product-name" label="Nombre" error={errors.name}>
          <input
            id="product-name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name')}
            required
          />
        </Field>
      </div>
      <div className="field-row">
        <Field id="product-price" label="Precio (PEN)" error={errors.price}>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={Number.isNaN(form.price) ? '' : form.price}
            onChange={(e) => set({ price: e.target.valueAsNumber })}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={describedBy('price')}
            required
          />
        </Field>
        <Field
          id="product-stock"
          label="Stock"
          error={errors.stock}
          hint="Reemplaza el stock actual."
        >
          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={Number.isNaN(form.stock) ? '' : form.stock}
            onChange={(e) => set({ stock: e.target.valueAsNumber })}
            aria-invalid={Boolean(errors.stock)}
            aria-describedby={describedBy('stock') ?? 'product-stock-hint'}
            required
          />
        </Field>
      </div>
      <div className="field-row">
        <Field id="product-category" label="Categoría" error={errors.category}>
          <input
            id="product-category"
            list="product-categories"
            value={form.category ?? ''}
            onChange={(e) => set({ category: e.target.value })}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describedBy('category')}
          />
          <datalist id="product-categories">
            {categories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
        <Field id="product-brand" label="Marca" error={errors.brand}>
          <input
            id="product-brand"
            list="product-brands"
            value={form.brand ?? ''}
            onChange={(e) => set({ brand: e.target.value })}
            aria-invalid={Boolean(errors.brand)}
            aria-describedby={describedBy('brand')}
          />
          <datalist id="product-brands">
            {brands.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field id="product-image" label="URL de imagen" error={errors.imageUrl}>
        <input
          id="product-image"
          type="url"
          value={form.imageUrl ?? ''}
          onChange={(e) => set({ imageUrl: e.target.value })}
          aria-invalid={Boolean(errors.imageUrl)}
          aria-describedby={describedBy('imageUrl')}
        />
      </Field>
      <label className="facet-option">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set({ active: e.target.checked })}
        />
        <span>Publicado en el catálogo</span>
      </label>
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Guardando…' : overwrites ? 'Actualizar producto existente' : 'Guardar producto'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
