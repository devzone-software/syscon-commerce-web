import { describe, expect, it } from 'vitest';
import { amountError, differenceLabel } from './cash';

describe('cash register', () => {
  it('validates amounts in soles', () => {
    expect(amountError('150')).toBeNull();
    expect(amountError('0', true)).toBeNull();
    expect(amountError('0')).toMatch(/mayor/);
    expect(amountError('1.234')).toMatch(/2 decimales/);
    expect(amountError('-5', true)).toMatch(/2 decimales/);
  });
  it('describes the closing difference', () => {
    expect(differenceLabel('0.00')).toBe('Cuadra');
    expect(differenceLabel('-0.80')).toBe('Faltan S/ 0.80');
    expect(differenceLabel('1.2')).toBe('Sobran S/ 1.20');
  });
});
