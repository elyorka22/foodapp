import { t } from '@/i18n';

export function getAdminNav() {
  return [
    { href: '/admin', label: t('admin.nav.dashboard') },
    { href: '/admin/ops', label: t('admin.nav.ops') },
    { href: '/admin/incidents', label: t('admin.nav.incidents') },
    { href: '/admin/observability', label: t('admin.nav.monitoring') },
    { href: '/admin/analytics', label: t('admin.nav.analytics') },
    { href: '/admin/orders', label: t('admin.nav.orders') },
  ];
}
