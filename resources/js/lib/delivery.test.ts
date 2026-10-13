import { describe, expect, it } from 'vitest';
import type { DeliveryOptions } from '../types';
import {
  checkoutAttemptKey,
  deliveryCost,
  deliveryFromProfile,
  deliveryPayload,
  deliveryRows,
  forgetCheckoutAttempt,
  validateDelivery,
  type DeliveryForm,
} from './delivery';

const options: DeliveryOptions = {
  pickup: { enabled: true, cost: '0.00', address: 'Av. Principal 100', hours: null },
  delivery: { enabled: true, cost: '15.00', areas: 'Lima Metropolitana' },
};
const pickup: DeliveryForm = {
  method: 'PICKUP',
  contactName: 'Ana Quispe',
  contactPhone: '987654321',
  address: '',
  district: '',
  reference: '',
};
const home: DeliveryForm = {
  ...pickup,
  method: 'DELIVERY',
  address: 'Jr. Las Flores 245',
  district: 'Miraflores',
};

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe('delivery', () => {
  it('validates contact data and the address only for home delivery', () => {
    expect(validateDelivery(pickup, options)).toEqual({});
    expect(validateDelivery(home, options)).toEqual({});
    expect(
      validateDelivery({ ...pickup, contactPhone: '12345' }, options).contactPhone,
    ).toBeDefined();
    const missing = validateDelivery({ ...home, address: '', district: ' ' }, options);
    expect(Object.keys(missing).sort()).toEqual(['address', 'district']);
    const disabled = { ...options, delivery: { enabled: false, cost: null, areas: null } };
    expect(validateDelivery(home, disabled).method).toMatch(/no está disponible/);
  });
  it('drops the address when picking up and normalizes values', () => {
    expect(deliveryPayload({ ...pickup, address: 'X 123', contactPhone: '987 654 321' })).toEqual({
      method: 'PICKUP',
      contactName: 'Ana Quispe',
      contactPhone: '987654321',
      address: null,
      district: null,
      reference: null,
    });
    expect(deliveryPayload({ ...home, reference: '  ' }).reference).toBeNull();
  });
  it('uses the cost published by the platform', () => {
    expect(deliveryCost('PICKUP', options)).toBe(0);
    expect(deliveryCost('DELIVERY', options)).toBe(15);
    expect(deliveryCost('DELIVERY', null)).toBeNull();
  });
  it('prefills the contact from the profile and describes old orders', () => {
    expect(
      deliveryFromProfile({ firstName: 'Ana', lastName: 'Quispe', phone: '987654321' }),
    ).toEqual(pickup);
    expect(deliveryRows(null)[0].value).toMatch(/asesor/);
    expect(
      deliveryRows({ ...deliveryPayload(home), cost: '15.00' }).map((row) => row.label),
    ).toEqual(['Entrega', 'Contacto', 'Dirección']);
  });
  it('reuses the idempotency key while the payload is the same', () => {
    const store = memory();
    const first = checkoutAttemptKey({ items: 1 }, store);
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(checkoutAttemptKey({ items: 1 }, store)).toBe(first);
    const changed = checkoutAttemptKey({ items: 2 }, store);
    expect(changed).not.toBe(first);
    forgetCheckoutAttempt(store);
    expect(checkoutAttemptKey({ items: 2 }, store)).not.toBe(changed);
  });
});
