"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DiscountPreview, OrderResult } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

function CheckoutFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";
  const { token, hydrated } = useAuth();
  const { cart, refresh } = useCart();

  const [preview, setPreview] = useState<DiscountPreview | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && !token) router.push("/login?next=/checkout");
  }, [hydrated, token, router]);

  useEffect(() => {
    if (token) refresh();
  }, [token, refresh]);

  useEffect(() => {
    if (code && cart && cart.items.length > 0) {
      api.applyDiscount(code).then(setPreview).catch(() => setPreview(null));
    }
  }, [code, cart]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.checkout(code || undefined);
      setOrder(res);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error al procesar el pago");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) return <p>Cargando...</p>;

  if (order) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-volt text-gray-900"><svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <h1 className="text-[28px] font-medium tracking-[-0.01em]">Pedido confirmado</h1>
        <p className="mt-2 text-gray-600">
          Pago simulado realizado con éxito. Pedido{" "}
          <span className="font-mono">{order.order.id.slice(0, 8)}</span>.
        </p>
        <div className="mt-6 rounded-lg border bg-white p-5 text-left">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between py-1 text-sm">
              <span>
                {it.product_name} × {it.quantity}
              </span>
              <span>{formatMoney(it.unit_price_cents * it.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 space-y-1 border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(order.order.subtotal_cents)}</span>
            </div>
            {order.order.discount_cents > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento {order.order.discount_code}</span>
                <span>−{formatMoney(order.order.discount_cents)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold tabular-nums">
              <span>Total</span>
              <span>{formatMoney(order.order.total_cents)}</span>
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block rounded bg-brand px-5 py-2 text-white hover:bg-brand-dark"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-[28px] font-medium tracking-[-0.01em]">Checkout</h1>
        <p className="text-gray-500">El carrito está vacío.</p>
        <Link href="/" className="mt-4 inline-block text-brand hover:underline">
          ← Ver productos
        </Link>
      </div>
    );
  }

  const total = preview ? preview.total_cents : cart.subtotal_cents;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-[28px] font-medium tracking-[-0.01em]">Finalizar compra</h1>

      <div className="rounded-lg border bg-white p-5">
        {cart.items.map((it) => (
          <div key={it.id} className="flex justify-between py-1 text-sm">
            <span>
              {it.name} × {it.quantity}
            </span>
            <span>{formatMoney(it.line_total_cents)}</span>
          </div>
        ))}

        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(cart.subtotal_cents)}</span>
          </div>
          {preview && preview.discount_cents > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento {preview.code}</span>
              <span>−{formatMoney(preview.discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-lg font-semibold tabular-nums">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed bg-blue-50 p-4 text-sm text-blue-700">
        Pago simulado: no se cobra nada real. Al confirmar se crea el pedido
        y se descuenta el stock.
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={pay}
        disabled={busy}
        className="mt-4 w-full rounded bg-brand py-3 text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Procesando..." : `Pagar ${formatMoney(total)}`}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <CheckoutFlow />
    </Suspense>
  );
}
