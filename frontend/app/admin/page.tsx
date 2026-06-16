"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

export default function AdminHome() {
  const [products, setProducts] = useState<number | null>(null);
  const [discounts, setDiscounts] = useState<number | null>(null);

  useEffect(() => {
    api.listProducts().then((r) => setProducts(r.total)).catch(() => {});
    api.listDiscounts().then((r) => setDiscounts(r.items.length)).catch(() => {});
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/admin/products"
        className="rounded-lg border bg-white p-6 hover:shadow"
      >
        <div className="text-3xl font-bold">{products ?? "—"}</div>
        <div className="text-gray-500">Productos en catálogo</div>
      </Link>
      <Link
        href="/admin/discounts"
        className="rounded-lg border bg-white p-6 hover:shadow"
      >
        <div className="text-3xl font-bold">{discounts ?? "—"}</div>
        <div className="text-gray-500">Cupones de descuento</div>
      </Link>
    </div>
  );
}
