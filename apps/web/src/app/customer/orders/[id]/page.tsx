'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderTracker, ProductRowSkeleton } from '@foodmarket/ui';
import type { OrderStatus } from '@foodmarket/shared-types';
import { apiClient, formatUzs, type OrderDetail } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

const POLL_MS = 8000;

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = () => {
      apiClient
        .order(id)
        .then((o) => {
          if (!cancelled) setOrder(o);
        })
        .catch(() => {
          if (!cancelled) setOrder(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  const courierPos =
    order?.courier?.currentLat != null && order?.courier?.currentLng != null
      ? { lat: order.courier.currentLat, lng: order.courier.currentLng }
      : null;

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
              {courierPos.lat.toFixed(5)}, {courierPos.lng.toFixed(5)}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-2 text-sm">
          <p>
            <span className="text-gray-500">{t('orderDetail.total')}:</span>{' '}
            <strong>{formatUzs(order.total)}</strong>
          </p>
          {order.deliveryAddress && (
            <p className="text-gray-600">
              {order.deliveryAddress.street}, {order.deliveryAddress.city}
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
