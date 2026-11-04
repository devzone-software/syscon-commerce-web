import type { CartLine, Product } from '../types';

/** Adds units of a product without exceeding the stock known when it was added. */
export function addToCart(lines: CartLine[], product: Product, quantity = 1): CartLine[] {
  const units = Math.floor(quantity);
  if (product.stock < 1 || units < 1) return lines;
  const found = lines.find((line) => line.product.id === product.id);
  if (found)
    return lines.map((line) =>
      line.product.id === product.id
        ? { ...line, product, quantity: Math.min(product.stock, line.quantity + units) }
        : line,
    );
  return [...lines, { product, quantity: Math.min(product.stock, units) }];
}

/** Sets the quantity of a line; zero or less removes it. */
export function setCartQuantity(lines: CartLine[], id: string, quantity: number): CartLine[] {
  return lines.flatMap((line) =>
    line.product.id !== id
      ? [line]
      : quantity <= 0 || line.product.stock < 1
        ? []
        : [{ ...line, quantity: Math.min(line.product.stock, Math.max(1, Math.floor(quantity))) }],
  );
}

/** Units of a product already in the cart and how many more can still be added. */
export function cartAvailability(lines: CartLine[], product: Product) {
  const inCart = lines.find((line) => line.product.id === product.id)?.quantity ?? 0;
  return { inCart, remaining: Math.max(0, product.stock - inCart) };
}

export const cartUnits = (lines: CartLine[]) => lines.reduce((n, line) => n + line.quantity, 0);
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

/** Refreshes the stored product snapshots with current catalog data; quantities are kept. */
export function syncCart(lines: CartLine[], products: Product[]): CartLine[] {
  const current = new Map(products.map((product) => [product.id, product]));
  let changed = false;
  const next = lines.map((line) => {
    const fresh = current.get(line.product.id);
    if (!fresh || JSON.stringify(fresh) === JSON.stringify(line.product)) return line;
    changed = true;
    return { ...line, product: fresh };
  });
  return changed ? next : lines;
}

export type CartIssue = 'unavailable' | 'out-of-stock' | 'exceeds-stock';

/**
 * Lines that would be rejected when creating the order. Without catalog data only the
 * stored stock can be checked.
 */
export function reviewCart(lines: CartLine[], products: Product[] | null) {
  const published = products ? new Set(products.map((product) => product.id)) : null;
  const issues = new Map<string, CartIssue>();
  for (const { product, quantity } of lines) {
    if (published && !published.has(product.id)) issues.set(product.id, 'unavailable');
    else if (product.stock < 1) issues.set(product.id, 'out-of-stock');
    else if (quantity > product.stock) issues.set(product.id, 'exceeds-stock');
  }
  return issues;
}

export const issueMessages: Record<CartIssue, string> = {
  unavailable: 'Este producto ya no está publicado en el catálogo. Quítalo para continuar.',
  'out-of-stock': 'Este producto se agotó. Quítalo para continuar.',
  'exceeds-stock': 'La cantidad supera el stock disponible.',
};
