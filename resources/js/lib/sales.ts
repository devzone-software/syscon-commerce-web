/** Payment methods accepted at the counter (SaleController::METHODS). */
export const paymentMethods = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'TRANSFER', label: 'Transferencia' },
] as const;

export type PaymentMethod = (typeof paymentMethods)[number]['value'];

export const paymentMethodLabel = (method: string) =>
  paymentMethods.find((item) => item.value === method)?.label ??
  (method === 'MANUAL' ? 'Pago manual (web)' : method);

export type SalePayment = { method: PaymentMethod; reference: string; received: string };

/** Same rule as the platform: every method except cash needs the operation reference. */
export function paymentError(payment: SalePayment, total: number): string | null {
  if (payment.method !== 'CASH')
    return payment.reference.trim() ? null : 'Ingresa el número de operación del pago.';
  if (payment.received.trim() === '') return null;
  const received = Number(payment.received);
  if (!/^\d+(\.\d{1,2})?$/.test(payment.received.trim()))
    return 'El monto recibido tiene hasta 2 decimales.';
  return received + 0.000001 < total ? 'El monto recibido no cubre el total.' : null;
}

/** Change to give back for a cash payment, in cents to avoid floating point drift. */
export function cashChange(received: string, total: number): number {
  const cents = Math.round(Number(received) * 100) - Math.round(total * 100);
  return cents > 0 ? cents / 100 : 0;
}

/** Billing defaults for a registered customer: boleta in their name, or factura if RUC. */
export function billingForCustomer(customer: {
  name: string | null;
  documentType: string | null;
  documentNumber: string | null;
}) {
  const codes: Record<string, '1' | '4' | '6' | '7'> = {
    DNI: '1',
    CE: '4',
    RUC: '6',
    PASAPORTE: '7',
  };
  const documentType = codes[customer.documentType ?? ''] ?? '1';
  return {
    type: documentType === '6' ? ('01' as const) : ('03' as const),
    documentType,
    documentNumber: customer.documentNumber ?? '',
    name: documentType === '6' ? '' : (customer.name ?? ''),
    address: '',
  };
}
