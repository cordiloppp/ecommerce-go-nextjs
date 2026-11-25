"use client";

import { useEffect, useState } from "react";

import { api, ApiError, type ProductInput } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  priceEuros: "0",
  stock: "0",
  image_url: "",
  category: "",
  is_active: true,
};

type FormState = typeof emptyForm;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await api.listProducts();
    setProducts(r.items);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function toInput(f: FormState): ProductInput {
    return {
      name: f.name,
      slug: f.slug || undefined,
      description: f.description,
      price_cents: Math.round(parseFloat(f.priceEuros || "0") * 100),
      currency: "MXN",
      stock: parseInt(f.stock || "0", 10),
      image_url: f.image_url,
      category: f.category,
      is_active: f.is_active,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) await api.updateProduct(editingId, toInput(form));
      else await api.createProduct(toInput(form));
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error");
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceEuros: (p.price_cents / 100).toString(),
      stock: p.stock.toString(),
      image_url: p.image_url,
      category: p.category,
      is_active: p.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await api.deleteProduct(id);
    await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form
        onSubmit={submit}
        className="h-fit space-y-3 rounded-lg border bg-white p-4"
      >
        <h2 className="font-semibold">
          {editingId ? "Editar producto" : "Nuevo producto"}
        </h2>
        <Field label="Nombre">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Slug (opcional)">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Categoría">
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Descripción">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input"
            rows={3}
          />
        </Field>
        <div className="flex gap-3">
          <Field label="Precio (MXN)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.priceEuros}
              onChange={(e) => setForm({ ...form, priceEuros: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Stock">
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="input"
            />
          </Field>
        </div>
        <Field label="URL de imagen">
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="input"
            placeholder="https://..."
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Activo (visible en la tienda)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-brand px-4 py-2 text-white hover:bg-brand-dark"
          >
            {editingId ? "Guardar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded border px-4 py-2 hover:bg-gray-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2">
        <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Activo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{formatMoney(p.price_cents)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{p.is_active ? "Sí" : "No"}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => startEdit(p)}
                    className="mr-3 text-brand hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-600">{label}</span>
      {children}
    </label>
  );
}
