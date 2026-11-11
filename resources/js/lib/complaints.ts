import type { Complaint, ComplaintInput } from '../types';
import { isEmail } from './validation';

export const complaintTypeLabels: Record<ComplaintInput['type'], string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
};

/** What each type means, shown next to the choice as the regulation asks. */
export const complaintTypeHelp: Record<ComplaintInput['type'], string> = {
  RECLAMO: 'Disconformidad con el producto o servicio que compraste.',
  QUEJA: 'Malestar por la atención recibida, no relacionado con el producto o servicio.',
};

export const complaintStatusLabels: Record<Complaint['status'], string> = {
  PENDING: 'Pendiente',
  ANSWERED: 'Respondido',
};

export const emptyComplaint = (): ComplaintInput => ({
  type: 'RECLAMO',
  consumerName: '',
  documentType: 'DNI',
  documentNumber: '',
  address: '',
  phone: '',
  email: '',
  guardianName: '',
  itemType: 'PRODUCTO',
  itemDescription: '',
  amount: '',
  orderReference: '',
  detail: '',
  consumerRequest: '',
  accepted: false,
});

/** First problem of the sheet in reading order, or null when it can be sent. */
export function complaintError(sheet: ComplaintInput): string | null {
  if (sheet.consumerName.trim().length < 3) return 'Ingresa tu nombre completo.';
  const doc = sheet.documentNumber.trim();
  if (sheet.documentType === 'DNI' && !/^\d{8}$/.test(doc)) return 'El DNI debe tener 8 dígitos.';
  if (sheet.documentType === 'RUC' && !/^\d{11}$/.test(doc)) return 'El RUC debe tener 11 dígitos.';
  if (!/^[A-Za-z0-9-]{6,20}$/.test(doc)) return 'Revisa el número de documento.';
  if (sheet.address.trim().length < 5) return 'Ingresa tu domicilio.';
  if (!/^[0-9 +()-]{6,30}$/.test(sheet.phone.trim())) return 'Ingresa un teléfono válido.';
  if (!isEmail(sheet.email)) return 'Ingresa un correo válido: ahí te enviaremos la copia.';
  if (sheet.itemDescription.trim().length < 3) return 'Describe el producto o servicio.';
  if (sheet.amount && !/^\d+(\.\d{1,2})?$/.test(sheet.amount.trim()))
    return 'El monto debe ser un número, por ejemplo 199.90.';
  if (sheet.detail.trim().length < 10) return 'Cuéntanos con más detalle qué pasó.';
  if (sheet.consumerRequest.trim().length < 5) return 'Indica qué solución esperas.';
  if (!sheet.accepted) return 'Confirma que los datos son correctos para registrar la hoja.';
  return null;
}

/** Sheet ready for the API: trimmed text and no empty optional fields. */
export function complaintPayload(sheet: ComplaintInput): ComplaintInput {
  const optional = (value?: string) => (value?.trim() ? value.trim() : undefined);
  return {
    ...sheet,
    consumerName: sheet.consumerName.trim(),
    documentNumber: sheet.documentNumber.trim().toUpperCase(),
    address: sheet.address.trim(),
    phone: sheet.phone.trim(),
    email: sheet.email.trim(),
    itemDescription: sheet.itemDescription.trim(),
    detail: sheet.detail.trim(),
    consumerRequest: sheet.consumerRequest.trim(),
    guardianName: optional(sheet.guardianName),
    amount: optional(sheet.amount),
    orderReference: optional(sheet.orderReference),
  };
}

/** "2026-11-30" → "30/11/2026", without shifting the day by time zone. */
export const formatDay = (value: string) => value.split('-').reverse().join('/');
