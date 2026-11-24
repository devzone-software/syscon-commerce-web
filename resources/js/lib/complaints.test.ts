import { describe, expect, it } from 'vitest';
import { complaintError, complaintPayload, emptyComplaint, formatDay } from './complaints';

const filled = () => ({
  ...emptyComplaint(),
  consumerName: 'Ana Quispe Mamani',
  documentNumber: '45678912',
  address: 'Jr. Lima 123, Juliaca',
  phone: '+51 951 234 567',
  email: 'ana@cliente.test',
  itemDescription: 'Router Wi-Fi 6',
  detail: 'El router llegó sin su fuente de poder.',
  consumerRequest: 'Cambio del equipo',
  accepted: true,
});

describe('Libro de Reclamaciones form', () => {
  it('accepts a complete sheet', () => {
    expect(complaintError(filled())).toBeNull();
  });

  it('checks the document, the email, the amount and the acceptance', () => {
    expect(complaintError({ ...filled(), documentNumber: '123' })).toMatch(/DNI/);
    expect(complaintError({ ...filled(), documentType: 'RUC' })).toMatch(/RUC/);
    expect(complaintError({ ...filled(), email: 'ana' })).toMatch(/correo/);
    expect(complaintError({ ...filled(), amount: '12,5' })).toMatch(/monto/);
    expect(complaintError({ ...filled(), accepted: false })).toMatch(/Confirma/);
  });

  it('sends trimmed text and leaves out the empty optional fields', () => {
    const payload = complaintPayload({ ...filled(), consumerName: '  Ana  ', amount: ' ' });
    expect(payload.consumerName).toBe('Ana');
    expect(payload.amount).toBeUndefined();
    expect(payload.guardianName).toBeUndefined();
  });

  it('shows the due date as day/month/year', () => {
    expect(formatDay('2026-11-30')).toBe('30/11/2026');
  });
});
