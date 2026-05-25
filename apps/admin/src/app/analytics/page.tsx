'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@foodmarket/ui';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
import { adminNav } from '@/lib/admin-nav';

interface OpsMetrics {
  period: { from: string; to: string };
  sla: {
    targetMinutes: number;
    metPercent: number;
    breachCount: number;
    breachRatePercent: number;
    avgDeliveryMinutes: number;
    sampleSize: number;
  };
  cancellations: {
    count: number;
    total: number;
    ratePercent: number;
    trend: string;
    reasons: { reason: string; count: number }[];
  };
  restaurantResponsiveness: { avgConfirmMinutes: number; p90ConfirmMinutes: number; sampleSize: number };
  prepTime: { avgMinutes: number; p90Minutes: number; sampleSize: number };
  basket: { avgSubtotal: number; avgTotal: number; orders: number };
  retention: { uniqueCustomers: number; repeatCustomers: number; repeatRatePercent: number };
  courierPerformance: { id: string; name: string; deliveries: number; rating: number; avgEarning: number }[];
  peakForecast: { next4Hours: { hour: number; expectedOrders: number }[] };
}

function formatUzs(n: number) {
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<OpsMetrics | null>(null);

  const load = useCallback(async () => {
    const t = localStorage.getItem('accessToken');
    if (!t) return;
    const res = await fetch(`${API}/analytics/operations`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title="Operator" items={adminNav} accent="OPS" />
      <main className="p-4 md:p-6">
        <h1 className="text-xl font-bold">Business analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Oxirgi 7 kun (keshlangan)</p>

        {!data ? (
          <p className="mt-8 text-gray-400">Yuklanmoqda...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <MetricCard
              title="SLA (≤45 daq)"
              value={`${data.sla.metPercent}%`}
              sub={`${data.sla.breachCount} buzilgan (${data.sla.breachRatePercent}%) · o'rt ${data.sla.avgDeliveryMinutes} daq`}
            />
            <MetricCard
              title="Bekor qilish"
              value={`${data.cancellations.ratePercent}%`}
              sub={`${data.cancellations.trend} · ${data.cancellations.count}/${data.cancellations.total}`}
            />
            <MetricCard
              title="Restoran javobi"
              value={`${data.restaurantResponsiveness.avgConfirmMinutes} daq`}
              sub={`P90: ${data.restaurantResponsiveness.p90ConfirmMinutes} daq`}
            />
            <MetricCard title="Tayyorlash vaqti" value={`${data.prepTime.avgMinutes} daq`} sub={`P90: ${data.prepTime.p90Minutes} daq`} />
            <MetricCard title="Savat o'rtachasi" value={formatUzs(data.basket.avgSubtotal)} sub={`${data.basket.orders} buyurtma`} />
            <MetricCard title="Qaytuvchi mijozlar" value={`${data.retention.repeatRatePercent}%`} sub={`${data.retention.repeatCustomers} / ${data.retention.uniqueCustomers}`} />
          </div>
        )}

        {data && (
          <>
            {data.cancellations.reasons.length > 0 && (
              <>
                <h2 className="font-semibold mt-8 mb-3">Bekor qilish sabablari</h2>
                <div className="flex flex-wrap gap-2">
                  {data.cancellations.reasons.map((r) => (
                    <span key={r.reason} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                      {r.reason}: {r.count}
                    </span>
                  ))}
                </div>
              </>
            )}

            <h2 className="font-semibold mt-8 mb-3">Eng yaxshi kuryerlar</h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3">Ism</th>
                    <th className="p-3">Yetkazishlar</th>
                    <th className="p-3">Reyting</th>
                    <th className="p-3">O'rtacha daromad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courierPerformance.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3">{c.name}</td>
                      <td className="p-3">{c.deliveries}</td>
                      <td className="p-3">{c.rating.toFixed(1)}</td>
                      <td className="p-3">{formatUzs(c.avgEarning)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="font-semibold mt-8 mb-3">Keyingi 4 soat (bashorat)</h2>
            <div className="flex gap-2 flex-wrap">
              {data.peakForecast.next4Hours.map((h) => (
                <div key={h.hour} className="bg-white border rounded-xl px-4 py-3 text-center min-w-[72px]">
                  <p className="text-xs text-gray-500">{h.hour}:00</p>
                  <p className="text-lg font-bold">{h.expectedOrders}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1 text-brand-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
