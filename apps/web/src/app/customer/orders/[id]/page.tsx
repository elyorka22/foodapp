'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { OrderTracker, ProductRowSkeleton } from '@foodmarket/ui';
import type { OrderStatus } from '@foodmarket/shared-types';
import { apiClient, formatUzs, type OrderDetail } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [courierPos, setCourierPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.order(id).then(setOrder).catch(() => setOrder(null)).finally(() => setLoading(false));
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
    return () => {
      socket.disconnect();
    };
  }, [id]);

  if (loading) {
    return (
      <MobileShell>
        <div className="px-4 py-6 space-y-3">
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </div>
      </MobileShell>
    );
  }

  if (!order) {
    return (
      <MobileShell>
        <div className="p-8 text-center text-gray-500">{t('orderDetail.loading')}</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28 max-w-lg mx-auto">
        <Link href={customerPath('/orders')} className="text-brand-600 text-sm font-medium">
          ← {t('orderDetail.back')}
        </Link>
        <h1 className="text-xl font-bold mt-4">{t('orderDetail.title', { number: order.orderNumber })}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {order.distanceKm != null && `${order.distanceKm} km · `}
          {t('orderDetail.liveTracking')}
        </p>

        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <OrderTracker currentStatus={order.status as OrderStatus} />
        </div>

        {courierPos && (
          <div className="mt-4 p-4 bg-brand-50 rounded-2xl border border-brand-100">
            <p className="text-sm font-medium text-brand-800">{t('orderDetail.courierLocation')}</p>
            <p className="text-xs text-brand-600 mt-1">
              {courierPos.lat.toFixed(4)}, {courierPos.lng.toFixed(4)}
            </p>
            <div className="mt-3 h-32 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 text-sm">
              {t('orderDetail.mapPlaceholder')}
            </div>
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
          <h2 className="font-semibold mb-2">{t('orderDetail.items')}</h2>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span className="font-medium">{formatUzs(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3 pt-2 border-t border-gray-100">
            <span>{t('orderDetail.itemsTotal')}</span>
            <span>{formatUzs(order.total)}</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
