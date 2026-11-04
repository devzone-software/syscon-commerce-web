import type { Delivery, DeliveryMethod, DeliveryOptions, Profile } from '../types';

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  PICKUP: 'Retiro en tienda',
  DELIVERY: 'Envío a domicilio',
};

export type DeliveryForm = {
  method: DeliveryMethod;
  contactName: string;
  contactPhone: string;
  address: string;
  district: string;
  reference: string;
};

const squash = (value: string) => value.trim().replace(/\s+/g, ' ');

export function deliveryFromProfile(profile: Partial<Profile> | null): DeliveryForm {
  return {
    method: 'PICKUP',
    contactName: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim(),
    contactPhone: profile?.phone ?? '',
    address: '',
    district: '',
    reference: '',
  };
}

/** Same rules as DeliveryData on the platform. */
export function validateDelivery(
  form: DeliveryForm,
  options: DeliveryOptions | null,
): Partial<Record<keyof DeliveryForm, string>> {
  const errors: Partial<Record<keyof DeliveryForm, string>> = {};
  if (form.method === 'DELIVERY' && options && !options.delivery.enabled)
    errors.method = 'El envío a domicilio no está disponible por ahora.';
  if (squash(form.contactName).length < 2) errors.contactName = 'Ingresa quién recibe o retira.';
  if (!/^9\d{8}$/.test(form.contactPhone.replace(/\s+/g, '')))
    errors.contactPhone = 'Ingresa un celular de 9 dígitos que empiece con 9.';
  if (form.method === 'DELIVERY') {
    if (squash(form.address).length < 5) errors.address = 'Ingresa la dirección de entrega.';
    if (squash(form.district).length < 2) errors.district = 'Ingresa el distrito.';
  }
  return errors;
}

export function deliveryPayload(form: DeliveryForm): Delivery {
  const home = form.method === 'DELIVERY';
  return {
    method: form.method,
    contactName: squash(form.contactName),
    contactPhone: form.contactPhone.replace(/\s+/g, ''),
    address: home ? squash(form.address) : null,
    district: home ? squash(form.district) : null,
    reference: home ? squash(form.reference) || null : null,
  };
}

/** Cost the platform will charge for the chosen method, or null while the options load. */
export function deliveryCost(method: DeliveryMethod, options: DeliveryOptions | null) {
  if (!options) return null;
  const cost = method === 'DELIVERY' ? options.delivery.cost : options.pickup.cost;
  return cost === null ? null : Number(cost);
}

/** Rows shown in the order detail; older orders say the delivery was not recorded. */
export function deliveryRows(delivery: Delivery | null | undefined) {
  if (!delivery) return [{ label: 'Entrega', value: 'Coordinación con un asesor' }];
  const rows = [
    { label: 'Entrega', value: deliveryMethodLabels[delivery.method] },
    { label: 'Contacto', value: delivery.contactName + ' · ' + delivery.contactPhone },
  ];
  if (delivery.method === 'DELIVERY')
    rows.push({
      label: 'Dirección',
      value: [delivery.address, delivery.district].filter(Boolean).join(', '),
    });
  if (delivery.reference) rows.push({ label: 'Referencia', value: delivery.reference });
  return rows;
}

type KeyStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const KEY_STORAGE = 'syscon.checkout.attempt';

const newKey = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

const sessionStore = (): KeyStore | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

/**
 * Idempotency key for one purchase attempt. Retrying the same payload (double click, network
 * error, page reload) reuses the key, so the platform returns the order already created instead
 * of reserving stock twice; any change in the payload starts a new attempt.
 */
export function checkoutAttemptKey(payload: unknown, store: KeyStore | null = sessionStore()) {
  const fingerprint = JSON.stringify(payload);
  try {
    const saved = JSON.parse(store?.getItem(KEY_STORAGE) ?? 'null') as {
      fingerprint: string;
      key: string;
    } | null;
    if (saved?.fingerprint === fingerprint && saved.key) return saved.key;
  } catch {
    // Unreadable storage only means the attempt starts with a new key.
  }
  const key = newKey();
  try {
    store?.setItem(KEY_STORAGE, JSON.stringify({ fingerprint, key }));
  } catch {
    // Without storage the key still covers retries within this page.
  }
  return key;
}

/** Called once the order exists: the next purchase must not reuse this key. */
export function forgetCheckoutAttempt(store: KeyStore | null = sessionStore()) {
  try {
    store?.removeItem(KEY_STORAGE);
  } catch {
    // Nothing to clean up.
  }
}
