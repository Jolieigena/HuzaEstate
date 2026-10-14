"use client";

import { useEffect, useState } from "react";
import { FurnitureApi, type OrderQuote } from "@/lib/furniture/api";
import type { BasketLine } from "@/lib/furniture/basket";

/** What the basket costs for each supplier with their delivery fee, asked of the server whenever the basket changes, and
 *  the reason when something in it cannot be ordered (sold out, not enough left). Nothing without a signed-in buyer. */
export function useQuote(lines: BasketLine[], token: string | null): { quote: OrderQuote[] | null; problem: string } {
  const [state, setState] = useState<{ key: string; quote: OrderQuote[] | null; problem: string }>({ key: "", quote: null, problem: "" });
  const key = token && lines.length ? JSON.stringify(lines.map((l) => [l.productId, l.quantity])) : "";

  useEffect(() => {
    if (!token || !key) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      FurnitureApi.quoteOrder(token, lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))).then((result) => {
        if (cancelled) return;
        setState(result.ok ? { key, quote: result.data.groups, problem: "" } : { key, quote: null, problem: result.error });
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
  return state.key === key && key ? { quote: state.quote, problem: state.problem } : { quote: null, problem: "" };
}
