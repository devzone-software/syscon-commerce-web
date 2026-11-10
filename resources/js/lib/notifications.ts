import type { OrderNotification } from '../types';
import { notificationStatusLabels, statusLabel } from './orders';

export function notificationResult(item: Pick<OrderNotification, 'status'>) {
  if (item.status !== 'SENT') return statusLabel(notificationStatusLabels, item.status);
  return 'Procesado';
}
