"use client";

import { useAuth } from "@/store/auth";

const DEMO_READONLY = process.env.NEXT_PUBLIC_DEMO_READONLY === "true";

/** True when the session token was issued with write access (owner login). */
function canWrite(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.rw === true;
  } catch {
    return false;
  }
}

/** Shown on the public demo: visitors can browse, but changes are not saved. */
export default function DemoBanner() {
  const { token, hydrated } = useAuth();
  if (!DEMO_READONLY || !hydrated || canWrite(token)) return null;
  return (
    <div className="border-b bg-gray-100 px-4 py-2 text-center text-[13px] text-gray-600">
      Demo de solo lectura: puedes explorar el catálogo y el panel, pero los cambios no se guardan.
    </div>
  );
}
