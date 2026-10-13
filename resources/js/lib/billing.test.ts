import { describe, expect, it } from 'vitest';
import {
  billingFromProfile,
  billingPayload,
  invoiceTypeLabel,
  isValidRuc,
  seriesFor,
  seriesPrefix,
  validateBilling,
  validateInvoice,
  type BillingForm,
  type InvoiceInput,
} from './billing';

const boleta: InvoiceInput = {
  orderId: '0b7f1c2e-8a4d-4f5e-9c1b-2d3e4f5a6b7c',
  type: '03',
  series: '',
  customerDocumentType: '1',
  customerDocumentNumber: '12345678',
  customerName: 'Cliente',
  referencedSerialNumber: '',
};

describe('invoice rules', () => {
  it('accepts a boleta with the automatic or a chosen series', () => {
    expect(validateInvoice(boleta)).toEqual({});
    expect(validateInvoice({ ...boleta, series: 'B002' })).toEqual({});
  });
  it('checks the series format and prefix per document type', () => {
    expect(validateInvoice({ ...boleta, series: 'B001-1' }).series).toBeDefined();
    expect(validateInvoice({ ...boleta, series: 'F001' }).series).toMatch(/B/);
    expect(
      validateInvoice({ ...boleta, type: '07', referencedSerialNumber: 'F001-3', series: 'BC01' })
        .series,
    ).toMatch(/F/);
  });
  it('lists the active series the platform would use', () => {
    const row = (id: number, type: string, series: string, active = true) => ({
      id,
      type,
      series,
      active,
      lastNumber: 0,
      nextNumber: `${series}-1`,
    });
    const all = [
      row(1, '03', 'B001'),
      row(2, '03', 'B002', false),
      row(3, '01', 'F001'),
      row(4, '07', 'FC01'),
      row(5, '07', 'BC01'),
    ];
    expect(seriesFor(all, '03').map((item) => item.series)).toEqual(['B001']);
    expect(seriesFor(all, '07', 'b001-4').map((item) => item.series)).toEqual(['BC01']);
    expect(seriesFor(all, '07').map((item) => item.series)).toEqual(['FC01', 'BC01']);
    expect(seriesPrefix('07', 'nope')).toBeNull();
  });
  it('requires RUC for facturas and checks document lengths', () => {
    const factura = { ...boleta, type: '01' };
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
