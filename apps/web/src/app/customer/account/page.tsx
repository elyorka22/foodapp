'use client';

import { MobileShell } from '@/components/MobileShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { t } from '@/i18n';

export default function AccountPage() {
  return (
    <MobileShell>
      <div className="min-h-[70vh] px-4 py-8 pb-32 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h1>
          <p className="text-gray-500 text-sm mt-2">{t('auth.loginSubtitle')}</p>
        </div>
        <LoginForm />
        <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 text-sm text-gray-600 shadow-card">
          <p className="font-semibold text-gray-900">{t('auth.demoAccounts')}</p>
          <ul className="mt-2 space-y-1 text-gray-500">
            <li>customer@foodmarket.uz</li>
            <li>admin@foodmarket.uz</li>
            <li>
              {t('auth.demoPassword')}: Password123!
            </li>
          </ul>
        </div>
      </div>
    </MobileShell>
  );
}
