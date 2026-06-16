"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
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
      setMsg("Añadido ✓");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Error");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2000);
    }
  }

  const soldOut = product.stock <= 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <Link href={`/products/${product.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url || "https://picsum.photos/600/400"}
          alt={product.name}
          className="h-44 w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs uppercase tracking-wide text-gray-400">
          {product.category}
        </span>
        <Link
          href={`/products/${product.slug}`}
          className="font-semibold hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold">
            {formatMoney(product.price_cents, product.currency)}
          </span>
          <button
            onClick={addToCart}
            disabled={busy || soldOut}
            className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {soldOut ? "Sin stock" : msg ?? "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
