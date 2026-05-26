'use client';

import { AuthGate } from '@/components/auth/AuthGate';

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate roles={['RESTAURANT_OWNER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </AuthGate>
  );
}
