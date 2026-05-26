import type { PermissionSlug, UserRole } from './types';

/** Home route after login per role. */
export const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: '/profile',
  ADMIN: '/admin',
  MANAGER: '/admin',
  OPERATOR: '/admin',
  BUSINESS_OWNER: '/business',
  RESTAURANT_OWNER: '/restaurant',
  COURIER: '/courier',
};

export const ADMIN_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'OPERATOR'];

export function hasPermission(permissions: string[], required: PermissionSlug): boolean {
  if (permissions.includes('*')) return true;
  return permissions.includes(required);
}

export function hasAnyPermission(permissions: string[], required: PermissionSlug[]): boolean {
  if (permissions.includes('*')) return true;
  return required.some((p) => permissions.includes(p));
}

export function parseRolePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === 'string');
}
