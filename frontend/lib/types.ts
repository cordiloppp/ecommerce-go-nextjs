// Tipos compartidos que reflejan las respuestas del backend.

export type Role = "customer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  stock: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

export interface ProductList {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  slug: string;
  name: string;
  image_url: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  stock: number;
  current_price_cents: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal_cents: number;
  currency: string;
}

export interface DiscountPreview {
  code: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
}

export type DiscountType = "percent" | "fixed";

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  min_subtotal_cents: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  discount_code: string | null;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
}

export interface OrderResult {
  order: Order;
  items: OrderItem[];
}
