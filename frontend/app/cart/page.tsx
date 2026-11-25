"use client";

import Link from "next/link";

import ProductArt from "@/components/ProductArt";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DiscountPreview } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const { cart, refresh, loading } = useCart();

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<DiscountPreview | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !token) router.push("/login?next=/cart");
  }, [hydrated, token, router]);

  useEffect(() => {
    if (token) refresh();
  }, [token, refresh]);

  async function changeQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    try {
      await api.updateCartItem(itemId, quantity);
      await refresh();
      setDiscount(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error");
    }
  }

  async function remove(itemId: string) {
    await api.removeCartItem(itemId);
    await refresh();
    setDiscount(null);
  }

  async function applyDiscount() {
    setDiscountError(null);
    setDiscount(null);
    try {
      const res = await api.applyDiscount(code);
      setDiscount(res);
    } catch (e) {
      setDiscountError(e instanceof ApiError ? e.message : "Error");
    }
  }

  function goToCheckout() {
    const url = discount ? `/checkout?code=${encodeURIComponent(discount.code)}` : "/checkout";
    router.push(url);
  }

  if (!hydrated || loading) return <p>Cargando carrito...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-[28px] font-medium tracking-[-0.01em]">Tu carrito</h1>
        <p className="text-gray-500">El carrito está vacío.</p>
        <Link href="/" className="mt-4 inline-block text-brand hover:underline">
          ← Ver productos
        </Link>
      </div>
    );
  }

  const total = discount ? discount.total_cents : cart.subtotal_cents;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-[28px] font-medium tracking-[-0.01em]">Tu carrito</h1>
        <div className="space-y-3">
          {cart.items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-4 rounded-lg border bg-white p-3"
            >
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-[10px] border">
                <ProductArt name={it.name} />
              </div>
              <div className="flex-1">
                <Link
                  href={`/products/${it.slug}`}
                  className="font-medium hover:text-brand"
                >
                  {it.name}
                </Link>
                <p className="text-sm text-gray-500">
                  {formatMoney(it.unit_price_cents)} / ud.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeQty(it.id, it.quantity - 1)}
                  className="h-7 w-7 rounded border hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-8 text-center">{it.quantity}</span>
                <button
                  onClick={() => changeQty(it.id, it.quantity + 1)}
                  disabled={it.quantity >= it.stock}
                  className="h-7 w-7 rounded border hover:bg-gray-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <div className="w-24 text-right font-semibold">
                {formatMoney(it.line_total_cents)}
              </div>
              <button
                onClick={() => remove(it.id)}
                className="text-sm text-red-500 hover:underline"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Resumen</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-600">
            Código de descuento
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="DEMO10"
              className="flex-1 rounded border px-3 py-2 uppercase"
            />
            <button
              onClick={applyDiscount}
              className="rounded border px-3 py-2 hover:bg-gray-100"
            >
              Aplicar
            </button>
          </div>
          {discountError && (
            <p className="mt-1 text-sm text-red-600">{discountError}</p>
          )}
          {discount && (
            <p className="mt-1 text-sm text-green-600">
              Cupón {discount.code} aplicado.
            </p>
          )}
        </div>

        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(cart.subtotal_cents)}</span>
          </div>
          {discount && discount.discount_cents > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>−{formatMoney(discount.discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-semibold tabular-nums">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        <button
          onClick={goToCheckout}
          className="mt-4 w-full rounded bg-brand py-2 text-white hover:bg-brand-dark"
        >
          Finalizar compra
        </button>
      </aside>
    </div>
  );
}
