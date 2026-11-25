"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em]">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <rect width="24" height="24" rx="6" fill="#111827" />
        <path d="M13.5 4.5 7.5 13h4l-1 6.5 6-8.5h-4l1-6.5Z" fill="#f2c230" />
      </svg>
      ElectroShop
    </Link>
  );
}

export default function Navbar() {
  const { user, token, logout, hydrated } = useAuth();
  const { count, refresh, clearLocal } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (token) refresh();
    else clearLocal();
  }, [token, refresh, clearLocal]);

  function handleLogout() {
    logout();
    clearLocal();
    router.push("/");
  }

  const link = (href: string) =>
    `text-[15px] transition-colors hover:text-gray-900 ${pathname === href ? "text-gray-900" : "text-gray-500"}`;

  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <div className="flex items-center gap-5">
          <Link href="/" className={link("/")}>
            Catálogo
          </Link>

          {hydrated && user?.role === "admin" && (
            <Link href="/admin" className={link("/admin")}>
              Admin
            </Link>
          )}

          <Link href="/cart" className={`${link("/cart")} flex items-center gap-1.5`}>
            Carrito
            {count > 0 && (
              <span className="min-w-5 rounded-md bg-volt px-1.5 text-center text-[12px] font-semibold tabular-nums text-gray-900">
                {count}
              </span>
            )}
          </Link>

          {hydrated && user ? (
            <button
              onClick={handleLogout}
              className="h-9 rounded-[10px] border px-3 text-[14px] transition-colors hover:bg-gray-100"
            >
              Salir
            </button>
          ) : (
            <Link
              href="/login"
              className="flex h-9 items-center rounded-[10px] bg-brand px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
