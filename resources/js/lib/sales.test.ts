import { describe, expect, it } from 'vitest';
import {
  billingForCustomer,
  cashChange,
  gatewayReturnNotice,
  paymentError,
  paymentMethodLabel,
} from './sales';

describe('direct sale payment', () => {
  it('requires the operation number except for cash', () => {
    expect(paymentError({ method: 'YAPE', reference: ' ', received: '' }, 20)).toMatch(/operación/);
    expect(paymentError({ method: 'CARD', reference: 'V-123', received: '' }, 20)).toBeNull();
    expect(paymentError({ method: 'CASH', reference: '', received: '' }, 20)).toBeNull();
  });
  it('checks the cash received and computes the change in cents', () => {
    expect(paymentError({ method: 'CASH', reference: '', received: '15' }, 20.3)).toMatch(
      /no cubre/,
    );
    expect(paymentError({ method: 'CASH', reference: '', received: '20.301' }, 20.3)).toMatch(
      /2 decimales/,
    );
    expect(paymentError({ method: 'CASH', reference: '', received: '20.30' }, 20.3)).toBeNull();
    expect(cashChange('50', 20.3)).toBe(29.7);
    expect(cashChange('0.3', 0.1 + 0.2)).toBe(0);
    expect(cashChange('10', 20.3)).toBe(0);
  });
  it('labels counter and web payment methods', () => {
    expect(paymentMethodLabel('YAPE')).toBe('Yape');
    expect(paymentMethodLabel('MANUAL')).toMatch(/web/);
  });
  it('prefills billing from a registered customer', () => {
    expect(
      billingForCustomer({ name: 'Luz Paz', documentType: 'DNI', documentNumber: '87654321' }),
    ).toMatchObject({
      type: '03',
      documentType: '1',
      documentNumber: '87654321',
      name: 'Luz Paz',
    });
    expect(
      billingForCustomer({ name: 'Luz', documentType: 'RUC', documentNumber: '20123456786' }),
    ).toMatchObject({
      type: '01',
      documentType: '6',
      name: '',
    });
  });
});

describe('gateway return', () => {
  it('only confirms when the backend reports the order as paid', () => {
    expect(gatewayReturnNotice('PAID').tone).toBe('success');
    expect(gatewayReturnNotice('PAYMENT_PENDING').tone).toBe('info');
    expect(gatewayReturnNotice(null).text).toMatch(/intentar de nuevo/);
    expect(paymentMethodLabel('SANDBOX')).toMatch(/prueba/);
  });
});
