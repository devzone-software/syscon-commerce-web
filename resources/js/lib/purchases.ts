/** A purchase line as typed in the form; the platform receives integers and 2-decimal costs. */
export type PurchaseLine = { productId: string; quantity: string; unitCost: string };

export function purchaseLineError(line: PurchaseLine): string | null {
  if (!line.productId) return 'Elige el producto de cada línea.';
  if (!/^\d+$/.test(line.quantity.trim()) || Number(line.quantity) < 1)
    return 'La cantidad debe ser un número entero mayor que cero.';
  if (!/^\d+(\.\d{1,2})?$/.test(line.unitCost.trim()) || Number(line.unitCost) <= 0)
    return 'El costo unitario debe ser mayor que cero, con hasta 2 decimales.';
  return null;
}

/** Sum in cents so 3 × 0.10 is 0.30, not 0.30000000000000004. */
export function purchaseTotal(lines: PurchaseLine[]): number {
  const cents = lines.reduce((sum, line) => {
    if (purchaseLineError(line)) return sum;
    return sum + Number(line.quantity) * Math.round(Number(line.unitCost) * 100);
  }, 0);
  return cents / 100;
}

/** Units that can still be taken for internal use: reserved units are already committed to orders. */
export function internalUseError(
  quantity: string,
  available: number,
  reason: string,
): string | null {
  if (!/^\d+$/.test(quantity.trim()) || Number(quantity) < 1)
    return 'La cantidad debe ser un número entero mayor que cero.';
  if (Number(quantity) > available)
    return available > 0
      ? `Solo hay ${available} unidades disponibles.`
      : 'El producto no tiene unidades disponibles.';
  if (reason.trim().length < 3) return 'Indica el motivo del retiro.';
  return null;
}
