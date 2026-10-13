import type { Order } from '../types';

/** Order and payment states defined by order-service and payment-service. */
export const orderStatusLabels: Record<string, string> = {
  CREATED: 'Creado',
  PAYMENT_PENDING: 'Pago pendiente',
  PAID: 'Pagado',
  PROCESSING: 'En preparación',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Vencido',
};

/** Tabs of the backoffice orders inbox, in working order; '' lists every state. */
export const orderInboxTabs = [
  '',
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'EXPIRED',
];

/** Forward path of OrderService::transition; CANCELLED and EXPIRED only happen before payment. */
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
  CANCELLED: 'Anulado',
};

/** Entries of the order history (order_events). */
export const orderEventLabels: Record<string, string> = {
  CREATED: 'Pedido registrado',
  PAYMENT_REQUESTED: 'Pago manual solicitado',
  PAYMENT_CONFIRMED: 'Pago confirmado',
  STATUS_CHANGED: 'Cambio de estado',
  EXPIRED: 'Reserva vencida',
};

export const statusLabel = (labels: Record<string, string>, status: string) =>
  labels[status] ?? status;

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (['PAID', 'DELIVERED', 'APPROVED', 'ACCEPTED', 'SUCCEEDED'].includes(status)) return 'success';
  if (['CANCELLED', 'EXPIRED', 'REJECTED', 'FAILED'].includes(status)) return 'danger';
  if (['PAYMENT_PENDING', 'PENDING', 'DRAFT', 'RUNNING'].includes(status)) return 'warning';
  return 'info';
}

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();

/** Share of the forward path already covered, for the "último pedido" progress bar. */
export const orderProgress = (status: string) => {
  const step = orderFlow.indexOf(status);
  return step < 0 ? 0 : Math.round((step / (orderFlow.length - 1)) * 100);
};

const closed = ['DELIVERED', 'CANCELLED', 'EXPIRED'];
/** Figures of the customer dashboard, computed from GET /orders (newest first). */
export function accountSummary(orders: Order[]) {
  const active = orders.filter((order) => !closed.includes(order.status));
  return {
    count: orders.length,
    active: active.length,
    pendingPayment: orders.filter((order) => order.status === 'PAYMENT_PENDING').length,
    // Only confirmed purchases count towards the spent amount.
    spent: orders
      .filter(
        (order) => !['CANCELLED', 'EXPIRED', 'CREATED', 'PAYMENT_PENDING'].includes(order.status),
      )
      .reduce((sum, order) => sum + Number(order.total), 0),
    current: active[0] ?? null,
  };
}

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
