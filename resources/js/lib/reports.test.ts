import { describe, expect, it } from 'vitest';
import { defaultPeriod, limaDate, periodError } from './reports';

describe('report periods', () => {
  it('uses Lima dates, not UTC', () => {
    // 03:30 UTC on the 14th is still the 13th in Lima (UTC−5).
    expect(limaDate(new Date('2026-10-14T03:30:00Z'))).toBe('2026-10-13');
  });
  it('defaults to the last 30 days including today', () => {
    expect(defaultPeriod(new Date('2026-10-14T15:00:00Z'))).toEqual({
      from: '2026-09-15',
      to: '2026-10-14',
    });
  });
  it('checks order and length like the platform', () => {
    expect(periodError('2026-10-01', '2026-10-13')).toBeNull();
    expect(periodError('2026-10-13', '2026-10-01')).toMatch(/anterior/);
    expect(periodError('2025-01-01', '2026-10-13')).toMatch(/366/);
    expect(periodError('', '2026-10-13')).toMatch(/fechas/);
  });
});
