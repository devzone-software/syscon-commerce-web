import type { User } from '../types';

/** Roles issued by auth-service (claim `authorities`, prefixed with ROLE_). */
export const roleLabels: Record<string, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_CUSTOMER: 'Cliente',
};

export const roleLabel = (role: string) => roleLabels[role] ?? role.replace(/^ROLE_/, '');

/** Permissions checked by the Java services with @PreAuthorize. */
export const permissions = {
  catalogWrite: 'catalog:write',
  ordersManage: 'orders:manage',
  paymentsConfirm: 'payments:confirm',
  invoicesSubmit: 'invoices:submit',
  suppliersManage: 'suppliers:manage',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export const can = (user: User | null, permission: Permission) =>
  Boolean(user?.permissions?.includes(permission));

/** Staff access: any permission that unlocks a backoffice section. */
export const canUseBackoffice = (user: User | null) =>
  Object.values(permissions).some((permission) => can(user, permission));

/** Only same-site paths are accepted as post-login destinations. */
export const safeRedirect = (value: unknown, fallback = '/cuenta') =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : fallback;

/** auth-service only stores the e-mail, so the visible name comes from its local part. */
const emailWords = (email: string) =>
  email
    .split('@')[0]
    .split(/[._\-+\d]+/)
    .filter(Boolean);

type Identity = Pick<User, 'email' | 'firstName' | 'lastName'>;

export function displayName(user: Identity) {
  if (user.firstName?.trim()) return user.firstName.trim().split(/\s+/)[0];
  const [first] = emailWords(user.email);
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : user.email;
}

export function initials(user: Identity) {
  const named = [user.firstName, user.lastName].filter((part): part is string =>
    Boolean(part?.trim()),
  );
  if (named.length)
    return named
      .map((part) => part.trim()[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const words = emailWords(user.email);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}
