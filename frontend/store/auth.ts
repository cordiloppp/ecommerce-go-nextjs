"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { setToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      login: (user, token) => {
        setToken(token);
        set({ user, token });
      },
      logout: () => {
        setToken(null);
        set({ user: null, token: null });
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "ecommerce_auth",
      onRehydrateStorage: () => (state) => {
        // Sincroniza el token con el cliente API tras rehidratar.
        if (state?.token) setToken(state.token);
        state?.setHydrated();
      },
    },
  ),
);
