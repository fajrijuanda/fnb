import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant, ModifierOption } from "@/types/api";

export interface CartItem {
  cartId: string; // Unique identifier for cart item
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  modifiers?: ModifierOption[];
  note?: string;
  totalPrice: number; // Single item price including adjustments
}

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity: number,
    variant?: ProductVariant,
    modifiers?: ModifierOption[],
    note?: string,
  ) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateNote: (cartId: string, note: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const generateCartId = (
  product: Product,
  variant?: ProductVariant,
  modifiers?: ModifierOption[],
) => {
  const parts = [product.id.toString()];
  if (variant) parts.push(`v${variant.id}`);
  if (modifiers && modifiers.length > 0) {
    const sortedModIds = [...modifiers]
      .sort((a, b) => a.id - b.id)
      .map((m) => m.id);
    parts.push(`m${sortedModIds.join("-")}`);
  }
  return parts.join("_");
};

const calculateItemPrice = (
  product: Product,
  variant?: ProductVariant,
  modifiers?: ModifierOption[],
) => {
  let price = product.price;
  if (variant) price += variant.price_adjustment;
  if (modifiers) {
    modifiers.forEach((mod) => (price += mod.price_adjustment));
  }
  return price;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, variant, modifiers, note) => {
        set((state) => {
          const cartId = generateCartId(product, variant, modifiers);
          const existingItem = state.items.find(
            (item) => item.cartId === cartId,
          );
          const totalPrice = calculateItemPrice(product, variant, modifiers);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.cartId === cartId
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      note: note || item.note,
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                cartId,
                product,
                quantity,
                variant,
                modifiers,
                note,
                totalPrice,
              },
            ],
          };
        });
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartId !== cartId),
        }));
      },

      updateQuantity: (cartId, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.cartId !== cartId)
              : state.items.map((item) =>
                  item.cartId === cartId ? { ...item, quantity } : item,
                ),
        }));
      },

      updateNote: (cartId, note) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartId === cartId ? { ...item, note } : item,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.totalPrice * item.quantity,
          0,
        ),
    }),
    {
      name: "omden-cart",
    },
  ),
);
