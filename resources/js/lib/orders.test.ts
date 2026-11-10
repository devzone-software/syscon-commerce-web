import { describe, expect, it } from 'vitest';
import {
  accountSummary,
  customerOrderHint,
  allowedTransitions,
  orderProgress,
  orderStatusLabels,
  orderLabelsForDelivery,
  statusLabel,
  statusTone,
} from './orders';

describe('order states', () => {
  it('uses pickup instructions and labels without changing delivery orders', () => {
    expect(orderLabelsForDelivery('PICKUP').SHIPPED).toBe('Listo para recoger');
    expect(orderLabelsForDelivery('PICKUP').DELIVERED).toBe('Retirado');
    expect(orderLabelsForDelivery('DELIVERY').SHIPPED).toBe('Enviado');
    expect(orderLabelsForDelivery(null).SHIPPED).toBe('Enviado');
    expect(customerOrderHint('PAID', 'PICKUP')).toContain('Espera a que figure');
    expect(customerOrderHint('SHIPPED', 'PICKUP')).toContain('listo para recoger');
    expect(customerOrderHint('DELIVERED', 'PICKUP')).toContain('retirado');
    expect(customerOrderHint('PAYMENT_PENDING', 'PICKUP')).toContain('completar el pago');
    expect(customerOrderHint('CANCELLED', 'PICKUP')).toContain('cancelado');
    expect(customerOrderHint('SHIPPED', 'DELIVERY')).toContain('enviado');
  });
  it('explains next steps without presenting unknown or pending states as paid', () => {
    expect(customerOrderHint('PAYMENT_PENDING')).toContain('completar el pago');
    expect(customerOrderHint('PAID')).toContain('pago está confirmado');
    expect(customerOrderHint('EXPIRED')).toContain('reserva venció');
    expect(customerOrderHint('CANCELLED')).toContain('pedido está cancelado');
    expect(customerOrderHint('NEW_STATE')).toBe(
      'Consulta el estado informado y contacta al equipo si necesitas ayuda.',
    );
  });
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
    const summary = accountSummary([{ id: '1', status: 'EXPIRED', total: '80.00', details: [] }]);
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
  const order = (id: string, status: string, total: number) => ({
    id,
    status,
    total: total.toFixed(2),
    details: [],
  });
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
