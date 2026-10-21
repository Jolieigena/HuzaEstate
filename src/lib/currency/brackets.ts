import type { DisplayCurrency } from "./display";

export interface PriceBracket {
  label: string;
  min?: number;
  max?: number;
}

/** Price ranges for a catalogue's Price filter, in the currency the buyer sees prices in. The edges are given in US dollars and
 *  converted with the live rates, rounded to two significant figures. */
export function priceBracketsFor(money: DisplayCurrency, usdEdges: number[]): PriceBracket[] {
  const code = money.currency ?? "USD";
  const edges = usdEdges.map((usd) => Number(money.convert(usd, "USD").toPrecision(2)));
  const label = (n: number) => money.format(n, code);
  return [
    { label: `Under ${label(edges[0])}`, max: edges[0] },
    ...edges.slice(0, -1).map((edge, i) => ({ label: `${label(edge)} to ${label(edges[i + 1])}`, min: edge, max: edges[i + 1] })),
    { label: `Over ${label(edges[edges.length - 1])}`, min: edges[edges.length - 1] },
  ];
}
