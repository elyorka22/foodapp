'use client';

import { BottomNav, StickyCartBar } from '@foodmarket/ui';
import { formatUzs } from '@/lib/api';
import { t } from '@/i18n';
import { customerPath } from '@/lib/paths';
import { useCart } from '@/store/cart';

const navItems = () => [
  { href: customerPath('/'), label: t('nav.home'), icon: <HomeIcon />, exact: true },
  { href: customerPath('/restaurants'), label: t('nav.food'), icon: <FoodIcon /> },
  { href: customerPath('/shops'), label: t('nav.shops'), icon: <ShopIcon /> },
  { href: customerPath('/orders'), label: t('nav.orders'), icon: <OrdersIcon /> },
  { href: customerPath('/account'), label: t('nav.account'), icon: <AccountIcon /> },
];

export function MobileShell({ children, cartBump = 0 }: { children: React.ReactNode; cartBump?: number }) {
  const subtotal = useCart((s) => s.subtotal());
  const itemCount = useCart((s) => s.itemCount());
  const items = navItems();

  return (
    <div className="min-h-screen bg-surface">
      {children}
      <div key={cartBump} className={cartBump ? 'animate-cart-bump' : ''}>
        <StickyCartBar
          itemCount={itemCount}
          totalLabel={formatUzs(subtotal)}
          href={customerPath('/checkout')}
          viewCartLabel={t('cart.viewCart')}
        />
      </div>
      <BottomNav items={items} />
    </div>
  );
}

function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function FoodIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function ShopIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
