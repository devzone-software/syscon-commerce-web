import { describe, expect, it } from 'vitest';
import {
  billingFromProfile,
  billingRows,
  rucStatusText,
  billingPayload,
  invoiceTypeLabel,
  invoiceFileUrl,
  invoiceValidity,
  isValidRuc,
  notePayload,
  noteReasons,
  sendDeadlineNotice,
  seriesFor,
  seriesPrefix,
  taxPercent,
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
    const credit = {
      ...boleta,
      type: '07',
      referencedSerialNumber: 'B001-3',
      noteCode: '01',
      noteReason: 'Anulación de la operación',
    };
    expect(validateInvoice(credit)).toEqual({});
    expect(invoiceTypeLabel('07')).toBe('Nota de crédito');
  });
  it('requires a supported reason and the data each reason uses', () => {
    const credit = { ...boleta, type: '07', referencedSerialNumber: 'B001-3' };
    expect(validateInvoice(credit).noteCode).toBeDefined();
    expect(validateInvoice({ ...credit, noteCode: '03', noteReason: 'x' }).noteCode).toBeDefined();
    expect(
      validateInvoice({ ...credit, noteCode: '01', noteReason: ' ' }).noteReason,
    ).toBeDefined();
    const decrease = { ...credit, noteCode: '09', noteReason: 'Descuento' };
    expect(validateInvoice(decrease).amount).toBeDefined();
    expect(validateInvoice({ ...decrease, amount: '1.234' }).amount).toBeDefined();
    expect(validateInvoice({ ...decrease, amount: '0' }).amount).toBeDefined();
    expect(validateInvoice({ ...decrease, amount: '10.15' })).toEqual({});
    const items = { ...credit, noteCode: '07', noteReason: 'Devolución' };
    expect(validateInvoice({ ...items, items: { a: '' } }).items).toBeDefined();
    expect(validateInvoice({ ...items, items: { a: '1.5' } }).items).toBeDefined();
    expect(validateInvoice({ ...items, items: { a: '0', b: '2' } })).toEqual({});
    // Debit notes use catalog 10, where 03 exists and 06 does not.
    const debit = { ...boleta, type: '08', referencedSerialNumber: 'B001-3', noteReason: 'Mora' };
    expect(validateInvoice({ ...debit, noteCode: '03', amount: '5.90' })).toEqual({});
    expect(validateInvoice({ ...debit, noteCode: '06', amount: '5.90' }).noteCode).toBeDefined();
  });
  it('sends only the fields the reason uses', () => {
    const base = { ...boleta, type: '07', referencedSerialNumber: 'B001-3', noteReason: ' Dev ' };
    expect(
      notePayload({ ...base, noteCode: '07', amount: '3', items: { a: '0', b: '2' } }),
    ).toEqual({ noteCode: '07', noteReason: 'Dev', items: [{ productId: 'b', quantity: 2 }] });
    expect(notePayload({ ...base, noteCode: '09', amount: ' 3.50 ', items: { b: '2' } })).toEqual({
      noteCode: '09',
      noteReason: 'Dev',
      amount: '3.50',
    });
    expect(notePayload(boleta)).toEqual({});
    expect(taxPercent('0.1800')).toBe('(18%)');
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

describe('invoice files', () => {
  it('builds the customer and staff download URLs', () => {
    expect(invoiceFileUrl('i1', 'pdf', 'o1')).toBe('/web-api/orders/o1/invoices/i1/pdf');
    expect(invoiceFileUrl('i1', 'cdr')).toBe('/web-api/admin/invoices/i1/cdr');
  });
  it('never presents drafts, rejections or tests as valid documents', () => {
    expect(invoiceValidity('DRAFT', true)).toMatch(/Borrador/);
    expect(invoiceValidity('FAILED', false)).toMatch(/sin valor/);
    expect(invoiceValidity('REJECTED', false)).toMatch(/Rechazado/);
    expect(invoiceValidity('ACCEPTED', true)).toMatch(/prueba/);
    expect(invoiceValidity('ACCEPTED', false)).toBe('Comprobante aceptado por SUNAT.');
  });
});

describe('pending reconciliation', () => {
  it('warns not to issue another document while SUNAT has not answered', () => {
    expect(invoiceValidity('PENDING_CHECK', true)).toMatch(/Concilia/);
  });
});

describe('RUC lookup', () => {
  it('summarizes status and warns about inactive taxpayers', () => {
    expect(rucStatusText({ status: 'ACTIVO', condition: 'HABIDO', active: true })).toBe(
      'ACTIVO · HABIDO',
    );
    expect(
      rucStatusText({ status: 'BAJA DE OFICIO', condition: 'NO HABIDO', active: false }),
    ).toMatch(/Revisa/);
  });
  it('shows what was verified in the order detail', () => {
    const rows = billingRows({
      type: '01',
      documentType: '6',
      documentNumber: '20123456786',
      name: 'Mi empresa',
      verification: {
        found: true,
        name: 'COMERCIAL ANDINA S.A.C.',
        status: 'ACTIVO',
        condition: 'HABIDO',
        source: 'fake',
        checkedAt: '2026-10-14T10:00:00Z',
      },
    });
    expect(rows.at(-1)).toEqual({
      label: 'RUC verificado',
      value: 'COMERCIAL ANDINA S.A.C. · ACTIVO · HABIDO',
    });
  });
});

describe('boleta without document', () => {
  const anonymous: BillingForm = {
    type: '03',
    documentType: '0',
    documentNumber: '',
    name: '',
    address: '',
  };
  it('is allowed only for boletas under S/ 700', () => {
    expect(validateBilling(anonymous, 699.99)).toEqual({});
    expect(validateBilling(anonymous, 700).documentType).toMatch(/700/);
    expect(validateBilling({ ...anonymous, type: '01' }).documentType).toMatch(/RUC/);
  });
  it('sends "-" and the generic name', () => {
    expect(billingPayload(anonymous)).toEqual({
      type: '03',
      documentType: '0',
      documentNumber: '-',
      name: 'CLIENTES VARIOS',
      address: null,
    });
  });
});

describe('SUNAT rules for notes and send deadline', () => {
  it('marks reason 02 as invoice only', () => {
    expect(noteReasons['07'].filter((item) => item.invoiceOnly).map((item) => item.value)).toEqual([
      '02',
    ]);
  });

  it('warns before the deadline and blocks after it', () => {
    expect(sendDeadlineNotice(null, '2026-10-20')).toBeNull();
    expect(sendDeadlineNotice('2026-10-20', '2026-10-20')).toEqual({
      expired: false,
      text: 'Envíalo a SUNAT a más tardar el 20/10/2026.',
    });
    expect(sendDeadlineNotice('2026-10-19', '2026-10-20')?.expired).toBe(true);
  });
});
