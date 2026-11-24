import type { User } from '../types';

/** Roles returned by the platform, prefixed with ROLE_. */
export const roleLabels: Record<string, string> = {
  ROLE_SUPERADMIN: 'Superadministrador',
  ROLE_ADMIN: 'Administrador',
  ROLE_CUSTOMER: 'Cliente',
};

/** Account states managed by the superadmin. */
export const accountStatusLabels: Record<string, string> = {
  ACTIVE: 'Activa',
  PENDING: 'Pendiente de validación',
  SUSPENDED: 'Suspendida',
};

export const roleLabel = (role: string) => roleLabels[role] ?? role.replace(/^ROLE_/, '');

/** Permissions returned by the platform and used to filter frontend tasks. */
export const permissions = {
  catalogWrite: 'catalog:write',
  ordersManage: 'orders:manage',
  paymentsConfirm: 'payments:confirm',
  invoicesSubmit: 'invoices:submit',
  suppliersManage: 'suppliers:manage',
  reportsView: 'reports:view',
  salesCreate: 'sales:create',
  cashManage: 'cash:manage',
  inventoryManage: 'inventory:manage',
  usersManage: 'users:manage',
  auditView: 'audit:view',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export const can = (user: User | null, permission: Permission) =>
  Boolean(user?.permissions?.includes(permission));

/** Staff access: any permission that unlocks a backoffice section. */
export const canUseBackoffice = (user: User | null) =>
  Object.values(permissions).some((permission) => can(user, permission));

/** Role chooses the landing page; permissions still control administrative access. */
export const accountHome = (user: User | null) =>
  user?.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_SUPERADMIN') ||
  canUseBackoffice(user)
    ? '/admin'
    : '/cuenta';

export const loginDestination = (user: User, requested?: unknown) =>
  safeRedirect(requested, accountHome(user));

/** Only same-site paths are accepted as post-login destinations. */
export const safeRedirect = (value: unknown, fallback = '/cuenta') =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : fallback;

/** Email-based fallback when a profile has no registered name. */
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

/** Keep the client-side minimum aligned with registration and password-change APIs. */
export const MIN_PASSWORD = 12;
export function passwordRequirementStatus(password: string) {
  const remaining = Math.max(0, MIN_PASSWORD - password.length);
  return { remaining, complete: remaining === 0 };
}

const passwordSets = [
  'abcdefghijkmnopqrstuvwxyz', // no "l": it looks like 1
  'ABCDEFGHJKLMNPQRSTUVWXYZ', // no I or O
  '23456789', // no 0 or 1
  '!@#$%&*?-_+=',
];

/** Uniform random index below `max` from the browser's cryptographic generator. */
const randomIndex = (max: number) => {
  const limit = Math.floor(0x1_0000_0000 / max) * max; // reject values that would bias the result
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value);
  while (value[0] >= limit);
  return value[0] % max;
};

/**
 * Strong password suggested on sign-up: 16 characters with at least one lowercase,
 * uppercase, digit and symbol, without look-alike characters, in a random order.
 */
export function suggestPassword(length = 16) {
  const all = passwordSets.join('');
  const chars = passwordSets.map((set) => set[randomIndex(set.length)]);
  while (chars.length < Math.max(length, MIN_PASSWORD)) chars.push(all[randomIndex(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
