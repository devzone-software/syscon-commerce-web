import { describe, expect, it } from 'vitest';
import { internalUseError, purchaseLineError, purchaseTotal } from './purchases';

const line = (quantity: string, unitCost: string, productId = 'p1') => ({
  productId,
  quantity,
  unitCost,
});

describe('wholesale purchases', () => {
  it('requires a product, whole quantities and positive 2-decimal costs', () => {
    expect(purchaseLineError(line('10', '80.50'))).toBeNull();
    expect(purchaseLineError(line('10', '80.5', ''))).toMatch(/producto/);
    expect(purchaseLineError(line('1.5', '80'))).toMatch(/entero/);
    expect(purchaseLineError(line('0', '80'))).toMatch(/entero/);
    expect(purchaseLineError(line('2', '0'))).toMatch(/costo/);
    expect(purchaseLineError(line('2', '1.999'))).toMatch(/costo/);
  });
  it('adds valid lines in cents and skips incomplete ones', () => {
    expect(purchaseTotal([line('3', '0.10'), line('10', '80.50'), line('', '5')])).toBe(805.3);
    expect(purchaseTotal([])).toBe(0);
  });
});

describe('internal use', () => {
  it('only takes available units and needs a reason', () => {
    expect(internalUseError('3', 3, 'Oficina')).toBeNull();
    expect(internalUseError('4', 3, 'Oficina')).toBe('Solo hay 3 unidades disponibles.');
    expect(internalUseError('1', 0, 'Oficina')).toBe('El producto no tiene unidades disponibles.');
    expect(internalUseError('1', 3, ' a ')).toMatch(/motivo/);
    expect(internalUseError('x', 3, 'Oficina')).toMatch(/entero/);
  });
});
