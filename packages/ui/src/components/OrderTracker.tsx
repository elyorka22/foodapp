'use client';

import { ORDER_STATUS_LABELS, type OrderStatus } from '@foodmarket/shared-types';

const PIPELINE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COURIER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
];

export function OrderTracker({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = PIPELINE.indexOf(currentStatus);
  return (
    <div className="space-y-0">
      {PIPELINE.map((status, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${done ? 'bg-brand-600' : 'bg-gray-200'} ${active ? 'ring-4 ring-brand-100' : ''}`}
              />
              {i < PIPELINE.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${done && i < currentIndex ? 'bg-brand-600' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className={`pb-4 ${active ? 'font-semibold text-brand-700' : done ? 'text-gray-700' : 'text-gray-400'}`}>
              <p className="text-sm">{ORDER_STATUS_LABELS[status]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
