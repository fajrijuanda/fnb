"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, LoginResponse } from "@/types/api";
import { useCartStore } from "./useCartStore";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (data: LoginResponse) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
  lastActivity: number;
  updateActivity: () => void;
  language: "id" | "en";
  setLanguage: (lang: "id" | "en") => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      lastActivity: Date.now(),
      login: (data) =>
        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          user: {
            id: data.user_id,
            username: data.username,
            email: data.email,
            role: data.role,
            is_subscribed: data.is_subscribed,
          },
          isAuthenticated: true,
          lastActivity: Date.now(),
        }),
      setTokens: (access, refresh) =>
        set({
          accessToken: access,
          refreshToken: refresh,
        }),
      logout: () => {
        useCartStore.getState().clearCart();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      updateActivity: () => set({ lastActivity: Date.now() }),
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      language: "id",
      setLanguage: (lang: "id" | "en") => set({ language: lang }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
