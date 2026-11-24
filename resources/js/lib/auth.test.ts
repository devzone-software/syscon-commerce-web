import { describe, expect, it } from 'vitest';
import {
  can,
  accountHome,
  canUseBackoffice,
  displayName,
  initials,
  loginDestination,
  MIN_PASSWORD,
  passwordRequirementStatus,
  roleLabel,
  safeRedirect,
  suggestPassword,
} from './auth';

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

describe('login destination by role', () => {
  const customer = { ...user(), roles: ['ROLE_CUSTOMER'] };
  const admin = { ...user(['orders:manage']), roles: ['ROLE_ADMIN'] };
  const superadmin = { ...user(['users:manage']), roles: ['ROLE_SUPERADMIN'] };

  it('sends customers to their account and staff to administration', () => {
    expect(loginDestination(customer)).toBe('/cuenta');
    expect(loginDestination(admin)).toBe('/admin');
    expect(loginDestination(superadmin)).toBe('/admin');
    expect(accountHome(null)).toBe('/cuenta');
  });

  it('preserves an explicit purchase or account destination for every role', () => {
    for (const account of [customer, admin, superadmin]) {
      expect(loginDestination(account, '/checkout')).toBe('/checkout');
      expect(loginDestination(account, '/cuenta/pedidos')).toBe('/cuenta/pedidos');
      expect(loginDestination(account, '/cuenta/carrito')).toBe('/cuenta/carrito');
    }
  });

  it('rejects external redirects using the destination appropriate to the role', () => {
    expect(loginDestination(admin, '//other.example')).toBe('/admin');
    expect(loginDestination(customer, 'https://other.example')).toBe('/cuenta');
  });

  it('keeps new staff headed to administration after the password gate', () => {
    const temporary = { ...admin, permissions: [], mustChangePassword: true };
    expect(loginDestination(temporary)).toBe('/admin');
    expect(canUseBackoffice(temporary)).toBe(false);
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

describe('password requirements', () => {
  it('shows only the minimum length enforced by the server', () => {
    expect(MIN_PASSWORD).toBe(12);
    expect(passwordRequirementStatus('').complete).toBe(false);
    expect(passwordRequirementStatus('short').remaining).toBe(7);
    expect(passwordRequirementStatus('abcdefghijkl')).toEqual({ remaining: 0, complete: true });
  });
});

describe('suggested password', () => {
  it('is long and mixes lowercase, uppercase, digits and symbols', () => {
    for (let i = 0; i < 50; i++) {
      const password = suggestPassword();
      expect(password).toHaveLength(16);
      expect(password.length).toBeGreaterThanOrEqual(MIN_PASSWORD);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[2-9]/);
      expect(password).toMatch(/[!@#$%&*?\-_+=]/);
      expect(password).not.toMatch(/[lIO01]/);
    }
  });

  it('changes every time', () => {
    expect(new Set(Array.from({ length: 20 }, () => suggestPassword())).size).toBe(20);
  });
});
