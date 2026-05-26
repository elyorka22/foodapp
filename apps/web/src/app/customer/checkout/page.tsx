'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, useToast } from '@foodmarket/ui';
import { apiClient, formatUzs, getToken, type Address, type DeliveryQuote } from '@/lib/api';
import { useCart } from '@/store/cart';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';

const DEFAULT_ADDRESS = {
  label: 'Uy',
  street: 'Yunusobod 4-kvartal 12',
  district: 'Yunusobod',
  city: 'Tashkent',
  latitude: 41.3545,
  longitude: 69.2868,
};

export default function CheckoutPage() {
  const cart = useCart();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CLICK' | 'PAYME'>('CASH');
  const [loading, setLoading] = useState(false);
  const [guestPhone, setGuestPhone] = useState('+998');

  const sub = cart.subtotal();
  const deliveryFee = freeDelivery ? 0 : (quote?.deliveryFee ?? 15000);
  const total = sub + deliveryFee - discount;

  useEffect(() => {
    if (!cart.vendorLat || !cart.vendorLng) return;
    const dest = addresses.find((a) => a.id === selectedAddressId) ?? DEFAULT_ADDRESS;
    apiClient
      .deliveryQuote({
        vendorLat: cart.vendorLat,
        vendorLng: cart.vendorLng,
        destLat: dest.latitude,
        destLng: dest.longitude,
      })
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [cart.vendorLat, cart.vendorLng, selectedAddressId, addresses]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      apiClient.myAddresses(token).then(setAddresses).catch(() => setAddresses([]));
    }
  }, []);

  async function ensureAddress(token: string): Promise<string> {
    if (selectedAddressId) return selectedAddressId;
    const created = await apiClient.createAddress(
      addresses[0] ?? DEFAULT_ADDRESS,
      token,
    );
    return created.id;
  }

  async function placeOrder() {
    if (cart.items.length === 0) return;
    if (sub < cart.minOrderAmount) {
      toast(`Minimal buyurtma ${formatUzs(cart.minOrderAmount)}`, 'error');
      return;
    }
    setLoading(true);
    try {
      let token = getToken();
      if (!token) {
        const g = await apiClient.guestAuth();
        token = g.accessToken;
        localStorage.setItem('accessToken', token);
      }
      const addressId = await ensureAddress(token);
      const order = await apiClient.createOrder(
        {
          [cart.vendorType === 'restaurant' ? 'restaurantId' : 'businessId']: cart.vendorId,
          deliveryAddressId: addressId,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            optionIds: i.optionIds,
          })),
          guestPhone,
          notes: notes || undefined,
          promoCode: promo || undefined,
          paymentMethod,
        },
        token,
      );
      cart.clear();
      window.location.href = `${customerPath('/order/success')}?id=${order.id}&number=${order.orderNumber}`;
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function applyPromo() {
    try {
      const res = await apiClient.validatePromo(promo, sub);
      setDiscount(res.discount);
      setFreeDelivery(!!res.freeDelivery);
      toast('Promokod qo\'llandi', 'success');
    } catch {
      toast('Promokod noto\'g\'ri', 'error');
    }
  }

  if (cart.items.length === 0) {
    return (
      <MobileShell>
        <div className="p-8 text-center">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-gray-500">Savat bo&apos;sh</p>
          <Link href={customerPath('/')} className="text-brand-600 font-medium mt-4 inline-block">Bosh sahifa</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-32 max-w-lg mx-auto">
        <Link href={customerPath('/cart')} className="text-brand-600 text-sm font-medium">← Savat</Link>
        <h1 className="text-xl font-bold mt-4">Buyurtma</h1>
        <p className="text-sm text-gray-500">{cart.vendorName}</p>

        <section className="mt-6">
          <h2 className="font-semibold text-sm mb-2">Yetkazish manzili</h2>
          <div className="space-y-2">
            {(addresses.length ? addresses : [{ id: 'default', ...DEFAULT_ADDRESS, isDefault: true } as Address]).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAddressId(a.id === 'default' ? null : a.id)}
                className={`w-full text-left p-3 rounded-xl border ${
                  (selectedAddressId === a.id || (!selectedAddressId && a.id === 'default'))
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-sm">{a.label}</p>
                <p className="text-xs text-gray-500">{a.street}, {a.city}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <Input label="Telefon" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+998901234567" />
        </section>

        <section className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            rows={2}
            placeholder="Domofon, eshik oldi..."
          />
        </section>

        <section className="mt-4 flex gap-2">
          <Input placeholder="Promokod (SALOM20)" value={promo} onChange={(e) => setPromo(e.target.value)} />
          <Button variant="secondary" onClick={applyPromo}>Qo'llash</Button>
        </section>

        <section className="mt-4">
          <p className="text-sm font-semibold mb-2">To&apos;lov</p>
          <div className="flex gap-2">
            {(['CASH', 'CLICK', 'PAYME'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                  paymentMethod === m ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 space-y-2 text-sm bg-gray-50 rounded-2xl p-4">
          <div className="flex justify-between"><span>Jami mahsulot</span><span>{formatUzs(sub)}</span></div>
          <div className="flex justify-between"><span>Yetkazish {quote ? `(${quote.distanceKm} km)` : ''}</span><span>{formatUzs(deliveryFee)}</span></div>
          {discount > 0 && <div className="flex justify-between text-brand-600"><span>Chegirma</span><span>-{formatUzs(discount)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-2 border-t"><span>To&apos;lov</span><span>{formatUzs(total)}</span></div>
        </div>

        <Button fullWidth className="mt-6" onClick={placeOrder} disabled={loading}>
          {loading ? 'Buyurtma berilmoqda...' : 'Buyurtmani tasdiqlash'}
        </Button>
      </div>
    </MobileShell>
  );
}
