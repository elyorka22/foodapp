'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Only highlight when pathname matches exactly (for home tab) */
  exact?: boolean;
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition ${active ? 'text-brand-600' : 'text-gray-500'}`}
            >
              <span className={active ? 'text-brand-600' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
