"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
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
      setMsg("Añadido al carrito ✓");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <p>Cargando...</p>;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image_url || "https://picsum.photos/800/600"}
        alt={product.name}
        className="w-full rounded-lg border object-cover"
      />
      <div>
        <Link href="/" className="text-sm text-brand hover:underline">
          ← Volver al catálogo
        </Link>
        <span className="mt-2 block text-xs uppercase tracking-wide text-gray-400">
          {product.category}
        </span>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="mt-3 text-gray-600">{product.description}</p>
        <p className="mt-4 text-3xl font-bold">
          {formatMoney(product.price_cents, product.currency)}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded border px-3 py-2"
          />
          <button
            onClick={addToCart}
            disabled={busy || product.stock <= 0}
            className="rounded bg-brand px-5 py-2 text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Añadir al carrito
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
      </div>
    </div>
  );
}
