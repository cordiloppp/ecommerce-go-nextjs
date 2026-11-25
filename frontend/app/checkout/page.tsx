"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { canWrite } from "@/lib/session";
import type { DiscountPreview, OrderResult } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

function CheckoutFlow() {
  const params = useSearchParams();
  const code = params.get("code") || "";
  const { token, hydrated } = useAuth();
  const { cart, refresh, preview, checkout } = useCart();
  const guest = !canWrite(token);

  const [discount, setDiscount] = useState<DiscountPreview | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated) refresh();
  }, [hydrated, token, refresh]);

  const hasItems = !!cart && cart.items.length > 0;
  useEffect(() => {
    if (code && hasItems) preview(code).then(setDiscount).catch(() => setDiscount(null));
  }, [code, hasItems, preview]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      setOrder(await checkout(code || undefined));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo procesar el pago");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) return <p className="text-gray-500">Cargando…</p>;

  if (order) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-volt text-gray-900">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-[28px] font-medium tracking-[-0.01em]">Pedido confirmado</h1>
        <p className="mt-2 text-gray-600">
          {order.order.status === "demo"
            ? "Pedido de demostración: no se cobró ni se guardó nada."
            : "Pago simulado realizado."}{" "}
          Folio <span className="font-mono">{order.order.id.slice(0, 12)}</span>
        </p>
        <div className="mt-6 rounded-2xl border bg-white p-5 text-left">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between py-1 text-[15px]">
              <span>
                {it.product_name} × {it.quantity}
              </span>
              <span className="tabular-nums">{formatMoney(it.unit_price_cents * it.quantity)}</span>
            </div>
          ))}
          <dl className="mt-3 space-y-1 border-t pt-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.order.subtotal_cents)}</dd>
            </div>
            {order.order.discount_cents > 0 && (
              <div className="flex justify-between text-[#16a34a]">
                <dt>Descuento {order.order.discount_code}</dt>
                <dd className="tabular-nums">−{formatMoney(order.order.discount_cents)}</dd>
              </div>
            )}
            <div className="flex justify-between text-[17px] font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(order.order.total_cents)}</dd>
            </div>
          </dl>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[28px] font-medium tracking-[-0.01em]">No hay nada que pagar</h1>
        <p className="mt-2 text-gray-600">Tu carrito está vacío.</p>
        <Link href="/" className="mt-6 inline-block text-[15px] underline underline-offset-4">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const total = discount ? discount.total_cents : cart.subtotal_cents;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-[28px] font-medium tracking-[-0.01em]">Pago</h1>

      <div className="rounded-2xl border bg-white p-5">
        {cart.items.map((it) => (
          <div key={it.id} className="flex justify-between py-1 text-[15px]">
            <span>
              {it.name} × {it.quantity}
            </span>
            <span className="tabular-nums">{formatMoney(it.line_total_cents)}</span>
          </div>
        ))}
        <dl className="mt-3 space-y-1 border-t pt-3 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(cart.subtotal_cents)}</dd>
          </div>
          {discount && discount.discount_cents > 0 && (
            <div className="flex justify-between text-[#16a34a]">
              <dt>Descuento {discount.code}</dt>
              <dd className="tabular-nums">−{formatMoney(discount.discount_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-[17px] font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(total)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 rounded-[12px] border bg-gray-100 p-4 text-[14px] text-gray-600">
        {guest
          ? "Pago simulado y sin cuenta: verás la confirmación del pedido, pero no se cobra ni se guarda nada."
          : "Pago simulado: no se cobra nada real. Al confirmar se crea el pedido y se descuenta el stock."}
      </p>

      {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}

      <button
        onClick={pay}
        disabled={busy}
        className="mt-4 h-12 w-full rounded-[10px] bg-brand text-[15px] font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Procesando…" : `Pagar ${formatMoney(total)}`}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Cargando…</p>}>
      <CheckoutFlow />
    </Suspense>
  );
}
