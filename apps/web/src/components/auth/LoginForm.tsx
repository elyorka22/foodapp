'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, useToast } from '@foodmarket/ui';
import { t } from '@/i18n';
import { apiClient } from '@/lib/api';
import { validateLogin } from '@/lib/auth';
import { useAuthStore } from '@/store/auth';
import { homeForRole } from '@/lib/auth/constants';
import { REGISTER_PATH } from '@/lib/auth/constants';
import type { UserRole } from '@foodmarket/shared-types';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function update(field: 'email' | 'password', value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateLogin(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.login(form.email.trim(), form.password);
      login(res.accessToken, res.refreshToken, res.user);
      toast(t('auth.loginSuccess'), 'success');
      const returnUrl = searchParams.get('returnUrl');
      const role = res.user.role.name as UserRole;
      router.push(returnUrl && !returnUrl.startsWith('/login') ? returnUrl : homeForRole(role));
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message;
      toast(msg.includes('Invalid') || msg.includes('credentials') ? t('auth.errors.loginFailed') : msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={(e) => update('email', e.target.value)}
        placeholder={t('auth.emailPlaceholder')}
        error={errors.email}
      />
      <Input
        label={t('auth.password')}
        type="password"
        autoComplete="current-password"
        value={form.password}
        onChange={(e) => update('password', e.target.value)}
        placeholder={t('auth.passwordPlaceholder')}
        error={errors.password}
      />
      <Button type="submit" fullWidth disabled={loading} size="lg">
        {loading ? t('auth.signingIn') : t('auth.signIn')}
      </Button>
      <p className="text-center text-sm text-gray-600">
        {t('auth.noAccount')}{' '}
        <Link href={REGISTER_PATH} className="font-semibold text-brand-600">
          {t('auth.signUp')}
        </Link>
      </p>
    </form>
  );
}
