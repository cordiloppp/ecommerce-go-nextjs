"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { DEMO_READONLY } from "@/lib/session";
import { useAuth } from "@/store/auth";

const tabs = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/discounts", label: "Cupones" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated || user?.role === "admin") return;
    if (DEMO_READONLY && !user) {
      // Public demo: open the panel with a read-only session, no account needed.
      api
        .demoLogin()
        .then((res) => login(res.user, res.token))
        .catch(() => router.push("/login?next=/admin"));
      return;
    }
    router.push("/login?next=/admin");
  }, [hydrated, user, router, login]);

  if (!hydrated || !user) return <p className="text-gray-500">Abriendo el panel…</p>;
  if (user.role !== "admin") return null;

  return (
    <div>
      <h1 className="mb-4 text-[28px] font-medium tracking-[-0.01em]">Panel de administración</h1>
      <nav className="mb-6 flex gap-2 border-b">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2 text-[15px] transition-colors ${
              pathname === t.href
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
