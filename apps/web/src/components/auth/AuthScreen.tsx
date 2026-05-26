'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { MobileShell } from '@/components/MobileShell';
import { t } from '@/i18n';
import { LOGIN_PATH, REGISTER_PATH } from '@/lib/auth/constants';

interface AuthScreenProps {
  mode: 'login' | 'register';
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const isLogin = mode === 'login';

  return (
    <MobileShell>
      <div className="min-h-[70vh] px-4 py-8 pb-32 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>
        {isLogin ? <LoginForm /> : <RegisterForm />}
        <p className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
          <Link
            href={isLogin ? REGISTER_PATH : LOGIN_PATH}
            className="font-semibold text-brand-600"
          >
            {isLogin ? t('auth.signUp') : t('auth.signIn')}
          </Link>
        </p>
      </div>
    </MobileShell>
  );
}
