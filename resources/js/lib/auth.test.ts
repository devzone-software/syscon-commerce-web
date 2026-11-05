import { describe, expect, it } from 'vitest';
import {
  can,
  accountHome,
  canUseBackoffice,
  displayName,
  initials,
  loginDestination,
  passwordChecks,
  roleLabel,
  safeRedirect,
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

describe('password strength', () => {
  it('rates the password with the four rules shown in the sign up form', () => {
    expect(passwordChecks('').strength).toBe('');
    expect(passwordChecks('abc').strength).toBe('Débil');
    expect(passwordChecks('abcdefghijkl1').passed).toBe(2);
    expect(passwordChecks('TechSyscon2026!').strength).toBe('Fuerte');
    expect(passwordChecks('TechSyscon2026!').checks.every((check) => check.ok)).toBe(true);
  });
});
