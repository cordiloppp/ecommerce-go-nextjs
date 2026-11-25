"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductArt from "@/components/ProductArt";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { specsFor } from "@/lib/specs";
import type { Product } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function ProductCard({ product }: { product: Product }) {
  const { token } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function addToCart() {
    if (!token) {
      router.push("/login?next=/");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await api.addToCart(product.id, 1);
      await refresh();
      setMsg("Agregado");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "No se pudo agregar");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  const soldOut = product.stock <= 0;
  const specs = specsFor(product.name, product.category).slice(0, 2);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-white transition-colors duration-150 hover:border-gray-300">
      <Link href={`/products/${product.slug}`} className="aspect-[4/3] overflow-hidden" tabIndex={-1} aria-hidden>
        <ProductArt name={product.name} category={product.category} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[13px] text-gray-500">{product.category}</span>
        <Link
          href={`/products/${product.slug}`}
          className="mt-0.5 text-[16px] font-medium leading-snug transition-colors hover:text-gray-600"
        >
          {product.name}
        </Link>
        {specs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specs.map((s) => (
              <span key={s} className="keycap">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-[17px] font-medium tabular-nums">
            {formatMoney(product.price_cents, product.currency)}
          </span>
          <button
            onClick={addToCart}
            disabled={busy || soldOut}
            className="h-9 rounded-[10px] bg-brand px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
          >
            {soldOut ? "Agotado" : (msg ?? "Agregar")}
          </button>
        </div>
      </div>
    </article>
  );
}
