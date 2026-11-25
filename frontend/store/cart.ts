"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api";
import { canWrite } from "@/lib/session";
import type { Cart, DiscountPreview, OrderResult, Product } from "@/lib/types";
import { useAuth } from "@/store/auth";

/**
 * One cart for every visitor. With a session that can write, it is the
 * server cart. Without one (no account, or the read-only demo), the cart lives
 * in the browser, so anyone can shop the demo without signing up. Coupons are
 * checked by the API in both cases.
 */

interface GuestItem {
  product_id: string;
  slug: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  stock: number;
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  count: number;
  guest: GuestItem[];
  refresh: () => Promise<void>;
  add: (product: Product, quantity: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  preview: (code: string) => Promise<DiscountPreview>;
  checkout: (code?: string) => Promise<OrderResult>;
}

const isGuest = () => !canWrite(useAuth.getState().token);

function countItems(cart: Cart | null): number {
  return cart ? cart.items.reduce((acc, it) => acc + it.quantity, 0) : 0;
}

function guestCart(items: GuestItem[]): Cart {
  const lines = items.map((it) => ({
    id: it.product_id,
    product_id: it.product_id,
    slug: it.slug,
    name: it.name,
    image_url: "",
    unit_price_cents: it.unit_price_cents,
    quantity: it.quantity,
    line_total_cents: it.unit_price_cents * it.quantity,
    stock: it.stock,
    current_price_cents: it.unit_price_cents,
  }));
  return {
    id: "invitado",
    items: lines,
    subtotal_cents: lines.reduce((sum, l) => sum + l.line_total_cents, 0),
    currency: "MXN",
  };
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      const setGuest = (guest: GuestItem[]) => {
        const cart = guestCart(guest);
        set({ guest, cart, count: countItems(cart) });
      };

      return {
        cart: null,
        loading: false,
        count: 0,
        guest: [],

        refresh: async () => {
          if (isGuest()) {
            setGuest(get().guest);
            return;
          }
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

        add: async (product, quantity) => {
          if (!isGuest()) {
            await api.addToCart(product.id, quantity);
            return get().refresh();
          }
          const guest = [...get().guest];
          const line = guest.find((it) => it.product_id === product.id);
          if (line) line.quantity = Math.min(product.stock, line.quantity + quantity);
          else
            guest.push({
              product_id: product.id,
              slug: product.slug,
              name: product.name,
              unit_price_cents: product.price_cents,
              quantity: Math.min(product.stock, quantity),
              stock: product.stock,
            });
          setGuest(guest);
        },

        update: async (itemId, quantity) => {
          if (!isGuest()) {
            await api.updateCartItem(itemId, quantity);
            return get().refresh();
          }
          setGuest(
            get().guest.map((it) =>
              it.product_id === itemId ? { ...it, quantity: Math.min(it.stock, quantity) } : it,
            ),
          );
        },

        remove: async (itemId) => {
          if (!isGuest()) {
            await api.removeCartItem(itemId);
            return get().refresh();
          }
          setGuest(get().guest.filter((it) => it.product_id !== itemId));
        },

        preview: async (code) => {
          if (!isGuest()) return api.applyDiscount(code);
          return api.previewDiscount(code, guestCart(get().guest).subtotal_cents);
        },

        checkout: async (code) => {
          if (!isGuest()) {
            const result = await api.checkout(code);
            await get().refresh();
            return result;
          }
          // Demo checkout: the order is shown but nothing is saved or charged.
          const cart = guestCart(get().guest);
          const discount = code ? await get().preview(code) : null;
          const result: OrderResult = {
            order: {
              id: `demo-${Date.now().toString(36)}`,
              subtotal_cents: cart.subtotal_cents,
              discount_cents: discount?.discount_cents ?? 0,
              total_cents: discount?.total_cents ?? cart.subtotal_cents,
              discount_code: discount?.code ?? null,
              status: "demo",
              created_at: new Date().toISOString(),
            },
            items: cart.items.map((it) => ({
              id: it.id,
              product_id: it.product_id,
              product_name: it.name,
              quantity: it.quantity,
              unit_price_cents: it.unit_price_cents,
            })),
          };
          setGuest([]);
          return result;
        },
      };
    },
    { name: "electroshop_guest_cart", partialize: (state) => ({ guest: state.guest }) },
  ),
);
