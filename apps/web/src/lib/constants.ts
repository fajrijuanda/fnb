export const TOPPING_OPTIONS = [
  "Wortel",
  "Crab Stick",
  "Udang",
  "Keju",
  "Jamur",
];

export const MAX_TOPPINGS = 3;

export const PRODUCT_VARIANT_MAP: Record<string, number> = {
  // Dimsum
  "Dimsum - Paket Single": 3,
  "Dimsum - Paket Bareng": 7,
  "Dimsum Mentai": 6,

  // Gyoza
  "Gyoza Kukus - Paket Single": 4,
  "Gyoza Goreng - Paket Single": 4,
  "Gyoza Kukus - Paket Bareng": 7,
  "Gyoza Goreng - Paket Bareng": 7,
  "Gyoza Mentai": 7,

  // Wonton usually doesn't have mixed toppings per piece in the same way,
  // but if needed, add here.
};
