import { t } from '@/i18n';

export function getRestaurantNav() {
  return [
    { href: '/restaurant', label: t('restaurantPanel.nav.dashboard') },
    { href: '/restaurant/orders', label: t('restaurantPanel.nav.orders') },
    { href: '/restaurant/menu', label: t('restaurantPanel.nav.menu') },
    { href: '/restaurant/hours', label: t('restaurantPanel.nav.hours') },
    { href: '/restaurant/reviews', label: t('restaurantPanel.nav.reviews') },
  ];
}
