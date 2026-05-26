'use client';

import { AuthGate } from '@/components/auth/AuthGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate roles={['ADMIN', 'MANAGER', 'OPERATOR']}>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </AuthGate>
  );
}
