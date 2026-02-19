import { create } from "zustand";
import api from "@/lib/api";
import { Shift, WrappedResponse } from "@/types/api";

interface ShiftState {
  activeShift: Shift | null;
  isLoading: boolean;
  error: string | null;

  fetchCurrentShift: () => Promise<void>;
  openShift: (initialCash: number) => Promise<void>;
  closeShift: (finalCashActual: number, notes?: string) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set) => ({
  activeShift: null,
  isLoading: false,
  error: null,

  fetchCurrentShift: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<WrappedResponse<Shift>>(
        "/sales/shifts/current/",
      );
      // API returns 404 if no shift, but axios interceptor might throw.
      // We need to handle 404 specifically as "No Active Shift" (not error)
      set({ activeShift: response.data.data as Shift });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response: { status: number } }).response.status === 404
      ) {
        set({ activeShift: null });
      } else {
        set({ error: (err as Error).message || "Failed to fetch shift" });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  openShift: async (initialCash: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<WrappedResponse<Shift>>(
        "/sales/shifts/start/",
        {
          initial_cash: initialCash,
        },
      );
      set({ activeShift: response.data.data as Shift });
    } catch (err: unknown) {
      set({ error: (err as Error).message || "Failed to open shift" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  closeShift: async (finalCashActual: number, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<WrappedResponse<Shift>>("/sales/shifts/end/", {
        final_cash_actual: finalCashActual,
        notes,
      });
      set({ activeShift: null }); // Shift closed
    } catch (err: unknown) {
      set({ error: (err as Error).message || "Failed to close shift" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
