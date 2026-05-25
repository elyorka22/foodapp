'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SidebarItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function Sidebar({
  title,
  items,
  accent = 'FoodMarket',
}: {
  title: string;
  items: SidebarItem[];
  accent?: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-100">
      <div className="p-6">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{accent}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{title}</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
