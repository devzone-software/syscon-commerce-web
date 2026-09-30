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

export const cartUnits = (lines: CartLine[]) => lines.reduce((n, line) => n + line.quantity, 0);
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
