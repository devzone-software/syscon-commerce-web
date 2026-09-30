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
  if (input.type === '01' && input.customerDocumentType !== '6')
    errors.customerDocumentType = 'La factura requiere el RUC del cliente.';
  if (!input.customerName.trim()) errors.customerName = 'Ingresa el nombre o la razón social.';
  return errors;
}
