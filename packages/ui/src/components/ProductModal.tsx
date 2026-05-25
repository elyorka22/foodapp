'use client';

import { useState } from 'react';
import { Button } from './Button';

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelect: number;
  options: ProductOption[];
}

export interface ProductModalProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  optionGroups?: ProductOptionGroup[];
}

export function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: ProductModalProduct;
  onClose: () => void;
  onAdd: (qty: number, optionIds: string[], unitPrice: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [adding, setAdding] = useState(false);

  const unitPrice = () => {
    let p = product.price;
    for (const g of product.optionGroups ?? []) {
      const ids = selected[g.id] ?? [];
      for (const opt of g.options) {
        if (ids.includes(opt.id)) p += opt.priceDelta;
      }
    }
    return p;
  };

  const toggleOption = (groupId: string, optionId: string, maxSelect: number) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (maxSelect === 1) return { ...prev, [groupId]: [optionId] };
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const canAdd = () => {
    for (const g of product.optionGroups ?? []) {
      if (g.required && !(selected[g.id]?.length)) return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!canAdd()) return;
    setAdding(true);
    const allOptionIds = Object.values(selected).flat();
    onAdd(qty, allOptionIds, unitPrice());
    setTimeout(() => {
      setAdding(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up safe-bottom">
        <div className="aspect-video bg-gradient-to-br from-brand-50 to-gray-100 flex items-center justify-center text-5xl">
          🍽️
        </div>
        <div className="p-5">
          <h2 className="text-xl font-bold">{product.name}</h2>
          {product.description && <p className="text-sm text-gray-500 mt-1">{product.description}</p>}
          <p className="text-lg font-bold text-brand-700 mt-2">{formatUzs(unitPrice())}</p>

          {(product.optionGroups ?? []).map((g) => (
            <div key={g.id} className="mt-4">
              <p className="text-sm font-semibold text-gray-800">
                {g.name} {g.required && <span className="text-red-500">*</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {g.options.map((opt) => {
                  const active = (selected[g.id] ?? []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(g.id, opt.id, g.maxSelect)}
                      className={`px-3 py-2 rounded-xl text-sm border transition ${
                        active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-200'
                      }`}
                    >
                      {opt.name}
                      {opt.priceDelta > 0 && ` +${formatUzs(opt.priceDelta)}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <button type="button" className="w-10 h-10 rounded-lg bg-white font-bold" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button type="button" className="w-10 h-10 rounded-lg bg-white font-bold" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <Button onClick={handleAdd} disabled={!canAdd() || adding} className={adding ? 'scale-95' : ''}>
              {adding ? 'Qo\'shildi ✓' : 'Savatga'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatUzs(n: number) {
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`;
}
