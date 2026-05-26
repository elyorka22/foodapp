'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LOGIN_PATH } from '@/lib/auth/constants';
import type { UserRole } from '@foodmarket/shared-types';

interface AuthGateProps {
  children: ReactNode;
  roles?: UserRole[];
  loginPath?: string;
}

export function AuthGate({ children, roles, loginPath = LOGIN_PATH }: AuthGateProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(loginPath);
      return;
    }
    if (roles?.length && role && !roles.includes(role)) {
      router.replace('/profile');
    }
  }, [hydrated, isAuthenticated, role, roles, router, loginPath]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (roles?.length && role && !roles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
