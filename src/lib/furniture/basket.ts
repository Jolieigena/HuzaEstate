"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Product } from "./api";

// The order basket: what someone has picked from the furniture catalogue so far. It lives in this browser
// (nothing is saved on the server until the order request is sent). Each line keeps what the product looked
// like when it was added, so the basket can be shown without asking the server about every item.
const KEY = "huza_furniture_basket";
const EVENT = "huza-basket-changed";
const MAX_QUANTITY = 99;

export interface BasketLine {
  productId: string;
  name: string;
  image?: string;
  price: number;
  currency: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
}

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(lines: BasketLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // The basket just will not be remembered.
  }
  window.dispatchEvent(new Event(EVENT));
}

function parse(raw: string): BasketLine[] {
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

export function useBasket() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const lines = useMemo(() => parse(raw), [raw]);

  const add = useCallback((product: Product, quantity = 1) => {
    const current = parse(read());
    const existing = current.find((l) => l.productId === product.id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
    else
      current.push({
        productId: product.id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        currency: product.currency,
        supplierId: product.supplier?.accountId ?? "",
        supplierName: product.supplier?.companyName ?? "Supplier",
        quantity: Math.min(quantity, MAX_QUANTITY),
      });
    write(current);
  }, []);

  const addLine = useCallback((line: BasketLine) => {
    const current = parse(read());
    const existing = current.find((l) => l.productId === line.productId);
    if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, MAX_QUANTITY);
    else current.push({ ...line, quantity: Math.min(line.quantity, MAX_QUANTITY) });
    write(current);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    write(parse(read()).map((l) => (l.productId === productId ? { ...l, quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY) } : l)));
  }, []);

  const remove = useCallback((productId: string) => write(parse(read()).filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => write([]), []);

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { lines, count, add, addLine, setQuantity, remove, clear };
}
