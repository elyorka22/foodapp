import type { UserRole } from '@foodmarket/shared-types';
import { ROLE_HOME } from '@foodmarket/shared-types';
import {
  GUEST_ONLY_PATHS,
  LOGIN_PATH,
  PANEL_PREFIXES,
  PROFILE_PATH,
} from './constants';

export interface TokenPayload {
  sub: string;
  role: UserRole;
  permissions?: string[];
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAuthRequiredPath(pathname: string): boolean {
  return PANEL_PREFIXES.some(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function panelForPath(pathname: string): { prefix: string; roles: UserRole[] } | null {
  return PANEL_PREFIXES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? null;
}

export function redirectForRole(role: UserRole): string {
  return ROLE_HOME[role] ?? PROFILE_PATH;
}

export function loginUrlWithReturn(pathname: string): string {
  const params = new URLSearchParams();
  if (pathname && pathname !== LOGIN_PATH) params.set('returnUrl', pathname);
  const q = params.toString();
  return q ? `${LOGIN_PATH}?${q}` : LOGIN_PATH;
}
