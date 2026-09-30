import { describe, expect, it } from 'vitest';
import { invoiceTypeLabel, validateInvoice, type InvoiceInput } from './billing';

const boleta: InvoiceInput = {
  orderId: '0b7f1c2e-8a4d-4f5e-9c1b-2d3e4f5a6b7c',
  type: '03',
  serialNumber: 'b001-12',
  customerDocumentType: '1',
  customerDocumentNumber: '12345678',
  customerName: 'Cliente',
  referencedSerialNumber: '',
};

describe('invoice rules', () => {
  it('accepts a valid boleta and normalizes the series case', () => {
    expect(validateInvoice(boleta)).toEqual({});
  });
  it('checks the series format and prefix per document type', () => {
    expect(validateInvoice({ ...boleta, serialNumber: 'B001-0' }).serialNumber).toBeDefined();
    expect(validateInvoice({ ...boleta, serialNumber: 'F001-1' }).serialNumber).toMatch(/boletas/);
  });
  it('requires RUC for facturas and checks document lengths', () => {
    const factura = { ...boleta, type: '01', serialNumber: 'F001-1' };
    expect(validateInvoice(factura).customerDocumentType).toMatch(/RUC/);
    expect(
      validateInvoice({ ...factura, customerDocumentType: '6', customerDocumentNumber: '123' })
        .customerDocumentNumber,
    ).toMatch(/11/);
    expect(
      validateInvoice({
        ...factura,
        customerDocumentType: '6',
        customerDocumentNumber: '20123456789',
      }),
    ).toEqual({});
  });
  it('requires the referenced document for credit and debit notes', () => {
    expect(validateInvoice({ ...boleta, type: '07' }).referencedSerialNumber).toBeDefined();
    expect(validateInvoice({ ...boleta, type: '07', referencedSerialNumber: 'B001-3' })).toEqual(
      {},
    );
    expect(invoiceTypeLabel('07')).toBe('Nota de crédito');
  });
});
