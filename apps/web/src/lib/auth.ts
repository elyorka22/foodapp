import { t } from '@/i18n';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';
import { useAuthStore } from '@/store/auth';

export interface RegisterFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export function validateLogin(data: LoginFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.email.trim()) errors.email = t('auth.errors.emailRequired');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = t('auth.errors.emailInvalid');
  if (!data.password) errors.password = t('auth.errors.passwordRequired');
  return errors;
}

export function validateRegister(data: RegisterFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = t('auth.errors.nameRequired');
  const phone = data.phone.replace(/\s/g, '');
  if (!phone) errors.phone = t('auth.errors.phoneRequired');
  else if (!/^\+998[0-9]{9}$/.test(normalizePhone(phone))) {
    errors.phone = t('auth.errors.phoneInvalid');
  }
  if (!data.email.trim()) errors.email = t('auth.errors.emailRequired');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = t('auth.errors.emailInvalid');
  if (!data.password) errors.password = t('auth.errors.passwordRequired');
  else if (data.password.length < 8) errors.password = t('auth.errors.passwordShort');
  if (!data.confirmPassword) errors.confirmPassword = t('auth.errors.confirmRequired');
  else if (data.password !== data.confirmPassword) errors.confirmPassword = t('auth.errors.passwordMismatch');
  return errors;
}

export function splitFullName(name: string): { firstName: string; lastName?: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '' };
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998')) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

export function setAuthSession(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (refreshToken) setAuthCookies(accessToken, refreshToken);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  clearAuthCookies();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    role: null,
    permissions: [],
    isAuthenticated: false,
  });
}
