'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@foodmarket/ui';
import { getAdminNav } from '@/lib/admin-nav';
import { t } from '@/i18n';

import { API_URL } from '@/lib/api';

interface Observability {
  http: { uptimeSec: number; totalRequests: number; totalErrors: number; memory: { heapUsedMb: number; rssMb?: number } };
  slowQueries: { thresholdMs: number; count?: number; recent: { model: string; action: string; durationMs: number }[] };
  redis: { ok: boolean; mode?: string };
  queues: {
    orders: Record<string, number>;
    notifications: Record<string, number>;
    telegram: Record<string, number>;
    disabled?: boolean;
    latencyHint?: { waitingHigh: boolean; failedJobs: number };
  };
}

export default function ObservabilityPage() {
  const [data, setData] = useState<Observability | null>(null);

  const load = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    const res = await fetch(`${API_URL}/monitoring/observability`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('roles.operator')} items={getAdminNav()} accent="OPS" />
      <main className="p-4 md:p-6">
        <h1 className="text-xl font-bold">{t('admin.observability.title')}</h1>
        <p className="text-sm text-gray-500">{t('admin.observability.refreshHint')}</p>

        {!data ? (
          <p className="mt-8 text-gray-400">{t('common.loading')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card title={t('admin.observability.api')} alert={data.http.totalErrors > 10}>
              <Row label={t('admin.observability.uptime')} value={`${data.http.uptimeSec}s`} />
              <Row label={t('admin.observability.requests')} value={String(data.http.totalRequests)} />
              <Row label={t('admin.observability.errors')} value={String(data.http.totalErrors)} />
              <Row label={t('admin.observability.heap')} value={`${data.http.memory.heapUsedMb} MB`} />
            </Card>

            <Card title={t('admin.observability.redis')} alert={!data.redis.ok}>
              <Row label={t('admin.observability.status')} value={data.redis.ok ? 'OK' : 'DOWN'} />
              {data.redis.mode && <Row label="Mode" value={data.redis.mode} />}
            </Card>

            <Card title={t('admin.observability.queueOrders')} alert={data.queues.latencyHint?.waitingHigh}>
              <QueueRows counts={data.queues.orders} />
            </Card>
            <Card title={t('admin.observability.queueNotifications')}>
              <QueueRows counts={data.queues.notifications} />
            </Card>
            <Card title={t('admin.observability.queueTelegram')}>
              <QueueRows counts={data.queues.telegram} />
            </Card>

            <Card title={t('admin.observability.slowQueries')} className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-2">{t('admin.observability.threshold', { ms: data.slowQueries.thresholdMs })}</p>
              {data.slowQueries.recent.length === 0 ? (
                <p className="text-xs text-green-600">{t('admin.observability.noSlowQueries')}</p>
              ) : (
                <ul className="text-xs space-y-1">
                  {data.slowQueries.recent.map((q, i) => (
                    <li key={i} className="flex justify-between font-mono">
                      <span>{q.model}.{q.action}</span>
                      <span className="text-amber-700">{q.durationMs}ms</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}

function Card({
  title,
  children,
  alert,
  className,
}: {
  title: string;
  children: React.ReactNode;
  alert?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 ${alert ? 'border-red-400 bg-red-50/30' : ''} ${className ?? ''}`}
    >
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function QueueRows({ counts }: { counts: Record<string, number> }) {
  return (
    <>
      {Object.entries(counts).map(([k, v]) => (
        <Row key={k} label={k} value={String(v)} />
      ))}
    </>
  );
}
