'use client';

import Link from 'next/link';
import { t } from '@/i18n';
import { PROFILE_PATH } from '@/lib/auth/constants';

export function HomeTopBar() {
  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-gray-100/80">
      <div className="px-4 pt-3 pb-3 max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex-1 text-left min-h-0 min-w-0 touch-auto active:opacity-70"
          >
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('home.deliverTo')}</p>
            <p className="flex items-center gap-1 font-bold text-gray-900 text-[15px] mt-0.5 truncate">
              {t('home.locationDefault')}
              <ChevronDown />
            </p>
          </button>
          <Link
            href={PROFILE_PATH}
            className="relative w-11 h-11 rounded-2xl bg-white border border-gray-100 shadow-card flex items-center justify-center active:scale-95 transition-transform touch-auto min-h-0 min-w-0"
            aria-label={t('home.notifications')}
          >
            <BellIcon />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ChevronDown() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
