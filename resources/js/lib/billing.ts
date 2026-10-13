import type { Billing, DocumentType, Profile } from '../types';

/** Document types accepted by invoice-service (SUNAT catalog 01). */
export const invoiceTypes = [
  { value: '03', label: 'Boleta de venta', prefix: 'B' },
  { value: '01', label: 'Factura', prefix: 'F' },
  { value: '07', label: 'Nota de crédito', prefix: '' },
  { value: '08', label: 'Nota de débito', prefix: '' },
] as const;

/** Customer identity documents (SUNAT catalog 06) allowed by the BFF. */
export const documentTypes = [
  { value: '1', label: 'DNI', length: 8 },
  { value: '6', label: 'RUC', length: 11 },
  { value: '4', label: 'Carné de extranjería', length: 0 },
  { value: '7', label: 'Pasaporte', length: 0 },
] as const;

export const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  FAILED: 'Error de envío',
};

export const invoiceTypeLabel = (type: string) =>
  invoiceTypes.find((item) => item.value === type)?.label ?? type;

export type InvoiceInput = {
  orderId: string;
  type: string;
  serialNumber: string;
  customerDocumentType: string;
  customerDocumentNumber: string;
  customerName: string;
  referencedSerialNumber: string;
};

const SERIAL = /^[FB][A-Z0-9]{3}-[1-9][0-9]{0,7}$/;

/** Same checks as InvoiceService.create, plus the document length and factura/RUC rule. */
export function validateInvoice(input: InvoiceInput): Partial<Record<keyof InvoiceInput, string>> {
  const errors: Partial<Record<keyof InvoiceInput, string>> = {};
  const serial = input.serialNumber.trim().toUpperCase();
  if (!SERIAL.test(serial))
    errors.serialNumber = 'Usa el formato serie-correlativo, por ejemplo B001-25 o F001-8.';
  else if (input.type === '01' && !serial.startsWith('F'))
    errors.serialNumber = 'Las facturas usan series que empiezan con F.';
  else if (input.type === '03' && !serial.startsWith('B'))
    errors.serialNumber = 'Las boletas usan series que empiezan con B.';
  if (
    ['07', '08'].includes(input.type) &&
    !SERIAL.test(input.referencedSerialNumber.trim().toUpperCase())
  )
    errors.referencedSerialNumber = 'Indica el comprobante que se modifica (serie-correlativo).';
  const document = documentTypes.find((item) => item.value === input.customerDocumentType);
  const number = input.customerDocumentNumber.trim();
  if (!document) errors.customerDocumentType = 'Selecciona el tipo de documento.';
  else if (!number) errors.customerDocumentNumber = 'Ingresa el número de documento.';
  else if (document.length && !new RegExp(`^\\d{${document.length}}$`).test(number))
    errors.customerDocumentNumber = `El ${document.label} tiene ${document.length} dígitos.`;
  else if (document.value === '6' && !isValidRuc(number))
    errors.customerDocumentNumber = 'El RUC no es válido (dígito verificador).';
  if (input.type === '01' && input.customerDocumentType !== '6')
    errors.customerDocumentType = 'La factura requiere el RUC del cliente.';
  if (!input.customerName.trim()) errors.customerName = 'Ingresa el nombre o la razón social.';
  return errors;
}

/** RUC: 11 digits, prefix 10/15/17/20 and SUNAT modulo-11 check digit (same rule as the platform). */
export function isValidRuc(ruc: string) {
  if (!/^(10|15|17|20)\d{9}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(ruc[index]) * weight, 0);
  return (11 - (sum % 11)) % 10 === Number(ruc[10]);
}

/** Format of each identity document (SUNAT catalog 06), mirroring BillingData on the platform. */
export function documentError(documentType: string, number: string): string | null {
  if (documentType === '1') return /^\d{8}$/.test(number) ? null : 'El DNI tiene 8 dígitos.';
  if (documentType === '6') {
    if (!/^(10|15|17|20)\d{9}$/.test(number))
      return 'El RUC tiene 11 dígitos y empieza con 10, 15, 17 o 20.';
    return isValidRuc(number) ? null : 'El RUC no es válido: revisa los dígitos.';
  }
  if (documentType === '4' || documentType === '7')
    return /^[A-Z0-9]{6,12}$/.test(number) ? null : 'Usa de 6 a 12 letras o números.';
  return 'Selecciona el tipo de documento.';
}

export const normalizeDocument = (value: string) => value.replace(/\s+/g, '').toUpperCase();

/** Checkout form: the billing block the order keeps as a copy. */
export type BillingForm = {
  type: '01' | '03';
  documentType: '1' | '4' | '6' | '7';
  documentNumber: string;
  name: string;
  address: string;
};

/** Documents accepted for a boleta; a factura always uses RUC. */
export const boletaDocuments = documentTypes.filter((item) => item.value !== '6');

export function validateBilling(form: BillingForm): Partial<Record<keyof BillingForm, string>> {
  const errors: Partial<Record<keyof BillingForm, string>> = {};
  if (form.type === '01' && form.documentType !== '6')
    errors.documentType = 'La factura requiere el RUC de la empresa.';
  const number = normalizeDocument(form.documentNumber);
  if (!number) errors.documentNumber = 'Ingresa el número de documento.';
  else {
    const error = documentError(form.documentType, number);
    if (error) errors.documentNumber = error;
  }
  if (form.name.trim().length < 2)
    errors.name =
      form.type === '01' ? 'Ingresa la razón social.' : 'Ingresa el nombre del cliente.';
  if (form.address.trim().length > 255) errors.address = 'La dirección es demasiado larga.';
  return errors;
}

/** Payload sent to the platform: trimmed values, document without spaces, empty address as null. */
export function billingPayload(form: BillingForm): Billing {
  return {
    type: form.type,
    documentType: form.documentType,
    documentNumber: normalizeDocument(form.documentNumber),
    name: form.name.trim().replace(/\s+/g, ' '),
    address: form.address.trim() || null,
  };
}

const profileDocument: Record<DocumentType, BillingForm['documentType']> = {
  DNI: '1',
  CE: '4',
  RUC: '6',
  PASAPORTE: '7',
};

/**
 * Initial checkout values from the stored profile: a RUC account starts with factura (the
 * razón social is not stored, so it stays empty); anyone else starts with a boleta in their name.
 */
export function billingFromProfile(profile: Partial<Profile> | null): BillingForm {
  const documentType = profile?.documentType ? profileDocument[profile.documentType] : '1';
  const person = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  return documentType === '6'
    ? {
        type: '01',
        documentType,
        documentNumber: profile?.documentNumber ?? '',
        name: '',
        address: '',
      }
    : {
        type: '03',
        documentType,
        documentNumber: profile?.documentNumber ?? '',
        name: person,
        address: '',
      };
}

export const documentLabel = (code: string) =>
  documentTypes.find((item) => item.value === code)?.label ?? code;

/** Rows shown in the order detail; older orders without billing say so instead of guessing. */
export function billingRows(billing: Billing | null | undefined) {
  if (!billing) return [{ label: 'Comprobante', value: 'Sin datos de facturación registrados' }];
  return [
    { label: 'Comprobante', value: invoiceTypeLabel(billing.type) },
    {
      label: 'Documento',
      value: `${documentLabel(billing.documentType)} ${billing.documentNumber}`,
    },
    { label: billing.type === '01' ? 'Razón social' : 'Cliente', value: billing.name },
    ...(billing.address ? [{ label: 'Dirección fiscal', value: billing.address }] : []),
  ];
}
