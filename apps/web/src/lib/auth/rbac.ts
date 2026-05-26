import type { PermissionSlug, UserRole } from '@foodmarket/shared-types';
import { ADMIN_ROLES, hasAnyPermission, hasPermission } from '@foodmarket/shared-types';

export { ADMIN_ROLES, hasPermission, hasAnyPermission };
export type { PermissionSlug, UserRole };

export function canAccessPanel(role: UserRole, panelPrefix: string): boolean {
  if (role === 'ADMIN') return true;
  if (panelPrefix.startsWith('/admin')) return ADMIN_ROLES.includes(role);
  if (panelPrefix.startsWith('/courier')) return role === 'COURIER';
  if (panelPrefix.startsWith('/business')) return role === 'BUSINESS_OWNER';
  if (panelPrefix.startsWith('/restaurant')) return role === 'RESTAURANT_OWNER';
  return false;
}

export function panelHrefForRole(role: UserRole): string | null {
  if (ADMIN_ROLES.includes(role)) return '/admin';
  if (role === 'BUSINESS_OWNER') return '/business';
  if (role === 'RESTAURANT_OWNER') return '/restaurant';
  if (role === 'COURIER') return '/courier';
  return null;
}
