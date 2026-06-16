"use client";

import { create } from "zustand";

import { api } from "@/lib/api";
import type { Cart } from "@/lib/types";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  count: number;
  refresh: () => Promise<void>;
  clearLocal: () => void;
}

function countItems(cart: Cart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((acc, it) => acc + it.quantity, 0);
}

export const useCart = create<CartState>((set) => ({
  cart: null,
  loading: false,
  count: 0,
  refresh: async () => {
    set({ loading: true });
    try {
      const cart = await api.getCart();
      set({ cart, count: countItems(cart) });
    } catch {
      set({ cart: null, count: 0 });
    } finally {
      set({ loading: false });
    }
  },
  clearLocal: () => set({ cart: null, count: 0 }),
}));
