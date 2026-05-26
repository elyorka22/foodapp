'use client';

import Link from 'next/link';
import { Button } from './Button';

export function StickyCartBar({
  itemCount,
  totalLabel,
  href = '/cart',
  viewCartLabel = "Savatni ko'rish",
}: {
  itemCount: number;
  total?: number;
  totalLabel?: string;
  href?: string;
  viewCartLabel?: string;
}) {
  if (itemCount === 0 || !totalLabel) return null;
  return (
    <div className="fixed bottom-[4.5rem] left-4 right-4 z-40 max-w-lg mx-auto md:bottom-6 md:left-auto md:right-6">
      <Link href={href} className="block active:scale-[0.98] transition-transform">
        <div className="flex items-center justify-between bg-brand-600 text-white rounded-2xl px-5 py-3.5 shadow-lg shadow-brand-600/25">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 rounded-lg min-w-[28px] h-7 flex items-center justify-center px-2 text-sm font-bold">
              {itemCount}
            </span>
            <span className="font-semibold text-sm">{viewCartLabel}</span>
          </div>
          <span className="font-bold text-base">{totalLabel}</span>
        </div>
      </Link>
    </div>
  );
}
