// Listing prices are stored with their own currency (Property.currency), so a "$" is only right for USD.
// Same convention as formatPrice in lib/furniture/api.ts: "$75,000" for USD, "RWF 75,000" for anything else.

function currencyCode(currency?: string): string {
  // Some listings carry a suffix such as "RWF/month" — only the code matters here.
  return (currency || "USD").replace(/\/.*$/, "").trim().toUpperCase() || "USD";
}

export function formatListingPrice(price: number, currency?: string): string {
  const code = currencyCode(currency);
  const text = Math.round(price).toLocaleString("en-US");
  return code === "USD" ? `$${text}` : `${code} ${text}`;
}

/** Short form for map markers, e.g. "$1.2M" or "RWF 75k". */
export function formatListingPriceCompact(price: number, currency?: string): string {
  const code = currencyCode(currency);
  const prefix = code === "USD" ? "$" : `${code} `;
  if (price >= 1_000_000) return `${prefix}${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1000) return `${prefix}${(price / 1000).toFixed(0)}k`;
  return `${prefix}${Math.round(price)}`;
}
