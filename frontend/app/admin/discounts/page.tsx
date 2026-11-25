"use client";

import { useEffect, useState } from "react";

import { api, ApiError, type DiscountInput } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Discount, DiscountType } from "@/lib/types";

const emptyForm = {
  code: "",
  type: "percent" as DiscountType,
  value: "10",
  minSubtotalEuros: "0",
  maxUses: "",
  is_active: true,
};

type FormState = typeof emptyForm;

export default function AdminDiscounts() {
  const [items, setItems] = useState<Discount[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await api.listDiscounts();
    setItems(r.items);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function toInput(f: FormState): DiscountInput {
    return {
      code: f.code,
      type: f.type,
      // En 'percent' el valor es el porcentaje; en 'fixed' son euros → céntimos.
      value:
        f.type === "percent"
          ? parseInt(f.value || "0", 10)
          : Math.round(parseFloat(f.value || "0") * 100),
      min_subtotal_cents: Math.round(parseFloat(f.minSubtotalEuros || "0") * 100),
      max_uses: f.maxUses ? parseInt(f.maxUses, 10) : null,
      starts_at: null,
      expires_at: null,
      is_active: f.is_active,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) await api.updateDiscount(editingId, toInput(form));
      else await api.createDiscount(toInput(form));
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error");
    }
  }

  function startEdit(d: Discount) {
    setEditingId(d.id);
    setForm({
      code: d.code,
      type: d.type,
      value:
        d.type === "percent"
          ? d.value.toString()
          : (d.value / 100).toString(),
      minSubtotalEuros: (d.min_subtotal_cents / 100).toString(),
      maxUses: d.max_uses?.toString() ?? "",
      is_active: d.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este cupón?")) return;
    await api.deleteDiscount(id);
    await load();
  }

  function describeValue(d: Discount): string {
    return d.type === "percent"
      ? `${d.value}%`
      : formatMoney(d.value);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form
        onSubmit={submit}
        className="h-fit space-y-3 rounded-lg border bg-white p-4"
      >
        <h2 className="font-semibold">
          {editingId ? "Editar cupón" : "Nuevo cupón"}
        </h2>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Código</span>
          <input
            required
            disabled={!!editingId}
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            className="input uppercase disabled:bg-gray-100"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Tipo</span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as DiscountType })
            }
            className="input"
          >
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Importe fijo (MXN)</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">
            {form.type === "percent" ? "Porcentaje (0-100)" : "Importe (MXN)"}
          </span>
          <input
            type="number"
            step={form.type === "percent" ? "1" : "0.01"}
            min="0"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="input"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Subtotal mínimo (MXN)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.minSubtotalEuros}
            onChange={(e) =>
              setForm({ ...form, minSubtotalEuros: e.target.value })
            }
            className="input"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">
            Usos máximos (vacío = ilimitado)
          </span>
          <input
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            className="input"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Activo
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
              <th className="p-3">Código</th>
              <th className="p-3">Descuento</th>
              <th className="p-3">Mín.</th>
              <th className="p-3">Usos</th>
              <th className="p-3">Activo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3 font-mono font-semibold">{d.code}</td>
                <td className="p-3">{describeValue(d)}</td>
                <td className="p-3">{formatMoney(d.min_subtotal_cents)}</td>
                <td className="p-3">
                  {d.used_count}
                  {d.max_uses ? ` / ${d.max_uses}` : ""}
                </td>
                <td className="p-3">{d.is_active ? "Sí" : "No"}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => startEdit(d)}
                    className="mr-3 text-brand hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(d.id)}
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
