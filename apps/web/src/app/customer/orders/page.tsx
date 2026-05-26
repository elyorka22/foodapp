'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, ProductRowSkeleton, useToast } from '@foodmarket/ui';
import { apiClient, formatUzs, getToken, type OrderDetail } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';

const STATUS_UZ: Record<string, string> = {
  PENDING: 'Kutilmoqda',
  CONFIRMED: 'Tasdiqlandi',
  PREPARING: 'Tayyorlanmoqda',
  READY_FOR_PICKUP: 'Olib ketishga tayyor',
  COURIER_ASSIGNED: 'Kuryer tayinlandi',
  PICKED_UP: 'Olib ketildi',
  ON_THE_WAY: 'Yo\'lda',
  DELIVERED: 'Yetkazildi',
  CANCELLED: 'Bekor qilindi',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .orders(token)
      .then((r) => setOrders(r.items))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  async function reorder(id: string) {
    try {
      const token = getToken() ?? (await apiClient.guestAuth()).accessToken;
      const order = await apiClient.reorder(id, token);
      toast('Savatga qo\'shildi — checkoutga o\'ting', 'success');
      window.location.href = customerPath('/checkout');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28">
        <h1 className="text-xl font-bold">Buyurtmalarim</h1>
        {!getToken() && (
          <p className="text-sm text-gray-500 mt-2">
            <Link href={customerPath('/account')} className="text-brand-600">Kiring</Link> — tarixni ko&apos;rish uchun
          </p>
        )}
        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <ProductRowSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="mt-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📦</p>
            <p>Hali buyurtmalar yo&apos;q</p>
            <Link href={customerPath('/')} className="text-brand-600 font-medium mt-4 inline-block">Buyurtma berish</Link>
          </div>
        )}
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {o.restaurant?.name ?? o.business?.name}
                  </p>
                  <p className="text-xs text-brand-700 mt-1">{STATUS_UZ[o.status] ?? o.status}</p>
                </div>
                <p className="font-bold">{formatUzs(o.total)}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={customerPath(`/orders/${o.id}`)} className="flex-1">
                  <Button fullWidth size="sm" variant="secondary">Kuzatish</Button>
                </Link>
                {o.status === 'DELIVERED' && (
                  <Button size="sm" variant="ghost" onClick={() => reorder(o.id)}>
                    Qayta
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
