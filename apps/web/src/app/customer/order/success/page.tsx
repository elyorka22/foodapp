'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@foodmarket/ui';
import { customerPath } from '@/lib/paths';

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get('id');
  const number = params.get('number');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-4xl mb-6">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Buyurtma qabul qilindi!</h1>
      {number && <p className="text-brand-700 font-semibold mt-2">{number}</p>}
      <p className="text-gray-500 text-sm mt-3 max-w-xs">
        Restoran buyurtmangizni tayyorlaydi. Holatni kuzatishingiz mumkin.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
        {id && (
          <Link href={customerPath(`/orders/${id}`)}>
            <Button fullWidth>Buyurtmani kuzatish</Button>
          </Link>
        )}
        <Link href={customerPath('/orders')}>
          <Button fullWidth variant="secondary">Buyurtmalarim</Button>
        </Link>
        <Link href={customerPath('/')} className="text-sm text-gray-500 mt-2">
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Yuklanmoqda...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
