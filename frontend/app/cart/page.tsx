"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ProductArt from "@/components/ProductArt";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DiscountPreview } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const { cart, refresh, loading, update, remove, preview } = useCart();

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<DiscountPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) refresh();
  }, [hydrated, token, refresh]);

  async function changeQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setMessage(null);
    try {
      await update(itemId, quantity);
      setDiscount(null);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "No se pudo actualizar");
    }
  }

  async function removeItem(itemId: string) {
    await remove(itemId);
    setDiscount(null);
  }

  async function applyDiscount() {
    setMessage(null);
    setDiscount(null);
    try {
      setDiscount(await preview(code.trim()));
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "No se pudo aplicar el cupón");
    }
  }

  function goToCheckout() {
    router.push(discount ? `/checkout?code=${encodeURIComponent(discount.code)}` : "/checkout");
  }

  if (!hydrated || loading) return <p className="text-gray-500">Cargando carrito…</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[28px] font-medium tracking-[-0.01em]">Tu carrito está vacío</h1>
        <p className="mt-2 text-gray-600">Agrega productos del catálogo, no necesitas cuenta.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const total = discount ? discount.total_cents : cart.subtotal_cents;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-6 text-[28px] font-medium tracking-[-0.01em]">Tu carrito</h1>
        <div className="divide-y rounded-2xl border bg-white">
          {cart.items.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-[10px] border">
                <ProductArt name={it.name} />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${it.slug}`} className="font-medium transition-colors hover:text-gray-600">
                  {it.name}
                </Link>
                <p className="text-[14px] tabular-nums text-gray-500">{formatMoney(it.unit_price_cents)} c/u</p>
              </div>
              <div className="flex items-center rounded-[10px] border">
                <button
                  onClick={() => changeQty(it.id, it.quantity - 1)}
                  disabled={it.quantity <= 1}
                  aria-label={`Quitar uno de ${it.name}`}
                  className="size-9 rounded-l-[10px] transition-colors hover:bg-gray-100 disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-8 text-center tabular-nums">{it.quantity}</span>
                <button
                  onClick={() => changeQty(it.id, it.quantity + 1)}
                  disabled={it.quantity >= it.stock}
                  aria-label={`Agregar uno de ${it.name}`}
                  className="size-9 rounded-r-[10px] transition-colors hover:bg-gray-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <div className="w-24 text-right font-medium tabular-nums">{formatMoney(it.line_total_cents)}</div>
              <button
                onClick={() => removeItem(it.id)}
                className="text-[14px] text-gray-500 transition-colors hover:text-gray-900"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        {message && <p className="mt-3 text-[14px] text-red-600">{message}</p>}
      </div>

      <aside className="h-fit rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-[17px] font-medium">Resumen</h2>

        <label className="mb-1 block text-[14px] text-gray-600" htmlFor="coupon">
          Cupón de descuento
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="DEMO10"
            className="input uppercase"
          />
          <button
            onClick={applyDiscount}
            disabled={!code.trim()}
            className="h-10 shrink-0 rounded-[10px] border px-3 text-[14px] transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
        {discount && <p className="mt-2 text-[14px] text-[#16a34a]">Cupón {discount.code} aplicado</p>}

        <dl className="mt-5 space-y-2 border-t pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(cart.subtotal_cents)}</dd>
          </div>
          {discount && discount.discount_cents > 0 && (
            <div className="flex justify-between text-[#16a34a]">
              <dt>Descuento</dt>
              <dd className="tabular-nums">−{formatMoney(discount.discount_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-3 text-[17px] font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(total)}</dd>
          </div>
        </dl>

        <button
          onClick={goToCheckout}
          className="mt-5 h-11 w-full rounded-[10px] bg-brand text-[15px] font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          Continuar al pago
        </button>
      </aside>
    </div>
  );
}
