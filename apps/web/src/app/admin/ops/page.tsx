'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sidebar, Button, Input } from '@foodmarket/ui';
import { getAdminNav } from '@/lib/admin-nav';
import { orderStatus, t } from '@/i18n';
import { checkCriticalAlert } from '@/lib/ops-alerts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type UrgencyLevel = 'normal' | 'warning' | 'critical';

interface BoardOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  guestPhone?: string;
  courierId?: string | null;
  urgency: { level: UrgencyLevel; minutesWaiting: number; reason?: string };
  sla: {
    deadline: string;
    remainingMinutes: number;
    overdueMinutes: number;
    breached: boolean;
    percentElapsed: number;
    label: 'ok' | 'warning' | 'breached';
  };
  restaurant?: { name: string; isOpen?: boolean };
  business?: { name: string; isOpen?: boolean };
  courier?: { id: string; user?: { firstName: string; phone?: string } };
}

interface LiveBoard {
  orders: BoardOrder[];
  byStatus: { status: string; count: number; orders: BoardOrder[] }[];
  couriers: {
    id: string;
    status: string;
    activeOrders: number;
    idleMinutes?: number;
    idleWarning?: boolean;
    currentLat?: number;
    currentLng?: number;
    user: { firstName: string; phone?: string };
  }[];
  stats: { total: number; critical: number; unassignedReady: number; slaBreached?: number };
  updatedAt: string;
}

interface DispatchSuggestion {
  courierId: string;
  name: string;
  phone?: string;
  status: string;
  score: number;
  distanceKm: number;
  activeOrders: number;
  reasons: string[];
}

interface RestaurantRow {
  id: string;
  name: string;
  isOpen: boolean;
  activeOrders: number;
  oldestWaitMin: number;
  responseTimerMin?: number;
  responseWarning?: boolean;
  needsAttention: boolean;
}

function formatUzs(n: number) {
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`;
}

function urgencyClass(level: UrgencyLevel) {
  if (level === 'critical') return 'border-red-500 bg-red-50';
  if (level === 'warning') return 'border-amber-400 bg-amber-50';
  return 'border-gray-200 bg-white';
}

function urgencyBadge(level: UrgencyLevel) {
  if (level === 'critical') return 'bg-red-600 text-white';
  if (level === 'warning') return 'bg-amber-500 text-white';
  return 'bg-gray-200 text-gray-700';
}

function liveSlaLabel(sla: BoardOrder['sla'], _tick: number) {
  if (!sla) return '—';
  const remMs = new Date(sla.deadline).getTime() - Date.now();
  if (remMs < 0) return `+${Math.ceil(-remMs / 60_000)}m`;
  return `${Math.ceil(remMs / 60_000)}m SLA`;
}

export default function OpsLivePage() {
  const [board, setBoard] = useState<LiveBoard | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [queues, setQueues] = useState<Record<string, unknown> | null>(null);
  const [suggestions, setSuggestions] = useState<DispatchSuggestion[]>([]);
  const [tab, setTab] = useState<'board' | 'restaurants' | 'queues'>('board');
  const [courierId, setCourierId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [tick, setTick] = useState(0);
  const selectedRef = useRef<string | null>(null);

  const token = () => localStorage.getItem('accessToken');

  const authFetch = useCallback(async (path: string, init?: RequestInit) => {
    const accessToken = token();
    if (!accessToken) throw new Error(t('admin.ops.loginRequired'));
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const loadBoard = useCallback(async () => {
    const data = await authFetch('/ops/live-board');
    setBoard(data);
  }, [authFetch]);

  const loadRestaurants = useCallback(async () => {
    const data = await authFetch('/ops/restaurants');
    setRestaurants(data);
  }, [authFetch]);

  const loadQueues = useCallback(async () => {
    const data = await authFetch('/ops/queues');
    setQueues(data);
  }, [authFetch]);

  const loadSuggestions = useCallback(
    async (orderId: string) => {
      try {
        const data = await authFetch(`/ops/orders/${orderId}/dispatch-suggest`);
        setSuggestions(Array.isArray(data) ? data : (data.suggestions ?? []));
      } catch {
        setSuggestions([]);
      }
    },
    [authFetch],
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadBoard(), loadRestaurants(), loadQueues()]);
      if (selectedRef.current) await loadSuggestions(selectedRef.current);
      setFlash(t('admin.ops.refreshed'));
      setTimeout(() => setFlash(null), 1500);
    } finally {
      setLoading(false);
    }
  }, [loadBoard, loadRestaurants, loadQueues, loadSuggestions]);

  useEffect(() => {
    refreshAll();
    const iv = setInterval(refreshAll, 5000);
    const tickIv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(iv);
      clearInterval(tickIv);
    };
  }, [refreshAll]);

  useEffect(() => {
    if (board) checkCriticalAlert(board.stats.critical, soundOn);
  }, [board?.stats.critical, soundOn]);

  useEffect(() => {
    selectedRef.current = selectedOrder;
    if (selectedOrder) loadSuggestions(selectedOrder);
    else setSuggestions([]);
  }, [selectedOrder, loadSuggestions]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r') {
        e.preventDefault();
        refreshAll();
      }
      if (e.key === 'a' && suggestions[0] && selectedOrder) {
        e.preventDefault();
        setCourierId(suggestions[0].courierId);
      }
      if (e.key === 'Escape') setSelectedOrder(null);
      if (e.key === '1' && board?.orders[0]) {
        e.preventDefault();
        setSelectedOrder(board.orders[0].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [refreshAll, suggestions, selectedOrder, board?.orders]);

  async function opsPost(path: string, body: unknown) {
    await authFetch(`/ops/orders/${selectedOrder}${path}`, { method: 'POST', body: JSON.stringify(body) });
    await refreshAll();
  }

  const selected = board?.orders.find((o) => o.id === selectedOrder);

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('roles.operator')} items={getAdminNav()} accent="OPS" />
      <main className="p-4 md:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{t('admin.ops.title')}</h1>
            <p className="text-xs text-gray-500 mt-1">
              <kbd className="px-1 bg-gray-100 rounded">R</kbd> {t('admin.ops.shortcuts')} ·{' '}
              <kbd className="px-1 bg-gray-100 rounded">A</kbd> {t('admin.ops.courierKey')} ·{' '}
              <kbd className="px-1 bg-gray-100 rounded">1</kbd> {t('admin.ops.firstOrderKey')} ·{' '}
              <Link href="/admin/incidents" className="text-brand-600 underline">{t('admin.ops.incidentsLink')}</Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {flash && <span className="text-xs text-green-600 font-medium">{flash}</span>}
            {board && (
              <>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                  {t('admin.ops.activeStats', {
                    total: board.stats.total,
                    critical: board.stats.critical,
                    unassigned: board.stats.unassignedReady,
                  })}
                </span>
                {(board.stats.slaBreached ?? 0) > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white animate-pulse">
                    {t('admin.ops.slaBreached', { count: board.stats.slaBreached ?? 0 })}
                  </span>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setSoundOn((s) => !s)}
              className="text-xs px-2 py-1 rounded border touch-auto min-h-0"
            >
              {soundOn ? '🔔' : '🔕'}
            </button>
            <Button size="sm" variant="secondary" onClick={refreshAll} disabled={loading}>
              {loading ? '...' : t('admin.ops.refresh')}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 border-b">
          {(['board', 'restaurants', 'queues'] as const).map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px touch-auto min-h-0 ${
                tab === tabId ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500'
              }`}
            >
              {tabId === 'board'
                ? t('admin.ops.tabOrders')
                : tabId === 'restaurants'
                  ? t('admin.ops.tabRestaurants')
                  : t('admin.ops.tabQueues')}
            </button>
          ))}
        </div>

        {tab === 'board' && (
          <div className="grid lg:grid-cols-4 gap-4 mt-4">
            <section className="lg:col-span-3 overflow-x-auto">
              <div className="flex gap-3 min-w-max pb-2">
                {board?.byStatus.map((col) => (
                  <div key={col.status} className="w-56 shrink-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold uppercase text-gray-500">{orderStatus(col.status)}</h3>
                      <span className="text-xs bg-gray-200 rounded-full px-2">{col.count}</span>
                    </div>
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                      {col.orders.map((o) => {
                        const delayed = o.sla?.breached || o.urgency.level === 'critical';
                        const slaLabel = liveSlaLabel(o.sla, tick);
                        return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setSelectedOrder(o.id)}
                          className={`w-full text-left p-3 rounded-xl border transition touch-auto min-h-0 ${urgencyClass(o.urgency.level)} ${
                            selectedOrder === o.id ? 'ring-2 ring-brand-500' : ''
                          } ${delayed ? 'animate-pulse' : ''}`}
                        >
                          <div className="flex justify-between gap-1">
                            <span className="font-bold text-sm">{o.orderNumber}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                o.sla?.breached ? 'bg-red-600 text-white' : urgencyBadge(o.urgency.level)
                              }`}
                            >
                              {slaLabel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{o.restaurant?.name ?? o.business?.name}</p>
                          <p className="text-xs font-semibold text-brand-700">{formatUzs(o.total)}</p>
                          {o.courier?.user && (
                            <p className="text-[10px] text-gray-500">🛵 {o.courier.user.firstName}</p>
                          )}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="bg-white rounded-2xl border p-3 max-h-48 overflow-auto">
                <h2 className="font-semibold text-xs text-gray-500 uppercase">{t('admin.ops.couriers')}</h2>
                {board?.couriers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourierId(c.id)}
                    className={`w-full text-left p-2 mt-1 rounded-lg text-xs touch-auto min-h-0 ${
                      courierId === c.id ? 'bg-brand-50 border border-brand-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{c.user.firstName}</span> · {c.status}
                    <span className="text-gray-400 block">{t('admin.ops.activeCount', { count: c.activeOrders })}</span>
                    {c.idleWarning && (
                      <span className="text-amber-600 block">{t('admin.ops.waitingIdle', { min: c.idleMinutes ?? 0 })}</span>
                    )}
                  </button>
                ))}
              </div>

              {selected && (
                <div className="bg-white rounded-2xl border p-4 space-y-2">
                  <h2 className="font-semibold text-sm">{selected.orderNumber}</h2>
                  <p className="text-xs text-gray-500">{orderStatus(selected.status)} · {selected.guestPhone ?? '—'}</p>

                  {suggestions.length > 0 && (
                    <div className="border rounded-xl p-2 bg-brand-50/50">
                      <p className="text-xs font-semibold text-brand-800">{t('admin.ops.dispatchSuggest')}</p>
                      {suggestions.slice(0, 3).map((s, i) => (
                        <button
                          key={s.courierId}
                          type="button"
                          onClick={() => setCourierId(s.courierId)}
                          className="w-full text-left mt-1 p-2 rounded-lg bg-white border text-xs touch-auto min-h-0"
                        >
                          {i === 0 && <span className="text-brand-600 font-bold">★ </span>}
                          {s.name} — {t('admin.ops.scoreBall', { score: s.score })} · {s.distanceKm.toFixed(1)} km
                          <span className="block text-gray-400">{s.reasons.join(', ')}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Input placeholder={t('admin.ops.courierIdPlaceholder')} value={courierId} onChange={(e) => setCourierId(e.target.value)} />
                  <Button size="sm" fullWidth disabled={!courierId} onClick={() => opsPost('/assign-courier', { courierId })}>
                    {t('admin.ops.assign')}
                  </Button>
                  <Button
                    size="sm"
                    fullWidth
                    variant="secondary"
                    disabled={!courierId}
                    onClick={() => opsPost('/reassign-courier', { courierId, note })}
                  >
                    {t('admin.ops.reassign')}
                  </Button>
                  <Button size="sm" fullWidth variant="ghost" onClick={() => opsPost('/retry-delivery', { note: note || t('common.retry') })}>
                    {t('admin.ops.retryDelivery')}
                  </Button>
                  <Input placeholder={t('admin.ops.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button size="sm" fullWidth variant="ghost" disabled={!note} onClick={() => opsPost('/note', { note })}>
                    {t('admin.ops.addNote')}
                  </Button>
                  <Input placeholder={t('admin.ops.reasonPlaceholder')} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                  <Button size="sm" fullWidth variant="danger" disabled={!cancelReason} onClick={() => opsPost('/emergency-cancel', { reason: cancelReason })}>
                    {t('admin.ops.emergencyCancel')}
                  </Button>
                  <Button size="sm" fullWidth variant="danger" disabled={!cancelReason} onClick={() => opsPost('/mark-failed', { reason: cancelReason })}>
                    {t('admin.ops.markFailed')}
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'restaurants' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border ${r.needsAttention ? 'border-red-400 bg-red-50' : 'bg-white'}`}
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold">{r.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${r.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>
                    {r.isOpen ? t('admin.ops.open') : t('admin.ops.closed')}
                  </span>
                </div>
                <p className="text-sm mt-2">{t('admin.ops.activeOrders', { count: r.activeOrders })}</p>
                {r.oldestWaitMin > 0 && (
                  <p className="text-xs text-amber-700">{t('admin.ops.longestWait', { min: r.oldestWaitMin })}</p>
                )}
                {r.responseWarning && (
                  <p className="text-xs text-red-600 font-medium animate-pulse">
                    {t('admin.ops.responsePending', { min: r.responseTimerMin ?? 0 })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'queues' && queues && (
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            {['orders', 'notifications', 'telegram'].map((name) => {
              const q = (queues as Record<string, Record<string, number>>)[name];
              return (
                <div key={name} className="bg-white rounded-xl border p-4">
                  <h3 className="font-semibold capitalize">{name}</h3>
                  <ul className="mt-2 text-sm space-y-1 text-gray-600">
                    {q &&
                      Object.entries(q).map(([k, v]) => (
                        <li key={k} className="flex justify-between">
                          <span>{k}</span>
                          <span className="font-mono">{v}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
