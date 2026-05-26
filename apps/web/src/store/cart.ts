'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  optionIds?: string[];
}

interface CartState {
  vendorId: string | null;
  vendorType: 'restaurant' | 'business' | null;
  vendorName: string | null;
  vendorLat: number | null;
  vendorLng: number | null;
  minOrderAmount: number;
  items: CartItem[];
  bump: number;
  addItem: (
    item: CartItem,
    vendor: {
      id: string;
      type: 'restaurant' | 'business';
      name: string;
      lat: number;
      lng: number;
      minOrderAmount?: number;
    },
  ) => void;
  removeItem: (productId: string, optionIds?: string[]) => void;
  updateQty: (productId: string, qty: number, optionIds?: string[]) => void;
  clear: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

function itemKey(productId: string, optionIds?: string[]) {
  return `${productId}:${(optionIds ?? []).sort().join(',')}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      vendorId: null,
      vendorType: null,
      vendorName: null,
      vendorLat: null,
      vendorLng: null,
      minOrderAmount: 0,
      items: [],
      bump: 0,
      addItem: (item, vendor) => {
        const state = get();
        if (state.vendorId && state.vendorId !== vendor.id) {
          if (!confirm('Boshqa do\'kondan savat tozalanadi. Davom etasizmi?')) return;
          set({
            items: [],
            vendorId: vendor.id,
            vendorType: vendor.type,
            vendorName: vendor.name,
            vendorLat: vendor.lat,
            vendorLng: vendor.lng,
            minOrderAmount: vendor.minOrderAmount ?? 0,
          });
        }
        const key = itemKey(item.productId, item.optionIds);
        const existing = state.items.find(
          (i) => itemKey(i.productId, i.optionIds) === key,
        );
        let items: CartItem[];
        if (existing) {
          items = state.items.map((i) =>
            itemKey(i.productId, i.optionIds) === key
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          );
        } else {
          items = [...state.items, item];
        }
        set({
          items,
          vendorId: vendor.id,
          vendorType: vendor.type,
          vendorName: vendor.name,
          vendorLat: vendor.lat,
          vendorLng: vendor.lng,
          minOrderAmount: vendor.minOrderAmount ?? state.minOrderAmount,
          bump: state.bump + 1,
        });
      },
      removeItem: (productId, optionIds) =>
        set({
          items: get().items.filter(
            (i) => itemKey(i.productId, i.optionIds) !== itemKey(productId, optionIds),
          ),
        }),
      updateQty: (productId, qty, optionIds) =>
        set({
          items: get().items.map((i) =>
            itemKey(i.productId, i.optionIds) === itemKey(productId, optionIds)
              ? { ...i, quantity: qty }
              : i,
          ),
        }),
      clear: () =>
        set({
          items: [],
          vendorId: null,
          vendorType: null,
          vendorName: null,
          vendorLat: null,
          vendorLng: null,
          minOrderAmount: 0,
        }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'foodmarket-cart-uz' },
  ),
);
