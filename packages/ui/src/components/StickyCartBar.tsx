'use client';

import Link from 'next/link';
import { Button } from './Button';

export function StickyCartBar({
  itemCount,
  total,
  totalLabel,
  href = '/cart',
}: {
  itemCount: number;
  total: number;
  totalLabel?: string;
  href?: string;
}) {
  const label = totalLabel ?? `$${total.toFixed(2)}`;
  if (itemCount === 0) return null;
  return (
    <div className="fixed bottom-16 left-4 right-4 z-40 md:bottom-6 md:left-auto md:right-6 md:max-w-md">
      <Link href={href}>
        <div className="flex items-center justify-between bg-brand-600 text-white rounded-2xl px-5 py-3.5 shadow-lg shadow-brand-600/30">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 rounded-lg px-2.5 py-1 text-sm font-bold">{itemCount}</span>
            <span className="font-medium">View cart</span>
          </div>
          <span className="font-bold text-lg">{label}</span>
        </div>
      </Link>
    </div>
  );
}
