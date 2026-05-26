'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Input } from '@foodmarket/ui';
import { useCart } from '@/store/cart';
import { apiClient } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';

export default function CartPage() {
  const { items, vendorName, vendorId, vendorType, subtotal, updateQty, removeItem, clear } = useCart();
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  const sub = subtotal();
  const deliveryFee = 2.99;
  const total = sub + deliveryFee - discount;

  async function applyPromo() {
    try {
      const res = await apiClient.validatePromo(promo, sub);
      setDiscount(res.discount);
    } catch {
      alert('Invalid promo code');
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
          guestName: 'Guest',
          promoCode: promo || undefined,
        },
        accessToken,
      ) as { id: string };
      clear();
      window.location.href = customerPath(`/orders/${order.id}`);
    } catch (e) {
      alert((e as Error).message || 'Checkout failed — ensure API is running');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <MobileShell>
        <div className="p-8 text-center">
          <p className="text-gray-500">Your cart is empty</p>
          <Link href={customerPath('/')} className="text-brand-600 font-medium mt-2 inline-block">Browse stores</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-32 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">Your cart</h1>
        <p className="text-sm text-gray-500">{vendorName}</p>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between items-center bg-white rounded-xl p-3 border">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-brand-700">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.productId, Math.max(1, item.quantity - 1))} className="w-8 h-8 rounded-lg bg-gray-100">−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-gray-100">+</button>
                <button onClick={() => removeItem(item.productId)} className="text-red-500 text-sm ml-2">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Input placeholder="Promo code" value={promo} onChange={(e) => setPromo(e.target.value)} />
          <Button variant="secondary" onClick={applyPromo}>Apply</Button>
        </div>

        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${sub.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>${deliveryFee.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between text-brand-600"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>

        <Button fullWidth className="mt-6" onClick={checkout} disabled={loading}>
          {loading ? 'Placing order...' : 'Checkout as guest'}
        </Button>
        <p className="text-xs text-center text-gray-400 mt-3">
          <Link href={customerPath('/account')} className="text-brand-600">Sign in</Link> for faster checkout
        </p>
      </div>
    </MobileShell>
  );
}
