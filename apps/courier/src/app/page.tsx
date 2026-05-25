'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button, Badge } from '@foodmarket/ui';
import { api, formatUzs, getToken, WS } from '@/lib/api';
import { queueLocation, flushQueue, queueSize } from '@/lib/offline-queue';
import { useOnlineStatus } from '@foodmarket/ui';

interface CourierProfile {
  id: string;
  status: string;
  user: { firstName: string; phone: string };
}

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  distanceKm?: number;
  deliveryAddress: { street: string; city: string; latitude: number; longitude: number };
  restaurant?: { name: string };
}

export default function CourierPanel() {
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [earnings, setEarnings] = useState<{ totalEarnings: number; orders: number; totalKm: number } | null>(null);
  const [online, setOnline] = useState(false);
  const [lastPing, setLastPing] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<number | null>(null);
  const isOnline = useOnlineStatus();

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const me = await api<CourierProfile>('/couriers/me');
      setProfile(me);
      setOnline(me.status !== 'OFFLINE');
      const active = await api<ActiveOrder[]>('/couriers/me/orders');
      setOrders(active);
      const earn = await api<{ totalEarnings: number; orders: number; totalKm: number }>('/couriers/me/earnings');
      setEarnings(earn);
    } catch {
      /* not logged in */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendLocation = useCallback(
    (lat: number, lng: number, orderId?: string) => {
      if (!profile) return;
      const payload = { courierId: profile.id, latitude: lat, longitude: lng, orderId };
      if (!socketRef.current?.connected || !navigator.onLine) {
        queueLocation(payload);
        setQueuedCount(queueSize());
        return;
      }
      socketRef.current.emit('courier:location', payload);
      setLastPing(new Date().toLocaleTimeString('uz-UZ'));
    },
    [profile],
  );

  useEffect(() => {
    if (!online || !profile) {
      socketRef.current?.disconnect();
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      return;
    }

    const socket = io(`${WS}/tracking`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      api(`/couriers/${profile.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'AVAILABLE' }),
      }).catch(() => {});
      flushQueue(
        (item) => {
          socket.emit('courier:location', {
            courierId: item.courierId,
            latitude: item.latitude,
            longitude: item.longitude,
            orderId: item.orderId,
            clientTs: item.ts,
          });
        },
        { delayMs: 150 },
      );
    });

    socket.on('disconnect', () => {
      socket.io.opts.transports = ['polling', 'websocket'];
    });

    const pollFallback = setInterval(() => {
      if (!socket.connected) load();
    }, 15000);

    if ('geolocation' in navigator) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const activeOrder = orders[0];
          sendLocation(pos.coords.latitude, pos.coords.longitude, activeOrder?.id);
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 15000 },
      );
    } else {
      const interval = setInterval(() => {
        sendLocation(41.2995 + (Math.random() - 0.5) * 0.008, 69.24 + (Math.random() - 0.5) * 0.008, orders[0]?.id);
      }, 8000);
      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }

    return () => {
      clearInterval(pollFallback);
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      socket.disconnect();
    };
  }, [online, profile, orders, sendLocation, load]);

  async function toggleOnline() {
    if (!profile) {
      alert('courier@foodmarket.uz bilan kiring');
      return;
    }
    const next = !online;
    const status = next ? 'AVAILABLE' : 'OFFLINE';
    await api(`/couriers/${profile.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setOnline(next);
  }

  async function advanceOrder(orderId: string, status: string) {
    await api(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  }

  const stepMap: Record<string, string> = {
    COURIER_ASSIGNED: 'PICKED_UP',
    PICKED_UP: 'ON_THE_WAY',
    ON_THE_WAY: 'DELIVERED',
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 pb-8 bg-gray-50">
      <header className="flex justify-between items-center py-4">
        <h1 className="text-xl font-bold">Kuryer</h1>
        <div className="flex gap-2">
          {!isOnline && <Badge variant="warning">Internet yo&apos;q</Badge>}
          <Badge variant={online ? 'success' : 'default'}>{online ? 'Onlayn' : 'Oflayn'}</Badge>
        </div>
      </header>

      {earnings && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-3 border text-center">
            <p className="text-xs text-gray-500">Daromad</p>
            <p className="font-bold text-sm">{formatUzs(earnings.totalEarnings)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border text-center">
            <p className="text-xs text-gray-500">Yetkazish</p>
            <p className="font-bold text-sm">{earnings.orders}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border text-center">
            <p className="text-xs text-gray-500">Km</p>
            <p className="font-bold text-sm">{earnings.totalKm}</p>
          </div>
        </div>
      )}

      <Button fullWidth onClick={toggleOnline} variant={online ? 'danger' : 'primary'}>
        {online ? 'Oflayn bo\'lish' : 'Onlayn bo\'lish'}
      </Button>
      {lastPing && <p className="text-xs text-center text-gray-400 mt-2">GPS: {lastPing}</p>}
      {queuedCount > 0 && (
        <p className="text-xs text-center text-amber-600 mt-1">{queuedCount} GPS navbatda (sinxronlash)</p>
      )}

      <section className="mt-6 space-y-3">
        <h2 className="font-semibold">Faol buyurtmalar</h2>
        {orders.length === 0 && <p className="text-sm text-gray-500">Buyurtmalar yo&apos;q</p>}
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl p-4 border">
            <p className="font-bold">{o.orderNumber}</p>
            <p className="text-sm text-gray-500">{o.restaurant?.name}</p>
            <p className="text-xs mt-1">{o.deliveryAddress.street}</p>
            <p className="text-sm font-semibold text-brand-700 mt-2">{formatUzs(o.total)}</p>
            {stepMap[o.status] && (
              <Button
                fullWidth
                className="mt-3"
                size="sm"
                onClick={() => advanceOrder(o.id, stepMap[o.status])}
              >
                Keyingi: {stepMap[o.status].replace(/_/g, ' ')}
              </Button>
            )}
          </div>
        ))}
      </section>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Login: courier@foodmarket.uz / Password123!
      </p>
    </div>
  );
}
