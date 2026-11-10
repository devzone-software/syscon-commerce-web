import type { DeliveryMethod, Order } from '../types';

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

const customerOrderHints: Record<string, string> = {
  PAYMENT_PENDING:
    'Tu siguiente paso es completar el pago. La confirmación en línea depende de la pasarela; los pagos manuales los verifica el equipo.',
  PAID: 'El pago está confirmado. El equipo coordinará la preparación y entrega del pedido.',
  PROCESSING:
    'Tu pedido está en preparación. Puedes consultar la modalidad de entrega registrada abajo.',
  SHIPPED:
    'Tu pedido figura como enviado. Si necesitas información del despacho, consulta con el equipo.',
  DELIVERED:
    'Tu pedido figura como entregado. Puedes revisar los productos y comprobantes o consultar por soporte.',
  EXPIRED:
    'La reserva venció. Revisa la disponibilidad actual en el catálogo antes de crear otro pedido.',
  CANCELLED:
    'El pedido está cancelado. Si realizaste un abono, consulta su situación con el equipo.',
};

/** The same operational steps represent dispatch or pickup, according to the order. */
export const orderLabelsForDelivery = (method?: DeliveryMethod | null) =>
  method === 'PICKUP'
    ? { ...orderStatusLabels, SHIPPED: 'Listo para recoger', DELIVERED: 'Retirado' }
    : orderStatusLabels;

/** Filters group pickup and delivery orders under the same stored operational state. */
export const orderFilterLabels: Record<string, string> = {
  ...orderStatusLabels,
  SHIPPED: 'Enviado / listo para recoger',
  DELIVERED: 'Entregado / retirado',
};

export function customerOrderHint(status: string, method?: DeliveryMethod | null) {
  if (method === 'PICKUP') {
    if (status === 'PAID')
      return 'Tu pago está confirmado. El equipo preparará tu pedido para retiro en tienda. Espera a que figure como listo para recoger antes de acercarte.';
    if (status === 'PROCESSING')
      return 'Tu pago está confirmado. Estamos preparando tu pedido para retiro en tienda. Espera a que figure como listo para recoger antes de acercarte.';
    if (status === 'SHIPPED')
      return 'Tu pedido está listo para recoger. Revisa los datos de retiro o consulta con el equipo la dirección y el horario antes de acercarte.';
    if (status === 'DELIVERED')
      return 'Tu pedido figura como retirado. Puedes descargar tu comprobante o consultar con soporte.';
  }
  return (
    customerOrderHints[status] ??
    'Consulta el estado informado y contacta al equipo si necesitas ayuda.'
  );
}

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
  REJECTED: 'Rechazado',
  REFUND_REQUIRED: 'Devolución pendiente',
};

/** Entries of the order history (order_events). */
export const orderEventLabels: Record<string, string> = {
  CREATED: 'Pedido registrado',
  STORE_SALE: 'Venta directa registrada',
  PAYMENT_REQUESTED: 'Pago solicitado',
  PAYMENT_CONFIRMED: 'Pago confirmado',
  STATUS_CHANGED: 'Cambio de estado',
  EXPIRED: 'Reserva vencida',
  INVOICE_ACCEPTED: 'Comprobante aceptado por SUNAT',
  CREDIT_NOTE_ACCEPTED: 'Nota de crédito aceptada',
  DEBIT_NOTE_ACCEPTED: 'Nota de débito aceptada',
  NOTIFICATION_RESENT: 'Reintento de aviso',
  PAYMENT_REJECTED: 'Pago en línea rechazado',
  PAYMENT_REFUND_REQUIRED: 'Pago recibido tras cancelar: requiere devolución',
  PAYMENT_DUPLICATE_REFUND_REQUIRED: 'Cobro duplicado: requiere devolución',
  INVOICE_VOIDED: 'Comprobante anulado',
};

/** Customer emails sent for an order. */
export const notificationLabels: Record<string, string> = {
  ORDER_CREATED: 'Pedido recibido',
  PAYMENT_CONFIRMED: 'Pago confirmado',
  INVOICE_AVAILABLE: 'Comprobante disponible',
};

export const notificationStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  SENDING: 'Enviando',
  SENT: 'Procesado',
  FAILED: 'Falló',
};

export const statusLabel = (labels: Record<string, string>, status: string) =>
  labels[status] ?? status;

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (['PAID', 'DELIVERED', 'APPROVED', 'ACCEPTED', 'SUCCEEDED', 'ACTIVE'].includes(status))
    return 'success';
  if (['CANCELLED', 'EXPIRED', 'REJECTED', 'FAILED', 'SUSPENDED'].includes(status)) return 'danger';
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
