'use client';

import { useAuthStore } from '@/store/auth';
import { getAdminNav } from '@/lib/admin-nav';

export function useAdminNav() {
  const permissions = useAuthStore((s) => s.permissions);
  return getAdminNav(permissions);
}
