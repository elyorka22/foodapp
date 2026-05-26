'use client';

import { AuthGate } from '@/components/auth/AuthGate';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate roles={['BUSINESS_OWNER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </AuthGate>
  );
}
