"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Product, StockStatus } from "./api";

// Items saved for later (the heart on a product). Kept in this browser, like the cart, so it works without an
// account. Each one keeps what the product looked like when it was saved.
const KEY = "huza_shop_saved";
const EVENT = "huza-saved-changed";
const MAX = 100;

export interface SavedItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  currency: string;
  stock: StockStatus;
  supplierId: string;
  supplierName: string;
}

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(items: SavedItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Saving just will not be remembered.
  }
  window.dispatchEvent(new Event(EVENT));
}

function parse(raw: string): SavedItem[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useSaved() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const items = useMemo(() => parse(raw), [raw]);
  const ids = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const toggle = useCallback((product: Product): boolean => {
    const current = parse(read());
    if (current.some((i) => i.productId === product.id)) {
      write(current.filter((i) => i.productId !== product.id));
      return false;
    }
    write([
      { productId: product.id, name: product.name, image: product.images[0], price: product.price, currency: product.currency, stock: product.stock, supplierId: product.supplier?.accountId ?? "", supplierName: product.supplier?.companyName ?? "Supplier" },
      ...current,
    ].slice(0, MAX));
    return true;
  }, []);

  const saveItem = useCallback((item: SavedItem) => {
    const current = parse(read());
    if (!current.some((i) => i.productId === item.productId)) write([item, ...current].slice(0, MAX));
  }, []);

  const remove = useCallback((productId: string) => write(parse(read()).filter((i) => i.productId !== productId)), []);

  return { items, count: items.length, has: (productId: string) => ids.has(productId), toggle, saveItem, remove };
}
