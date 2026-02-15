import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/api";

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, note?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateNote: (productId: number, note: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, note) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id,
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      note: note || item.note, // Update note if provided
                    }
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity, note }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.product.id !== productId)
              : state.items.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item,
                ),
        }));
      },

      updateNote: (productId, note) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, note } : item,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0,
        ),
    }),
    {
      name: "cloudpos-cart",
    },
  ),
);
