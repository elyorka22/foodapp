'use client';

import { useEffect, useRef, useState } from 'react';
import { Sidebar, Badge, Button } from '@foodmarket/ui';
import { getRestaurantNav } from '@/lib/restaurant-nav';
import { orderStatus, t } from '@/i18n';

import { API_URL } from '@/lib/api';

const STATUS_FLOW: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
};

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: { name: string; quantity: number }[];
  createdAt: string;
}

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const prevCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function getToken() {
    return localStorage.getItem('accessToken');
  }

  async function load() {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/orders?limit=30`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const pending = data.items.filter((o: Order) =>
      ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status),
    );
    if (pending.length > prevCount.current && prevCount.current > 0) {
      audioRef.current?.play().catch(() => {});
    }
    prevCount.current = pending.length;
    setOrders(pending);
  }

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdHivbpeIgW1nW1x8m5B8h3lpWmB1jp2Ec3BiaYyRh4BqX2B1k5F+dm1sgH6Tl4B6e3B4h4B6e3B4');
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  async function advance(id: string, status: string) {
    const token = getToken();
    await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('restaurantPanel.nav.dashboard')} items={getRestaurantNav()} />
      <main className="p-6">
        <h1 className="text-2xl font-bold">{t('restaurantPanel.ordersQueue')}</h1>
        <p className="text-sm text-gray-500">{t('restaurantPanel.soundHint')}</p>
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border p-4">
              <div className="flex justify-between">
                <span className="font-bold">{o.orderNumber}</span>
                <Badge>{orderStatus(o.status)}</Badge>
              </div>
              <ul className="text-sm mt-2 text-gray-600">
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    {i.quantity}× {i.name}
                  </li>
                ))}
              </ul>
              {STATUS_FLOW[o.status] && (
                <Button size="sm" className="mt-3" onClick={() => advance(o.id, STATUS_FLOW[o.status])}>
                  → {orderStatus(STATUS_FLOW[o.status])}
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
