'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { OrderTracker } from '@foodmarket/ui';
import type { OrderStatus } from '@foodmarket/shared-types';
import { apiClient, type OrderDetail } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [courierPos, setCourierPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    apiClient.order(id).then(setOrder).catch(() => setOrder(null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const socket = io(`${WS_URL}/tracking`, { transports: ['websocket'] });
    socket.emit('subscribe:order', id);
    socket.on('location:update', (data: { latitude: number; longitude: number }) => {
      setCourierPos({ lat: data.latitude, lng: data.longitude });
    });
    socket.on('order:status', (data: { status: string }) => {
      setOrder((o) => (o ? { ...o, status: data.status } : o));
    });
    return () => { socket.disconnect(); };
  }, [id]);

  if (!order) {
    return (
      <MobileShell>
        <div className="p-8 text-center text-gray-500">Loading order...</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28 max-w-lg mx-auto">
        <Link href="/orders" className="text-brand-600 text-sm font-medium">← Orders</Link>
        <h1 className="text-xl font-bold mt-4">Order {order.orderNumber}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {order.distanceKm != null && `${order.distanceKm} km · `}
          Est. delivery tracked live
        </p>

        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <OrderTracker currentStatus={order.status as OrderStatus} />
        </div>

        {courierPos && (
          <div className="mt-4 p-4 bg-brand-50 rounded-2xl">
            <p className="text-sm font-medium text-brand-800">Courier location (live)</p>
            <p className="text-xs text-brand-600 mt-1">
              {courierPos.lat.toFixed(4)}, {courierPos.lng.toFixed(4)}
            </p>
            <div className="mt-3 h-32 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 text-sm">
              Map integration ready (Google/Mapbox)
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Items</h2>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span>{item.quantity}× {item.name}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
