import { t } from '@/i18n';
import { hasPermission } from '@/lib/auth/rbac';

export function getAdminNav(permissions: string[] = []) {
  const items = [
    { href: '/admin', label: t('admin.nav.dashboard') },
    { href: '/admin/ops', label: t('admin.nav.ops') },
    { href: '/admin/incidents', label: t('admin.nav.incidents') },
    { href: '/admin/observability', label: t('admin.nav.monitoring') },
    { href: '/admin/analytics', label: t('admin.nav.analytics') },
    { href: '/admin/orders', label: t('admin.nav.orders') },
  ];

  if (hasPermission(permissions, 'manage_users')) {
    items.push({ href: '/admin/users', label: t('admin.nav.users') });
  }

  return items;
}
