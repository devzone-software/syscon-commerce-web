import { describe, expect, it } from 'vitest';
import {
  accountSummary,
  allowedTransitions,
  orderProgress,
  orderStatusLabels,
  statusLabel,
  statusTone,
} from './orders';

describe('order states', () => {
  it('mirrors the order-service transitions', () => {
    expect(allowedTransitions('PAYMENT_PENDING')).toEqual(['CANCELLED']);
    expect(allowedTransitions('PAID')).toEqual(['PROCESSING']);
    expect(allowedTransitions('SHIPPED')).toEqual(['DELIVERED']);
    expect(allowedTransitions('DELIVERED')).toEqual([]);
    expect(allowedTransitions('CANCELLED')).toEqual([]);
    expect(allowedTransitions('EXPIRED')).toEqual([]);
  });
  it('treats expired orders as closed and unpaid', () => {
    expect(statusLabel(orderStatusLabels, 'EXPIRED')).toBe('Vencido');
    expect(statusTone('EXPIRED')).toBe('danger');
    const summary = accountSummary([{ id: '1', status: 'EXPIRED', total: 80, details: [] }]);
    expect(summary).toMatchObject({ active: 0, spent: 0, current: null });
  });
  it('labels known states and keeps unknown ones visible', () => {
    expect(statusLabel(orderStatusLabels, 'PAID')).toBe('Pagado');
    expect(statusLabel(orderStatusLabels, 'NUEVO_ESTADO')).toBe('NUEVO_ESTADO');
    expect(statusTone('CANCELLED')).toBe('danger');
    expect(statusTone('PROCESSING')).toBe('info');
  });
});

describe('account dashboard', () => {
  const order = (id: string, status: string, total: number) => ({ id, status, total, details: [] });
  it('counts orders, active ones and confirmed spending', () => {
    const summary = accountSummary([
      order('3', 'PAYMENT_PENDING', 50),
      order('2', 'SHIPPED', 100),
      order('1', 'DELIVERED', 30),
      order('0', 'CANCELLED', 999),
    ]);
    expect(summary).toMatchObject({ count: 4, active: 2, pendingPayment: 1, spent: 130 });
    expect(summary.current?.id).toBe('3');
  });
  it('maps the status to the progress bar', () => {
    expect(orderProgress('PAYMENT_PENDING')).toBe(0);
    expect(orderProgress('SHIPPED')).toBe(75);
    expect(orderProgress('DELIVERED')).toBe(100);
    expect(orderProgress('CANCELLED')).toBe(0);
  });
});
