"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { login } = useAuth();
  const { refresh } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      login(res.user, res.token);
      await refresh();
      router.push(res.user.role === "admin" ? "/admin" : next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-[28px] font-medium tracking-[-0.01em]">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-brand py-2 text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-brand hover:underline">
          Regístrate
        </Link>
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Demo admin: admin@demo.com / admin1234
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <LoginForm />
    </Suspense>
  );
}
