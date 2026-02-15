/**
 * API Response Types
 * Based on blueprint.md JSON contract definitions
 */

// Product & Catalog
export interface StockStatus {
  is_tracked: boolean;
  available?: boolean;
  remaining?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: number | string;
  category_details?: Category;
  is_available: boolean;
  stock?: number;
  stock_status?: StockStatus;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

export interface StoreSettings {
  id: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  dana_number: string;
  gopay_number: string;
  shopeepay_number: string;
  ovo_number: string;
  qris_image: string | null;
  updated_at: string;
}

// Authentication
export interface User {
  id: number;
  username: string;
  email: string;
  role: "superadmin" | "mitra" | "cashier";
  avatar?: string | null;
  is_subscribed?: boolean;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  username: string;
  email: string;
  role: "superadmin" | "mitra" | "cashier";
  is_subscribed: boolean;
}

// Order & Sales
export interface OrderItemInput {
  product_id: number;
  quantity: number;
  note?: string;
}

export interface CreateOrderRequest {
  payment_method: "CASH" | "QRIS" | "TRANSFER";
  items: OrderItemInput[];
  notes?: string;
  customer_name?: string;
}

export interface OrderItemResponse {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price_at_sale: number;
  note: string | null;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  invoice_number: string;
  created_at: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  status_display: string;
  total_amount: number;
  payment_method: "CASH" | "QRIS" | "TRANSFER";
  payment_method_display: string;
  notes: string | null;
  items: OrderItemResponse[];
}

// Inventory
export type IngredientStatus = "SAFE" | "LOW" | "CRITICAL";

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_alert: number;
  status: IngredientStatus;
}

// API Response Wrapper
export interface PaginatedData<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
}

export interface WrappedResponse<T> {
  status: "success" | "error";
  data: T | PaginatedData<T>;
  message?: string;
}

export type ApiResponse<T> = T | PaginatedData<T> | WrappedResponse<T>;
