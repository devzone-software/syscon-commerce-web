/** Order and payment states defined by order-service and payment-service. */
export const orderStatusLabels: Record<string, string> = {
  CREATED: 'Creado',
  PAYMENT_PENDING: 'Pago pendiente',
  PAID: 'Pagado',
  PROCESSING: 'En preparación',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

/** Forward path of order-service (OrderService.transition); CANCELLED is only allowed before payment. */
export const orderFlow = ['PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const nextStatus: Record<string, string> = {
  PAID: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

/** Transitions an operator can request through PATCH /orders/{id}/status/{status}. */
export function allowedTransitions(status: string): string[] {
  const options = nextStatus[status] ? [nextStatus[status]] : [];
  if (status === 'CREATED' || status === 'PAYMENT_PENDING') options.push('CANCELLED');
  return options;
}

export const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente de confirmación',
  APPROVED: 'Aprobado',
};

export const statusLabel = (labels: Record<string, string>, status: string) =>
  labels[status] ?? status;

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (['PAID', 'DELIVERED', 'APPROVED', 'ACCEPTED', 'SUCCEEDED'].includes(status)) return 'success';
  if (['CANCELLED', 'REJECTED', 'FAILED'].includes(status)) return 'danger';
  if (['PAYMENT_PENDING', 'PENDING', 'DRAFT', 'RUNNING'].includes(status)) return 'warning';
  return 'info';
}

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();

/** ScrapingJob states set by supplier-service. */
export const supplierJobLabels: Record<string, string> = {
  RUNNING: 'En ejecución',
  SUCCEEDED: 'Completado',
  FAILED: 'Fallido',
};

export const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '—';
