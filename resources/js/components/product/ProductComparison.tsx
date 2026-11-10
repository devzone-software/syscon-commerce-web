import { publicBrand, publicProductCode } from '../../lib/productPresentation';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../../state';
import type { Product } from '../../types';
import { productSpecifications } from '../../lib/catalog';

function specs(product: Product) {
  const entries = new Map<string, { label: string; value: string }>();
  for (const { label, value } of productSpecifications(product.specifications)) {
    if (label) entries.set(label.toLocaleLowerCase('es'), { label, value });
  }
  return entries;
}

/** Compares published catalog data without inferring compatibility or performance. */
export function ProductComparison({
  product,
  alternatives,
}: {
  product: Product;
  alternatives: Product[];
}) {
  const [selected, setSelected] = useState('');
  const choices = alternatives.filter((item) => item.id !== product.id && item.active);
  const other = choices.find((item) => item.id === selected) ?? choices[0];
  if (!other) return null;
  const left = specs(product);
  const right = specs(other);
  const keys = [...new Set([...left.keys(), ...right.keys()])];
  const rows = [
    ['Precio por unidad', money(Number(product.price)), money(Number(other.price))],
    ['Marca', publicBrand(product) || 'No publicada', publicBrand(other) || 'No publicada'],
    ['Código', publicProductCode(product), publicProductCode(other)],
    [
      'Disponibilidad',
      product.stock > 0 ? 'Disponible' : 'Agotado',
      other.stock > 0 ? 'Disponible' : 'Agotado',
    ],
    ...keys.map((key) => [
      left.get(key)?.label ?? right.get(key)!.label,
      left.get(key)?.value ?? 'No publicado',
      right.get(key)?.value ?? 'No publicado',
    ]),
  ];
  return (
    <details className="product-comparison">
      <summary>Comparar características de estos productos</summary>
      <label className="field">
        Comparar con
        <select value={other.id} onChange={(event) => setSelected(event.target.value)}>
          {choices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.sku}
            </option>
          ))}
        </select>
      </label>
      <table className="product-specifications">
        <caption>Comparación de información publicada en el catálogo</caption>
        <thead>
          <tr>
            <th scope="col">Característica</th>
            <th scope="col">{product.name}</th>
            <th scope="col">
              <Link to={`/producto/${other.id}`}>{other.name}</Link>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b], index) => (
            <tr key={`${index}-${label}`}>
              <th scope="row">{label}</th>
              <td data-label="Producto actual">{a}</td>
              <td data-label="Modelo seleccionado">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flow-note">
        “No publicado” significa que ese dato no está en el catálogo. Esta comparación no confirma
        compatibilidad; consulta los requisitos de tu equipo antes de comprar.
      </p>
    </details>
  );
}
