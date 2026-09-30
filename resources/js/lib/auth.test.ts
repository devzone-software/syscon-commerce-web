import { describe, expect, it } from 'vitest';
import { can, canUseBackoffice, roleLabel, safeRedirect } from './auth';

const user = (permissions?: string[]) => ({ id: '1', email: 'a@b.pe', roles: [], permissions });

describe('permissions', () => {
  it('checks permissions instead of role names', () => {
    expect(can(user(['orders:manage']), 'orders:manage')).toBe(true);
    expect(can(user(), 'orders:manage')).toBe(false);
    expect(can(null, 'catalog:write')).toBe(false);
    expect(canUseBackoffice(user(['invoices:submit']))).toBe(true);
    expect(canUseBackoffice(user([]))).toBe(false);
  });
  it('labels known roles and falls back to the raw name', () => {
    expect(roleLabel('ROLE_CUSTOMER')).toBe('Cliente');
    expect(roleLabel('ROLE_WAREHOUSE')).toBe('WAREHOUSE');
  });
  it('only redirects to same-site paths after login', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('//evil.example')).toBe('/cuenta');
    expect(safeRedirect('/\\evil.example')).toBe('/cuenta');
    expect(safeRedirect('https://evil.example')).toBe('/cuenta');
    expect(safeRedirect(undefined)).toBe('/cuenta');
  });
});
