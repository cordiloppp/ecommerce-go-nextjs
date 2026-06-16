"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const { user, token, logout, hydrated } = useAuth();
  const { count, refresh, clearLocal } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (token) refresh();
    else clearLocal();
  }, [token, refresh, clearLocal]);

  function handleLogout() {
    logout();
    clearLocal();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand">
          ⚡ ElectroShop
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-brand">
            Catálogo
          </Link>

          {hydrated && user?.role === "admin" && (
            <Link href="/admin" className="hover:text-brand">
              Admin
            </Link>
          )}

          <Link href="/cart" className="relative hover:text-brand">
            Carrito
            {count > 0 && (
              <span className="absolute -right-4 -top-2 rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          {hydrated && user ? (
            <>
              <span className="text-gray-500">Hola, {user.name.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="rounded border px-3 py-1 hover:bg-gray-100"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded bg-brand px-3 py-1 text-white hover:bg-brand-dark"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
