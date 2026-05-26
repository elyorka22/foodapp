'use client';

import Link from 'next/link';
import { customerPath } from '@/lib/paths';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="px-4 py-4 max-w-lg mx-auto md:max-w-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Deliver to</p>
            <button className="flex items-center gap-1 font-semibold text-gray-900">
              Uy · Toshkent
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <Link
            href={customerPath('/account')}
            className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold"
          >
            FM
          </Link>
        </div>
        <div className="mt-4 relative">
          <input
            type="search"
            placeholder="Search restaurants, groceries..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
