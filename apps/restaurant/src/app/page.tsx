'use client';

import { Sidebar, StatCard, Badge } from '@foodmarket/ui';

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Live orders' },
  { href: '/menu', label: 'Menu & products' },
  { href: '/hours', label: 'Opening hours' },
  { href: '/reviews', label: 'Reviews' },
];

const PIPELINE = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ASSIGNED'];

export default function RestaurantPanel() {
  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title="Restaurant" items={nav} accent="Partner" />
      <main className="p-6 md:p-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Green Bowl Kitchen</h1>
          <Badge variant="success">Open</Badge>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StatCard label="Orders today" value={12} />
          <StatCard label="Avg prep" value="25 min" />
          <StatCard label="Rating" value="4.8 ★" />
        </div>
        <section className="mt-8 bg-white rounded-2xl border p-6">
          <h2 className="font-semibold">Order pipeline</h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {PIPELINE.map((s) => (
              <span key={s} className="px-3 py-1.5 bg-brand-50 text-brand-800 rounded-lg text-xs font-medium">{s.replace(/_/g, ' ')}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">PATCH /orders/:id/status — restaurant owner JWT</p>
        </section>
        <section className="mt-6 bg-white rounded-2xl border p-6">
          <h2 className="font-semibold">Menu CRUD</h2>
          <p className="text-sm text-gray-500 mt-2">POST/PATCH/DELETE /api/v1/products · Manage menus via Prisma</p>
        </section>
      </main>
    </div>
  );
}
