'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Input, useToast } from '@foodmarket/ui';
import { useCart } from '@/store/cart';
import { apiClient, formatUzs } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

export default function CartPage() {
  const { items, vendorName, vendorId, vendorType, subtotal, updateQty, removeItem, clear } = useCart();
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sub = subtotal();
  const deliveryFee = 15000;
  const total = sub + deliveryFee - discount;

  async function applyPromo() {
    try {
      const res = await apiClient.validatePromo(promo, sub);
      setDiscount(res.discount);
    } catch {
      toast(t('cart.invalidPromo'), 'error');
    }
  }

  async function checkout() {
    setLoading(true);
    try {
      const { accessToken } = await apiClient.guestAuth();
      const order = await apiClient.createOrder(
        {
          [vendorType === 'restaurant' ? 'restaurantId' : 'businessId']: vendorId,
          deliveryAddressId: 'seed-address-id',
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          guestEmail: 'guest@example.com',
          guestName: 'Mehmon',
          promoCode: promo || undefined,
        },
        accessToken,
      ) as { id: string };
      clear();
      window.location.href = customerPath(`/orders/${order.id}`);
    } catch (e) {
      toast((e as Error).message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <MobileShell>
        <div className="p-10 text-center max-w-lg mx-auto">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-gray-600 font-medium">{t('cart.empty')}</p>
          <Link href={customerPath('/')} className="text-brand-600 font-semibold mt-4 inline-block">
            {t('cart.browse')}
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-32 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">{t('cart.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{vendorName}</p>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between items-center bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-brand-700 font-bold mt-0.5">{formatUzs(item.price)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQty(item.productId, Math.max(1, item.quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-gray-100 font-bold text-gray-700 touch-auto min-h-0 min-w-0"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.productId, item.quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-gray-100 font-bold text-gray-700 touch-auto min-h-0 min-w-0"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-red-500 text-xs font-semibold ml-1 touch-auto min-h-0 min-w-0"
                >
                  {t('common.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Input placeholder={t('cart.promoPlaceholder')} value={promo} onChange={(e) => setPromo(e.target.value)} />
          <Button variant="secondary" onClick={applyPromo} className="shrink-0 touch-auto min-h-0">
            {t('common.apply')}
          </Button>
        </div>

        <div className="mt-6 space-y-2 text-sm bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{formatUzs(sub)}</span></div>
          <div className="flex justify-between"><span>{t('cart.delivery')}</span><span>{formatUzs(deliveryFee)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-brand-600">
              <span>{t('cart.discount')}</span><span>-{formatUzs(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
            <span>{t('cart.total')}</span><span>{formatUzs(total)}</span>
          </div>
        </div>

        <Button fullWidth className="mt-6" size="lg" onClick={checkout} disabled={loading}>
          {loading ? t('cart.placing') : t('cart.checkoutGuest')}
        </Button>
        <p className="text-xs text-center text-gray-400 mt-4">
          <Link href={customerPath('/account')} className="text-brand-600 font-semibold">
            {t('auth.signIn')}
          </Link>{' '}
          {t('cart.signInFaster')}
        </p>
      </div>
    </MobileShell>
  );
}
