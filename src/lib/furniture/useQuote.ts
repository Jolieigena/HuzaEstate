"use client";

import { useEffect, useState } from "react";
import { FurnitureApi, type OrderQuote, type QuoteLine } from "@/lib/furniture/api";
import type { BasketLine } from "@/lib/furniture/basket";

/** What the basket costs for each supplier with their delivery fee, asked of the server whenever the basket changes, and
 *  the reason when something in it cannot be ordered (sold out, not enough left). Nothing without a signed-in buyer. */
export function useQuote(lines: BasketLine[], token: string | null, city = ""): { quote: OrderQuote[] | null; problem: string; lines: QuoteLine[] } {
  const [state, setState] = useState<{ key: string; quote: OrderQuote[] | null; problem: string; lines: QuoteLine[] }>({ key: "", quote: null, problem: "", lines: [] });
  const key = token && lines.length ? JSON.stringify([city.trim().toLowerCase(), ...lines.map((l) => [l.productId, l.variantId ?? "", l.quantity])]) : "";

  useEffect(() => {
    if (!token || !key) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      FurnitureApi.quoteOrder(token, lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })), city.trim() || undefined).then((result) => {
        if (cancelled) return;
        setState(result.ok ? { key, quote: result.data.groups, problem: "", lines: result.data.lines ?? [] } : { key, quote: null, problem: result.error, lines: [] });
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // The basket's content is what matters, not the identity of the lines array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key]);

  // An answer for an older basket is not shown for the current one.
  return state.key === key && key ? { quote: state.quote, problem: state.problem, lines: state.lines } : { quote: null, problem: "", lines: [] };
}
