import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, LoginResponse } from "@/types/api";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      login: (data) =>
        set({
          token: data.token,
          user: {
            id: data.user_id,
            username: data.username,
            email: data.email,
            role: data.role,
          },
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
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
