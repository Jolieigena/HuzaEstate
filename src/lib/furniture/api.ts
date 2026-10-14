// access-service client for the furniture catalogue (suppliers sell, anyone browses) and order requests.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export const FURNITURE_CATEGORIES = ["Sofas & seating", "Beds & mattresses", "Tables & desks", "Storage & wardrobes", "Kitchen furniture", "Lighting", "Rugs & curtains", "Decor & accessories", "Outdoor furniture", "Office furniture"];

export type StockStatus = "in_stock" | "made_to_order" | "out_of_stock";
export const STOCK_LABELS: Record<StockStatus, string> = { in_stock: "In stock", made_to_order: "Made to order", out_of_stock: "Out of stock" };

export interface ProductSupplier {
  accountId: string;
  companyName: string;
  logoUrl?: string;
  city?: string;
  country?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  currency: string;
  stock: StockStatus;
  leadTimeDays?: number;
  status: "draft" | "published";
  supplier?: ProductSupplier;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  currency: string;
  stock: StockStatus;
  leadTimeDays?: number;
  status: "draft" | "published";
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name";

export interface ProductQuery {
  category?: string;
  supplierId?: string;
  country?: string;
  availability?: "available" | "";
  currency?: string;
  minPrice?: number | "";
  maxPrice?: number | "";
  search?: string;
  sort?: ProductSort | "";
  page?: number;
  limit?: number;
}

export interface ProductList {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductFacets {
  categories: { name: string; count: number }[];
  suppliers: { id: string; name: string; count: number }[];
  countries: { name: string; count: number }[];
  currencies: { code: string; count: number }[];
  available: number;
  total: number;
}

export type OrderStatus = "requested" | "confirmed" | "declined" | "completed" | "cancelled";
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { requested: "Waiting for the supplier", confirmed: "Confirmed", declined: "Declined", completed: "Delivered", cancelled: "Cancelled" };

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

/** How an order was paid, for showing next to "Paid". */
export function paymentMethodLabel(method?: string): string {
  return method ? method.replace(/_/g, " ").toLowerCase() : "";
}

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  supplierId: string;
  supplierName?: string;
  /** Only the supplier who has to deliver the order sees these. */
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  city: string;
  address: string;
  mapLink?: string;
  note: string;
  items: OrderItem[];
  currency: string;
  total: number;
  status: OrderStatus;
  reply: string;
  deliveryDays?: number;
  paymentStatus: PaymentStatus;
  /** True when the client can pay this order online right now. */
  payable: boolean;
  paymentMethod?: string;
  paidAt?: string;
  /** The money is being sent back to the buyer. */
  refundPending?: boolean;
  refundedAt?: string;
  /** Only in the supplier's and staff's view: what the platform kept, what the supplier receives, and when they were paid. */
  platformFee?: number;
  supplierNet?: number;
  paidOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersTrackResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  /** Money for orders that are still going ahead, per currency. */
  summary: { currency: string; paidTotal: number; paidOrders: number; waitingTotal: number; waitingOrders: number }[];
}

/** Where a paid order's money is: not delivered yet, ready to be paid to the supplier, paid out, or sent back to the buyer. */
export type EarningStage = "awaiting_delivery" | "ready" | "paid_out" | "refunded" | "refund_pending" | "other";
export const EARNING_STAGE_LABELS: Record<EarningStage, string> = { awaiting_delivery: "Awaiting delivery", ready: "Ready for payout", paid_out: "Paid out", refunded: "Refunded", refund_pending: "Refund pending", other: "—" };

export interface EarningTotals {
  currency: string;
  awaitingDelivery: number;
  ready: number;
  paidOut: number;
  /** Money sent back to buyers, in full. */
  refunded: number;
  /** What the platform kept on the orders that count. */
  fees: number;
  readyOrders: number;
}

export interface EarningOrder {
  id: string;
  clientName: string;
  currency: string;
  total: number;
  fee: number;
  net: number;
  status: OrderStatus;
  stage: EarningStage;
  items: number;
  paidAt?: string;
  paidOutAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  supplierId: string;
  supplierName?: string;
  currency: string;
  amount: number;
  orders: number;
  reference: string;
  note?: string;
  paidByName?: string;
  paidAt: string;
}

export interface Earnings {
  totals: EarningTotals[];
  orders: EarningOrder[];
  payouts: Payout[];
}

export interface PayoutSummary {
  suppliers: { supplierId: string; supplierName: string; currencies: EarningTotals[] }[];
  refundsPending: { id: string; supplierId: string; supplierName: string; clientName: string; currency: string; total: number; error?: string; updatedAt: string }[];
}

export interface OrderInput {
  items: { productId: string; quantity: number }[];
  city: string;
  address?: string;
  location?: { lat: number; lng: number };
  phone: string;
  note?: string;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, init: { token?: string | null; method?: string; body?: unknown } = {}): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}), ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message || data?.error || message;
      } catch {
        // keep the default message
      }
      return { ok: false, error: message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export function formatPrice(amount: number, currency: string): string {
  const text = Math.round(amount).toLocaleString("en-US");
  return currency === "USD" ? `$${text}` : `${currency} ${text}`;
}

export const FurnitureApi = {
  list: (query: ProductQuery = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    const text = params.toString();
    return call<ProductList>(`/furniture${text ? `?${text}` : ""}`);
  },
  filters: () => call<ProductFacets>("/furniture/filters"),
  mine: (token: string) => call<{ products: Product[] }>("/furniture/me", { token }),
  get: (id: string, token?: string | null) => call<{ product: Product }>(`/furniture/${encodeURIComponent(id)}`, { token }),
  create: (token: string, input: ProductInput) => call<{ product: Product }>("/furniture", { token, method: "POST", body: input }),
  update: (token: string, id: string, input: ProductInput) => call<{ product: Product }>(`/furniture/${encodeURIComponent(id)}`, { token, method: "PUT", body: input }),
  remove: (token: string, id: string) => call<{ deleted: boolean }>(`/furniture/${encodeURIComponent(id)}`, { token, method: "DELETE" }),

  createOrder: (token: string, input: OrderInput) => call<{ orders: Order[] }>("/furniture/orders", { token, method: "POST", body: input }),
  myOrders: (token: string) => call<{ orders: Order[] }>("/furniture/orders/mine", { token }),
  trackOrders: (token: string, query: { supplierId?: string; status?: string; paymentStatus?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    return call<OrdersTrackResult>(`/furniture/orders/track?${params.toString()}`, { token });
  },
  earningsMine: (token: string) => call<Earnings>("/furniture/earnings/mine", { token }),
  payoutSummary: (token: string) => call<PayoutSummary>("/furniture/payouts/summary", { token }),
  listPayouts: (token: string, query: { supplierId?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    return call<{ payouts: Payout[]; total: number; page: number; limit: number }>(`/furniture/payouts?${params.toString()}`, { token });
  },
  createPayout: (token: string, input: { supplierId: string; currency: string; reference: string; note?: string; orderIds?: string[] }) => call<{ payout: Payout }>("/furniture/payouts", { token, method: "POST", body: input }),
  retryRefund: (token: string, orderId: string) => call<{ refunded: boolean; paymentStatus: PaymentStatus; error?: string }>(`/furniture/orders/${encodeURIComponent(orderId)}/retry-refund`, { token, method: "POST" }),
  incomingOrders: (token: string) => call<{ orders: Order[] }>("/furniture/orders/incoming", { token }),
  confirmOrder: (token: string, id: string, input: { message?: string; deliveryDays?: number }) => call<{ order: Order }>(`/furniture/orders/${encodeURIComponent(id)}/confirm`, { token, method: "POST", body: input }),
  declineOrder: (token: string, id: string, message?: string) => call<{ order: Order }>(`/furniture/orders/${encodeURIComponent(id)}/decline`, { token, method: "POST", body: { message } }),
  completeOrder: (token: string, id: string) => call<{ order: Order }>(`/furniture/orders/${encodeURIComponent(id)}/complete`, { token, method: "POST" }),
  payOrder: (token: string, id: string) => call<{ paymentLinkUrl: string; invoiceNumber: string }>(`/furniture/orders/${encodeURIComponent(id)}/pay`, { token, method: "POST" }),
  refreshPayment: (token: string, id: string) => call<{ paymentStatus: PaymentStatus }>(`/furniture/orders/${encodeURIComponent(id)}/refresh-payment`, { token, method: "POST" }),
  cancelOrder: (token: string, id: string) => call<{ order: Order }>(`/furniture/orders/${encodeURIComponent(id)}/cancel`, { token, method: "POST" }),
};
