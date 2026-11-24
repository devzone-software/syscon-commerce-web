/** Amount typed in soles: up to 2 decimals; zero allowed only where it makes sense (opening, count). */
export function amountError(value: string, allowZero = false): string | null {
  const text = value.trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(text)) return 'Ingresa un monto con hasta 2 decimales.';
  if (!allowZero && Number(text) === 0) return 'El monto debe ser mayor que cero.';
  return null;
}

/** "Cuadra", "Sobran S/ 1.20" or "Faltan S/ 0.80" from counted − expected. */
export function differenceLabel(difference: string): string {
  const cents = Math.round(Number(difference) * 100);
  if (cents === 0) return 'Cuadra';
  return `${cents > 0 ? 'Sobran' : 'Faltan'} S/ ${(Math.abs(cents) / 100).toFixed(2)}`;
}
