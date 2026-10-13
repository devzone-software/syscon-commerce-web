import { describe, expect, it } from 'vitest';
import {
  billingFromProfile,
  billingPayload,
  invoiceTypeLabel,
  isValidRuc,
  validateBilling,
  validateInvoice,
  type BillingForm,
  type InvoiceInput,
} from './billing';

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
        customerDocumentNumber: '20123456786',
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

const boletaForm: BillingForm = {
  type: '03',
  documentType: '1',
  documentNumber: '12345678',
  name: 'Ana Quispe',
  address: '',
};

describe('checkout billing', () => {
  it('validates the RUC check digit', () => {
    expect(isValidRuc('20123456786')).toBe(true);
    expect(isValidRuc('20123456789')).toBe(false);
    expect(isValidRuc('30123456786')).toBe(false);
    expect(
      validateInvoice({
        ...boleta,
        type: '01',
        serialNumber: 'F001-1',
        customerDocumentType: '6',
        customerDocumentNumber: '20123456789',
      }).customerDocumentNumber,
    ).toMatch(/RUC/);
  });
  it('accepts a boleta and requires RUC and razón social for a factura', () => {
    expect(validateBilling(boletaForm)).toEqual({});
    expect(validateBilling({ ...boletaForm, documentNumber: '1234' }).documentNumber).toMatch(/8/);
    const factura = validateBilling({ ...boletaForm, type: '01', name: '' });
    expect(factura.documentType).toMatch(/RUC/);
    expect(factura.name).toMatch(/razón social/);
    expect(
      validateBilling({
        ...boletaForm,
        type: '01',
        documentType: '6',
        documentNumber: '2012 3456 786',
      }),
    ).toEqual({});
    expect(
      validateBilling({ ...boletaForm, documentType: '7', documentNumber: 'ab-1' }).documentNumber,
    ).toBeDefined();
  });
  it('builds the payload with normalized values', () => {
    expect(
      billingPayload({
        ...boletaForm,
        documentType: '7',
        documentNumber: ' ab 123456 ',
        name: '  Ana   Quispe ',
      }),
    ).toEqual({
      type: '03',
      documentType: '7',
      documentNumber: 'AB123456',
      name: 'Ana Quispe',
      address: null,
    });
  });
  it('prefills from the profile: RUC accounts start with factura', () => {
    expect(
      billingFromProfile({
        firstName: 'Ana',
        lastName: 'Quispe',
        documentType: 'DNI',
        documentNumber: '12345678',
      }),
    ).toEqual(boletaForm);
    expect(
      billingFromProfile({ firstName: 'Luis', documentType: 'RUC', documentNumber: '20123456786' }),
    ).toMatchObject({
      type: '01',
      documentType: '6',
      name: '',
    });
    expect(billingFromProfile(null)).toMatchObject({
      type: '03',
      documentType: '1',
      documentNumber: '',
    });
  });
});
