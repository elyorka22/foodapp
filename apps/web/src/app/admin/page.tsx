'use client';

import { Sidebar, StatCard } from '@foodmarket/ui';
import { useEffect, useState } from 'react';
import { panelApi } from '@/lib/panel-api';
import { getAdminNav } from '@/lib/admin-nav';
import { t } from '@/i18n';

interface Dashboard {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  activeCouriers: number;
  failedOrders: number;
  avgDeliveryMinutes: number;
  topRestaurants: { name: string; revenue: number; orders: number }[];
  peakHours: { hour: number; count: number }[];
}

function formatUzs(n: number) {
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    panelApi<Dashboard>(`/analytics/dashboard?${q}`, token)
      .then(setStats)
      .catch(() => setStats(null));
  }, [from, to]);

  const maxPeak = Math.max(...(stats?.peakHours?.map((p) => p.count) ?? [1]), 1);

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('roles.admin')} items={getAdminNav()} accent="FoodMarket UZ" />
      <main className="p-6 md:p-8">
        <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
        <div className="flex gap-2 mt-4">
          <input type="date" className="border rounded-lg px-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="border rounded-lg px-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard label={t('admin.dashboard.todayOrders')} value={stats?.todayOrders ?? '—'} />
          <StatCard label={t('admin.dashboard.revenue')} value={stats ? formatUzs(stats.totalRevenue) : '—'} />
          <StatCard label={t('admin.dashboard.avgDelivery')} value={stats ? `${stats.avgDeliveryMinutes} daq` : '—'} />
          <StatCard label={t('admin.dashboard.activeCouriers')} value={stats?.activeCouriers ?? '—'} />
          <StatCard label={t('admin.dashboard.cancelled')} value={stats?.failedOrders ?? '—'} />
          <StatCard label={t('admin.dashboard.totalOrders')} value={stats?.totalOrders ?? '—'} />
        </div>

        {stats?.peakHours && (
          <section className="mt-8 bg-white rounded-2xl border p-6">
            <h2 className="font-semibold mb-4">{t('admin.dashboard.peakHours')}</h2>
            <div className="flex items-end gap-1 h-32">
              {stats.peakHours.map((p) => (
                <div key={p.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-500 rounded-t"
                    style={{ height: `${(p.count / maxPeak) * 100}%`, minHeight: p.count ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-gray-400">{p.hour}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats?.topRestaurants && stats.topRestaurants.length > 0 && (
          <section className="mt-6 bg-white rounded-2xl border p-6">
            <h2 className="font-semibold mb-3">{t('admin.dashboard.topRestaurants')}</h2>
            <ul className="space-y-2">
              {stats.topRestaurants.map((r, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="font-semibold">{formatUzs(r.revenue)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
