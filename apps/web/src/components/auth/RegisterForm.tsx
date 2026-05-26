'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, useToast } from '@foodmarket/ui';
import { t } from '@/i18n';
import { apiClient } from '@/lib/api';
import {
  validateRegister,
  splitFullName,
  normalizePhone,
  type RegisterFormData,
} from '@/lib/auth';
import { useAuthStore } from '@/store/auth';
import { PROFILE_PATH, LOGIN_PATH } from '@/lib/auth/constants';

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState<RegisterFormData>({
    name: '',
    phone: '+998',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function update(field: keyof RegisterFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateRegister(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setLoading(true);
    try {
      const { firstName, lastName } = splitFullName(form.name);
      const res = await apiClient.register({
        email: form.email.trim(),
        password: form.password,
        phone: normalizePhone(form.phone),
        firstName,
        lastName,
      });
      login(res.accessToken, res.refreshToken, res.user);
      toast(t('auth.registerSuccess'), 'success');
      router.push(PROFILE_PATH);
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message;
      const friendly = msg.toLowerCase().includes('already')
        ? t('auth.errors.emailExists')
        : t('auth.errors.registerFailed');
      toast(friendly, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label={t('auth.name')}
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder={t('auth.namePlaceholder')}
        autoComplete="name"
        error={errors.name}
      />
      <Input
        label={t('auth.phone')}
        type="tel"
        value={form.phone}
        onChange={(e) => update('phone', e.target.value)}
        placeholder={t('auth.phonePlaceholder')}
        autoComplete="tel"
        error={errors.phone}
      />
      <Input
        label={t('auth.email')}
        type="email"
        value={form.email}
        onChange={(e) => update('email', e.target.value)}
        placeholder={t('auth.emailPlaceholder')}
        autoComplete="email"
        error={errors.email}
      />
      <Input
        label={t('auth.password')}
        type="password"
        value={form.password}
        onChange={(e) => update('password', e.target.value)}
        placeholder={t('auth.passwordPlaceholder')}
        autoComplete="new-password"
        error={errors.password}
      />
      <Input
        label={t('auth.confirmPassword')}
        type="password"
        value={form.confirmPassword}
        onChange={(e) => update('confirmPassword', e.target.value)}
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      <Button type="submit" fullWidth disabled={loading} size="lg">
        {loading ? t('auth.signingUp') : t('auth.signUp')}
      </Button>
      <p className="text-center text-sm text-gray-600">
        {t('auth.hasAccount')}{' '}
        <Link href={LOGIN_PATH} className="font-semibold text-brand-600">
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  );
}
