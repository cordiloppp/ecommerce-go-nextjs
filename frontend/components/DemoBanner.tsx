"use client";

import { useAuth } from "@/store/auth";

import { canWrite, DEMO_READONLY } from "@/lib/session";

/** Shown on the public demo: visitors can browse, but changes are not saved. */
export default function DemoBanner() {
  const { token, hydrated } = useAuth();
  if (!DEMO_READONLY || !hydrated || canWrite(token)) return null;
  return (
    <div className="border-b bg-gray-100 px-4 py-2 text-center text-[13px] text-gray-600">
      Demo de solo lectura: compra sin cuenta y recorre el panel de admin, nada se cobra ni se guarda.
    </div>
  );
}
