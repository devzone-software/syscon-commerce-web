import { describe, expect, it } from 'vitest';
import { notificationResult } from './notifications';

describe('notification results', () => {
  it('does not infer delivery or a mail transport from the existing API status', () => {
    expect(notificationResult({ status: 'SENT' })).toBe('Procesado');
    expect(notificationResult({ status: 'FAILED' })).toBe('Falló');
    expect(notificationResult({ status: 'PENDING' })).toBe('Pendiente');
  });
});
