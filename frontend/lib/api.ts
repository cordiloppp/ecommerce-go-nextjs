// Cliente HTTP tipado contra la API de Go.

import type {
  AuthResponse,
  Cart,
  Discount,
  DiscountPreview,
  Order,
  OrderResult,
  Product,
  ProductList,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8088";

const TOKEN_KEY = "ecommerce_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Error de API con código legible por máquina. */
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  if (opts.auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "error",
      err.message ?? `Error ${res.status}`,
    );
  }
  return data as T;
}

export const api = {
  // --- Auth ---
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),
  demoLogin: () => request<AuthResponse>("/auth/demo", { method: "POST" }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  // --- Catálogo ---
  listProducts: (params: { search?: string; category?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.category) q.set("category", params.category);
    q.set("limit", "100");
    return request<ProductList>(`/products?${q.toString()}`);
  },
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),

  // --- Carrito ---
  getCart: () => request<Cart>("/cart", { auth: true }),
  addToCart: (productId: string, quantity: number) =>
    request<Cart>("/cart/items", {
      method: "POST",
      auth: true,
      body: { product_id: productId, quantity },
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    request<Cart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      auth: true,
      body: { quantity },
    }),
  removeCartItem: (itemId: string) =>
    request<Cart>(`/cart/items/${itemId}`, { method: "DELETE", auth: true }),
  applyDiscount: (code: string) =>
    request<DiscountPreview>("/cart/apply-discount", {
      method: "POST",
      auth: true,
      body: { code },
    }),

  previewDiscount: (code: string, subtotalCents: number) =>
    request<DiscountPreview>(
      `/discounts/preview?code=${encodeURIComponent(code)}&subtotal_cents=${subtotalCents}`,
    ),

  // --- Checkout / pedidos ---
  checkout: (discountCode?: string) =>
    request<OrderResult>("/checkout", {
      method: "POST",
      auth: true,
      body: { discount_code: discountCode ?? "" },
    }),
  listOrders: () => request<{ items: Order[] }>("/orders", { auth: true }),

  // --- Admin: productos ---
  createProduct: (body: ProductInput) =>
    request<Product>("/admin/products", { method: "POST", auth: true, body }),
  updateProduct: (id: string, body: ProductInput) =>
    request<Product>(`/admin/products/${id}`, {
      method: "PUT",
      auth: true,
      body,
    }),
  deleteProduct: (id: string) =>
    request<void>(`/admin/products/${id}`, { method: "DELETE", auth: true }),

  // --- Admin: cupones ---
  listDiscounts: () =>
    request<{ items: Discount[] }>("/admin/discounts", { auth: true }),
  createDiscount: (body: DiscountInput) =>
    request<Discount>("/admin/discounts", { method: "POST", auth: true, body }),
  updateDiscount: (id: string, body: DiscountInput) =>
    request<Discount>(`/admin/discounts/${id}`, {
      method: "PUT",
      auth: true,
      body,
    }),
  deleteDiscount: (id: string) =>
    request<void>(`/admin/discounts/${id}`, { method: "DELETE", auth: true }),
};

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  price_cents: number;
  currency: string;
  stock: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

export interface DiscountInput {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal_cents: number;
  max_uses: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}
