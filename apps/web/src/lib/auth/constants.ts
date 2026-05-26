import type { UserRole } from '@foodmarket/shared-types';
import { ROLE_HOME } from '@foodmarket/shared-types';

export const ACCESS_COOKIE = 'fm_access';
export const REFRESH_COOKIE = 'fm_refresh';
export const AUTH_STORAGE_KEY = 'foodmarket-auth';

export const LOGIN_PATH = '/login';
export const REGISTER_PATH = '/register';
export const PROFILE_PATH = '/profile';

export const GUEST_ONLY_PATHS = [LOGIN_PATH, REGISTER_PATH, '/customer/account', '/customer/register'];

export const PANEL_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/admin', roles: ['ADMIN', 'MANAGER', 'OPERATOR'] },
  { prefix: '/courier', roles: ['COURIER', 'ADMIN'] },
  { prefix: '/business', roles: ['BUSINESS_OWNER', 'ADMIN'] },
  { prefix: '/restaurant', roles: ['RESTAURANT_OWNER', 'ADMIN'] },
];

export function homeForRole(role: UserRole): string {
  return ROLE_HOME[role] ?? PROFILE_PATH;
}
