import { describe, expect, it } from 'vitest';
import { allowedTransitions, orderStatusLabels, statusLabel, statusTone } from './orders';

describe('order states', () => {
  it('mirrors the order-service transitions', () => {
    expect(allowedTransitions('PAYMENT_PENDING')).toEqual(['CANCELLED']);
    expect(allowedTransitions('PAID')).toEqual(['PROCESSING']);
    expect(allowedTransitions('SHIPPED')).toEqual(['DELIVERED']);
    expect(allowedTransitions('DELIVERED')).toEqual([]);
    expect(allowedTransitions('CANCELLED')).toEqual([]);
  });
  it('labels known states and keeps unknown ones visible', () => {
    expect(statusLabel(orderStatusLabels, 'PAID')).toBe('Pagado');
    expect(statusLabel(orderStatusLabels, 'NUEVO_ESTADO')).toBe('NUEVO_ESTADO');
    expect(statusTone('CANCELLED')).toBe('danger');
    expect(statusTone('PROCESSING')).toBe('info');
  });
});
