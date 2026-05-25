'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar, Button, Input } from '@foodmarket/ui';
import { adminNav } from '@/lib/admin-nav';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

interface Incident {
  id: string;
  type: string;
  severity: Severity;
  status: Status;
  title: string;
  description?: string;
  orderId?: string;
  createdAt: string;
  order?: { orderNumber: string; guestPhone?: string; restaurant?: { name: string }; business?: { name: string } };
}

interface IncidentCenter {
  stats: { open: number; inProgress: number; resolvedToday: number; critical: number };
  incidents: Incident[];
  byType: { type: string; count: number }[];
}

const severityColor: Record<Severity, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-amber-100 text-amber-900',
  CRITICAL: 'bg-red-600 text-white',
};

export default function IncidentsPage() {
  const [center, setCenter] = useState<IncidentCenter | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<{ at: string; kind: string; action: string; note?: string }[]>([]);
  const [resolveNote, setResolveNote] = useState('');
  const [filter, setFilter] = useState<'all' | Severity>('all');

  const token = () => localStorage.getItem('accessToken');

  const fetchApi = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const load = useCallback(async () => {
    const data = await fetchApi('/ops/incidents/center');
    setCenter(data);
  }, [fetchApi]);

  const loadDetail = useCallback(
    async (id: string) => {
      const data = await fetchApi(`/ops/incidents/${id}`);
      setSelected(data);
      setTimeline(data.timeline ?? []);
    },
    [fetchApi],
  );

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  async function resolve() {
    if (!selected || !resolveNote.trim()) return;
    await fetchApi(`/ops/incidents/${selected.id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note: resolveNote }),
    });
    setResolveNote('');
    setSelected(null);
    load();
  }

  async function setStatus(status: Status) {
    if (!selected) return;
    await fetchApi(`/ops/incidents/${selected.id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    load();
    loadDetail(selected.id);
  }

  const list =
    center?.incidents.filter((i) => filter === 'all' || i.severity === filter) ?? [];

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title="Operator" items={adminNav} accent="OPS" />
      <main className="p-4 md:p-6">
        <h1 className="text-xl font-bold">Incident center</h1>
        {center && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Stat label="Ochiq" value={center.stats.open} />
            <Stat label="Jarayonda" value={center.stats.inProgress} />
            <Stat label="Kritik" value={center.stats.critical} alert />
            <Stat label="Bugun yopilgan" value={center.stats.resolvedToday} />
          </div>
        )}

        <div className="flex gap-2 mt-4 flex-wrap">
          {(['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full touch-auto min-h-0 ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100'
              }`}
            >
              {f === 'all' ? 'Hammasi' : f}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <section className="lg:col-span-2 space-y-2 max-h-[75vh] overflow-y-auto">
            {list.map((inc) => (
              <button
                key={inc.id}
                type="button"
                onClick={() => loadDetail(inc.id)}
                className={`w-full text-left p-4 rounded-xl border bg-white touch-auto min-h-0 ${
                  selected?.id === inc.id ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-sm">{inc.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${severityColor[inc.severity]}`}>
                    {inc.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{inc.type.replace(/_/g, ' ')} · {inc.status}</p>
                {inc.order && (
                  <p className="text-xs mt-1">{inc.order.orderNumber} — {inc.order.restaurant?.name ?? inc.order.business?.name}</p>
                )}
              </button>
            ))}
            {list.length === 0 && <p className="text-sm text-gray-400">Hozircha incident yo&apos;q</p>}
          </section>

          <section className="bg-white rounded-2xl border p-4 space-y-3">
            {!selected ? (
              <p className="text-sm text-gray-400">Incident tanlang</p>
            ) : (
              <>
                <h2 className="font-bold text-sm">{selected.title}</h2>
                <p className="text-xs text-gray-600">{selected.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setStatus('IN_PROGRESS')}>
                    Boshlash
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus('DISMISSED')}>
                    Rad etish
                  </Button>
                </div>
                <Input placeholder="Yechim eslatmasi" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
                <Button size="sm" fullWidth disabled={!resolveNote.trim()} onClick={resolve}>
                  Yechilgan deb belgilash
                </Button>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mt-4">Timeline</h3>
                <ul className="text-xs space-y-2 max-h-48 overflow-y-auto">
                  {timeline.map((t, i) => (
                    <li key={i} className="border-l-2 border-gray-200 pl-2">
                      <span className="text-gray-400">{new Date(t.at).toLocaleTimeString('uz-UZ')}</span>
                      <span className="block">{t.action}</span>
                      {t.note && <span className="text-gray-500">{t.note}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full ${alert ? 'bg-red-100 text-red-800 font-bold' : 'bg-gray-100'}`}>
      {label}: {value}
    </span>
  );
}
