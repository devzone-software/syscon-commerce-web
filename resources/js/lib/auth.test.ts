import { describe, expect, it } from 'vitest';
import { can, canUseBackoffice, displayName, initials, roleLabel, safeRedirect } from './auth';

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

describe('user identity from the e-mail', () => {
  it('builds a display name and initials', () => {
    expect(displayName({ email: 'clever.givera@gmail.com' })).toBe('Clever');
    expect(initials({ email: 'clever.givera@gmail.com' })).toBe('CG');
    expect(displayName({ email: 'ANA@syscon.pe' })).toBe('Ana');
    expect(initials({ email: 'ana@syscon.pe' })).toBe('AN');
    expect(initials({ email: 'juan_perez99@mail.com' })).toBe('JP');
  });
  it('prefers the registered names', () => {
    const user = { email: 'x@mail.com', firstName: 'María José', lastName: 'Quispe' };
    expect(displayName(user)).toBe('María');
    expect(initials(user)).toBe('MQ');
  });
});
