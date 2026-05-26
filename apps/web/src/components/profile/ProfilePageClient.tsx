'use client';

import { useAuthStore } from '@/store/auth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ProfileDashboard } from '@/components/profile/ProfileDashboard';

export function ProfilePageClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || user?.isGuest) {
    return <AuthScreen mode="login" />;
  }

  return <ProfileDashboard />;
}
