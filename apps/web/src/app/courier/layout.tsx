'use client';

import { AuthGate } from '@/components/auth/AuthGate';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate roles={['COURIER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </AuthGate>
  );
}
