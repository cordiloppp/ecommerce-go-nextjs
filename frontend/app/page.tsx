"use client";

import { useEffect, useMemo, useState } from "react";

import ProductCard from "@/components/ProductCard";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .listProducts()
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const filtered = products.filter((p) => {
    const matchSearch = normalize(p.name).includes(normalize(search));
    const matchCat = !category || p.category === category;
    return matchSearch && matchCat;
  });

  const chip = (active: boolean) =>
    `h-9 rounded-[10px] px-3.5 text-[14px] transition-colors ${
      active ? "bg-brand text-white" : "bg-white text-gray-600 border hover:text-gray-900"
    }`;

  return (
    <div>
      <div className="mb-10 max-w-2xl">
        <h1 className="text-[36px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[44px]">
          Electrónica para tu escritorio
        </h1>
        <p className="mt-3 text-[17px] leading-7 text-gray-600">
          Audífonos, teclados, monitores y almacenamiento. Arma tu carrito y
          aplica un cupón de descuento al pagar.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
          <button className={chip(category === "")} onClick={() => setCategory("")}>
            Todo
          </button>
          {categories.map((c) => (
            <button key={c} className={chip(category === c)} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar"
          aria-label="Buscar productos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input sm:max-w-[260px]"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl border bg-white" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">No hay productos que coincidan con tu búsqueda.</p>
      )}
    </div>
  );
}
