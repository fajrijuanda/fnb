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
  is_subscribed: boolean;
  avatar?: string | null;
  location?: string | null;
  profile?: {
    location?: string;
    avatar?: string;
    owner?: number;
  };
  plan_name?: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  username: string;
  email: string;
  role: "superadmin" | "mitra" | "cashier";
  is_subscribed: boolean;
}

export interface Subscription {
  id: number;
  user: number;
  user_details: User;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "pending" | "cancelled";
  created_at: string;
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

export interface StockLog {
  id: number;
  ingredient: number;
  ingredient_name?: string;
  product?: number;
  product_name?: string;
  change_amount: number;
  final_stock: number;
  movement_type: "IN" | "OUT" | "ADJUSTMENT" | "WASTE";
  reason?: string;
  notes?: string;
  created_at: string;
  created_by?: number;
}

// Restock Orders
export type RestockOrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "RECEIVED"
  | "CANCELLED";
export type RestockPaymentMethod =
  | "TRANSFER"
  | "DANA"
  | "GOPAY"
  | "SHOPEEPAY"
  | "OVO";

export interface RestockOrderItem {
  id: number;
  ingredient: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

export interface RestockOrder {
  id: number;
  order_number: string;
  status: RestockOrderStatus;
  status_display: string;
  payment_method: RestockPaymentMethod;
  payment_method_display: string;
  shipping_address: string;
  shipping_cost: number;
  subtotal: number;
  total_amount: number;
  notes: string;
  items: RestockOrderItem[];
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  preparing_at: string | null;
  shipped_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  external_order_id: string;
  payment: Payment | null;
}

// Payment Gateway
export type PaymentVerificationStatus =
  | "PENDING"
  | "PROCESSING"
  | "VERIFIED"
  | "REJECTED"
  | "MANUAL_REVIEW"
  | "EXPIRED";

export interface Payment {
  id: number;
  payment_code: string;
  payment_proof: string | null;
  payment_proof_uploaded_at: string | null;
  expires_at: string;
  verification_status: PaymentVerificationStatus;
  verification_status_display: string;
  verification_result: Record<string, unknown>;
  verification_confidence: number;
  rejection_reason: string;
  verified_at: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
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

// Notifications
export interface Notification {
  id: number;
  recipient: number;
  title: string;
  message: string;
  notification_type: "info" | "warning" | "success" | "error";
  is_read: boolean;
  related_link?: string | null;
  created_at: string;
}
