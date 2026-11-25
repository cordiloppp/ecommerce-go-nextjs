"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ProductArt from "@/components/ProductArt";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { specsFor } from "@/lib/specs";
import type { Product } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { refresh } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .getProduct(slug)
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [slug]);

  async function addToCart() {
    if (!token) {
      router.push(`/login?next=/products/${slug}`);
      return;
    }
    if (!product) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.addToCart(product.id, qty);
      await refresh();
      setMsg("Agregado al carrito");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product)
    return <div className="grid gap-10 md:grid-cols-2"><div className="aspect-[4/3] rounded-2xl border bg-white" /></div>;

  const specs = specsFor(product.name, product.category);
  const soldOut = product.stock <= 0;

  return (
    <div>
      <Link href="/" className="text-[15px] text-gray-500 transition-colors hover:text-gray-900">
        ← Catálogo
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-start">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-white">
          <ProductArt name={product.name} category={product.category} />
        </div>

        <div>
          <span className="text-[14px] text-gray-500">{product.category}</span>
          <h1 className="mt-1 text-[32px] font-medium leading-tight tracking-[-0.02em]">
            {product.name}
          </h1>
          <p className="mt-3 text-[17px] leading-7 text-gray-600">{product.description}</p>

          {specs.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {specs.map((s) => (
                <span key={s} className="keycap">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-2xl border bg-white p-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[28px] font-medium tabular-nums">
                {formatMoney(product.price_cents, product.currency)}
              </span>
              <span className="flex items-center gap-2 text-[14px] text-gray-600">
                <span className={`size-2 rounded-full ${soldOut ? "bg-gray-400" : "bg-[#16a34a]"}`} aria-hidden />
                {soldOut ? "Agotado" : `${product.stock} disponibles`}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <label className="sr-only" htmlFor="qty">Cantidad</label>
              <input
                id="qty"
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="input w-20 tabular-nums"
              />
              <button
                onClick={addToCart}
                disabled={busy || soldOut}
                className="h-10 flex-1 rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
              >
                Agregar al carrito
              </button>
            </div>
            {msg && <p className="mt-3 text-[14px] text-gray-600">{msg}</p>}
            <p className="mt-4 border-t pt-4 text-[13px] text-gray-500">
              Usa el cupón <span className="keycap ml-1">DEMO10</span> para 10% de descuento al pagar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
