'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@foodmarket/ui';
import { adminNav } from '@/lib/admin-nav';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Observability {
  http: { uptimeSec: number; totalRequests: number; totalErrors: number; memory: { heapUsedMb: number; rssMb: number } };
  websocket: {
    activeConnections: number;
    peakConnections: number;
    reconnectsLast5Min: number;
    reconnectSpike: boolean;
    duplicateSkipped: number;
    rejectedGps: number;
  };
  slowQueries: { thresholdMs: number; count: number; recent: { model: string; action: string; durationMs: number }[] };
  redis: { ok: boolean };
  queues: {
    orders: Record<string, number>;
    notifications: Record<string, number>;
    telegram: Record<string, number>;
    latencyHint: { waitingHigh: boolean; failedJobs: number };
  };
  infrastructure: Record<string, unknown>;
}

export default function ObservabilityPage() {
  const [data, setData] = useState<Observability | null>(null);

  const load = useCallback(async () => {
    const t = localStorage.getItem('accessToken');
    if (!t) return;
    const res = await fetch(`${API}/monitoring/observability`, {
      headers: { Authorization: `Bearer ${t}` },
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
      <Sidebar title="Operator" items={adminNav} accent="OPS" />
      <main className="p-4 md:p-6">
        <h1 className="text-xl font-bold">Observability</h1>
        <p className="text-sm text-gray-500">5 soniyada yangilanadi</p>

        {!data ? (
          <p className="mt-8 text-gray-400">Yuklanmoqda...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card title="API" alert={data.http.totalErrors > 10}>
              <Row label="Uptime" value={`${data.http.uptimeSec}s`} />
              <Row label="So'rovlar" value={String(data.http.totalRequests)} />
              <Row label="Xatolar" value={String(data.http.totalErrors)} />
              <Row label="Heap" value={`${data.http.memory.heapUsedMb} MB`} />
              <Row label="RSS" value={`${data.http.memory.rssMb} MB`} />
            </Card>

            <Card title="WebSocket" alert={data.websocket.reconnectSpike}>
              <Row label="Faol ulanish" value={String(data.websocket.activeConnections)} />
              <Row label="Peak" value={String(data.websocket.peakConnections)} />
              <Row label="Reconnect (5m)" value={String(data.websocket.reconnectsLast5Min)} />
              <Row label="GPS rad etilgan" value={String(data.websocket.rejectedGps)} />
              <Row label="Dublikat o'tkazilgan" value={String(data.websocket.duplicateSkipped)} />
            </Card>

            <Card title="Redis" alert={!data.redis.ok}>
              <Row label="Holat" value={data.redis.ok ? 'OK' : 'DOWN'} />
            </Card>

            <Card title="Navbat: orders" alert={data.queues.latencyHint.waitingHigh}>
              <QueueRows counts={data.queues.orders} />
            </Card>
            <Card title="Navbat: notifications">
              <QueueRows counts={data.queues.notifications} />
            </Card>
            <Card title="Navbat: telegram">
              <QueueRows counts={data.queues.telegram} />
            </Card>

            <Card title="Sekin so'rovlar" className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-2">Chegara: {data.slowQueries.thresholdMs}ms</p>
              {data.slowQueries.recent.length === 0 ? (
                <p className="text-xs text-green-600">Sekin so'rov yo&apos;q</p>
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

            <Card title="Infratuzilma tayyorligi">
              {Object.entries(data.infrastructure).map(([k, v]) => (
                <Row key={k} label={k} value={String(v ?? '—')} />
              ))}
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
