'use client';

import { MobileShell } from '@/components/MobileShell';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { t } from '@/i18n';

export default function RegisterPage() {
  return (
    <MobileShell>
      <div className="min-h-[70vh] px-4 py-8 pb-32 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
          <p className="text-gray-500 text-sm mt-2">{t('auth.registerSubtitle')}</p>
        </div>
        <RegisterForm />
      </div>
    </MobileShell>
  );
}
