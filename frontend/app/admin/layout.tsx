"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && (!user || user.role !== "admin")) {
      router.push("/login?next=/admin");
    }
  }, [hydrated, user, router]);

  if (!hydrated) return <p>Cargando...</p>;
  if (!user || user.role !== "admin") return null;

  return (
    <div>
      <h1 className="mb-4 text-[28px] font-medium tracking-[-0.01em]">Panel de administración</h1>
      <nav className="mb-6 flex gap-2 border-b">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${
              pathname === t.href
                ? "border-brand font-semibold text-brand"
                : "border-transparent text-gray-500 hover:text-gray-800"
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
