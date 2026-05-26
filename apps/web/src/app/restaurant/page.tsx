'use client';

import { Sidebar, StatCard, Badge } from '@foodmarket/ui';
import { getRestaurantNav } from '@/lib/restaurant-nav';
import { t, orderStatus } from '@/i18n';

const PIPELINE = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ASSIGNED'] as const;

export default function RestaurantPanel() {
  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('restaurantPanel.nav.dashboard')} items={getRestaurantNav()} accent={t('roles.partner')} />
      <main className="p-6 md:p-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('restaurantPanel.title')}</h1>
          <Badge variant="success">{t('restaurantPanel.open')}</Badge>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StatCard label={t('restaurantPanel.ordersToday')} value={12} />
          <StatCard label={t('restaurantPanel.avgPrep')} value="25 daq" />
          <StatCard label={t('restaurantPanel.rating')} value="4.8 ★" />
        </div>
        <section className="mt-8 bg-white rounded-2xl border p-6">
          <h2 className="font-semibold">{t('restaurantPanel.pipeline')}</h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {PIPELINE.map((s) => (
              <span key={s} className="px-3 py-1.5 bg-brand-50 text-brand-800 rounded-lg text-xs font-medium">
                {orderStatus(s)}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">{t('restaurantPanel.pipelineHint')}</p>
        </section>
        <section className="mt-6 bg-white rounded-2xl border p-6">
          <h2 className="font-semibold">{t('restaurantPanel.menuCrud')}</h2>
          <p className="text-sm text-gray-500 mt-2">{t('restaurantPanel.menuCrudHint')}</p>
        </section>
      </main>
    </div>
  );
}
