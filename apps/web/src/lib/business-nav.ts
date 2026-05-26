import { t } from '@/i18n';

export function getBusinessNav() {
  return [
    { href: '/business', label: t('business.nav.dashboard') },
    { href: '/business/products', label: t('business.nav.products') },
    { href: '/business/inventory', label: t('business.nav.inventory') },
    { href: '/business/orders', label: t('business.nav.orders') },
    { href: '/business/hours', label: t('business.nav.hours') },
  ];
}
