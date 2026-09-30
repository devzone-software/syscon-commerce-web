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
