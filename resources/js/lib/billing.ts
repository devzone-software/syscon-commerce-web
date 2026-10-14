import type { Billing, DocumentType, InvoiceSeries, Profile } from '../types';

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

/** How a note gets its lines: the whole document, returned products or a single amount. */
export type NoteMode = 'full' | 'items' | 'amount';

/** Reasons the platform supports: catalog 09 for credit notes, catalog 10 for debit notes. */
export const noteReasons: Record<
  '07' | '08',
  { value: string; label: string; mode: NoteMode; help: string }[]
> = {
  '07': [
    {
      value: '01',
      label: 'Anulación de la operación',
      mode: 'full',
      help: 'Revierte todo el comprobante. Al ser aceptada, el pedido puede volver a facturarse.',
    },
    {
      value: '02',
      label: 'Anulación por error en el RUC',
      mode: 'full',
      help: 'Revierte todo el comprobante para emitir otro con el documento correcto.',
    },
    {
      value: '06',
      label: 'Devolución total',
      mode: 'full',
      help: 'El cliente devolvió todos los productos. El reingreso al stock lo registra inventario.',
    },
    {
      value: '07',
      label: 'Devolución por ítem',
      mode: 'items',
      help: 'Acredita solo las unidades devueltas, al precio facturado.',
    },
    {
      value: '09',
      label: 'Disminución en el valor',
      mode: 'amount',
      help: 'Descuento posterior a la venta, por un importe con IGV.',
    },
  ],
  '08': [
    {
      value: '01',
      label: 'Intereses por mora',
      mode: 'amount',
      help: 'Importe con IGV que se cobra adicionalmente.',
    },
    {
      value: '02',
      label: 'Aumento en el valor',
      mode: 'amount',
      help: 'Importe con IGV que se cobra adicionalmente.',
    },
    {
      value: '03',
      label: 'Penalidades / otros conceptos',
      mode: 'amount',
      help: 'Importe con IGV que se cobra adicionalmente.',
    },
  ],
};

export const noteReasonFor = (type: string, code: string | null | undefined) =>
  type === '07' || type === '08'
    ? noteReasons[type].find((item) => item.value === code)
    : undefined;

/** "(18%)" from the stored rate "0.1800". */
export const taxPercent = (rate: string) => `(${Number((Number(rate) * 100).toFixed(2))}%)`;

export type InvoiceInput = {
  orderId: string;
  type: string;
  /** One of the configured series; '' lets the platform pick the first active one. */
  series: string;
  customerDocumentType: string;
  customerDocumentNumber: string;
  customerName: string;
  referencedSerialNumber: string;
  /** Notes only. */
  noteCode?: string;
  noteReason?: string;
  /** Amount with IGV, for notes in 'amount' mode. */
  amount?: string;
  /** Returned quantity per product id, for 'items' mode. */
  items?: Record<string, string>;
};

const SERIAL = /^[FB][A-Z0-9]{3}-[1-9][0-9]{0,7}$/;
export const SERIES = /^[FB][A-Z0-9]{3}$/;

/** First letter of the series: F for facturas, B for boletas; notes follow the document they modify. */
export function seriesPrefix(type: string, referencedSerialNumber = ''): string | null {
  if (type === '01') return 'F';
  if (type === '03') return 'B';
  const referenced = referencedSerialNumber.trim().toUpperCase();
  return SERIAL.test(referenced) ? referenced[0] : null;
}

/** Active series the platform would accept for this document, in the order it picks them. */
export function seriesFor(series: InvoiceSeries[], type: string, referencedSerialNumber = '') {
  const prefix = seriesPrefix(type, referencedSerialNumber);
  return series.filter(
    (item) => item.active && item.type === type && (!prefix || item.series.startsWith(prefix)),
  );
}

/** Same checks as InvoiceController::store, plus the document length and factura/RUC rule. */
export function validateInvoice(input: InvoiceInput): Partial<Record<keyof InvoiceInput, string>> {
  const errors: Partial<Record<keyof InvoiceInput, string>> = {};
  const prefix = seriesPrefix(input.type, input.referencedSerialNumber);
  if (input.series && !SERIES.test(input.series))
    errors.series = 'La serie tiene 4 caracteres y empieza con F o B.';
  else if (input.series && prefix && !input.series.startsWith(prefix))
    errors.series = `Este comprobante usa una serie que empieza con ${prefix}.`;
  if (
    ['07', '08'].includes(input.type) &&
    !SERIAL.test(input.referencedSerialNumber.trim().toUpperCase())
  )
    errors.referencedSerialNumber = 'Indica el comprobante que se modifica (serie-correlativo).';
  if (input.type === '07' || input.type === '08') {
    const reason = noteReasonFor(input.type, input.noteCode);
    if (!reason) errors.noteCode = 'Selecciona el motivo de la nota.';
    if (!input.noteReason?.trim()) errors.noteReason = 'Describe el sustento de la nota.';
    else if (input.noteReason.trim().length > 250)
      errors.noteReason = 'El sustento admite hasta 250 caracteres.';
    if (reason?.mode === 'amount' && !/^\d{1,12}(\.\d{1,2})?$/.test(input.amount?.trim() ?? ''))
      errors.amount = 'Ingresa un importe con hasta 2 decimales.';
    else if (reason?.mode === 'amount' && Number(input.amount) <= 0)
      errors.amount = 'El importe debe ser mayor que cero.';
    const quantities = Object.values(input.items ?? {}).filter((value) => value.trim() !== '');
    if (reason?.mode === 'items' && quantities.some((value) => !/^\d+$/.test(value.trim())))
      errors.items = 'Las cantidades devueltas son números enteros.';
    else if (reason?.mode === 'items' && !quantities.some((value) => Number(value) > 0))
      errors.items = 'Indica al menos una unidad devuelta.';
  }
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

/** Note fields sent to the platform: only what the chosen reason uses. */
export function notePayload(input: InvoiceInput) {
  const reason = noteReasonFor(input.type, input.noteCode);
  if (!reason) return {};
  return {
    noteCode: reason.value,
    noteReason: input.noteReason?.trim() ?? '',
    ...(reason.mode === 'amount' ? { amount: input.amount?.trim() } : {}),
    ...(reason.mode === 'items'
      ? {
          items: Object.entries(input.items ?? {})
            .filter(([, quantity]) => Number(quantity) > 0)
            .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) })),
        }
      : {}),
  };
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
