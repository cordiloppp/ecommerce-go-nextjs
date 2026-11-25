// Session helpers for the public read-only demo.

export const DEMO_READONLY = process.env.NEXT_PUBLIC_DEMO_READONLY === "true";

/** True when the token was issued with write access (a real or owner session). */
export function canWrite(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.rw === true;
  } catch {
    return false;
  }
}
