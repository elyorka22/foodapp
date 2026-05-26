import { parseRolePermissions } from '@foodmarket/shared-types';

export function permissionsFromRoleJson(raw: unknown): string[] {
  return parseRolePermissions(raw);
}

export function userHasPermission(permissions: string[], slug: string): boolean {
  if (permissions.includes('*')) return true;
  return permissions.includes(slug);
}
