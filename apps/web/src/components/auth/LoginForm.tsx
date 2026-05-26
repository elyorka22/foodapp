'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, useToast } from '@foodmarket/ui';
import { t } from '@/i18n';
import { apiClient } from '@/lib/api';
import { validateLogin, setAuthSession, type LoginFormData } from '@/lib/auth';
import { customerPath } from '@/lib/paths';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function update(field: keyof LoginFormData, value: string) {
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
      setAuthSession(res.accessToken, res.refreshToken);
      toast(t('auth.loginSuccess'), 'success');
      router.push(customerPath('/'));
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
        <Link href={customerPath('/register')} className="font-semibold text-brand-600">
          {t('auth.signUp')}
        </Link>
      </p>
    </form>
  );
}
