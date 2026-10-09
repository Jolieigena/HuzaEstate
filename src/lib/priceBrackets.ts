// Price brackets for a "Price" filter, sized for each currency. The exchange rates are rough and are used only to
// choose sensible bracket edges (about $500, $1,000...). Prices themselves are never converted.
const RATE: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, RWF: 1400, KES: 130, UGX: 3700, TZS: 2600, ZAR: 18, NGN: 1500, GHS: 15 };

export interface PriceBracket {
  label: string;
  min?: number;
  max?: number;
}

export function priceBrackets(currency: string, usdEdges: number[]): PriceBracket[] {
  const rate = RATE[currency] ?? 1;
  const edges = usdEdges.map((usd) => Number((usd * rate).toPrecision(2)));
  const money = (n: number) => (currency === "USD" ? `$${n.toLocaleString("en-US")}` : `${currency} ${n.toLocaleString("en-US")}`);
  return [
    { label: `Under ${money(edges[0])}`, max: edges[0] },
    ...edges.slice(0, -1).map((edge, i) => ({ label: `${money(edge)} to ${money(edges[i + 1])}`, min: edge, max: edges[i + 1] })),
    { label: `Over ${money(edges[edges.length - 1])}`, min: edges[edges.length - 1] },
  ];
}
