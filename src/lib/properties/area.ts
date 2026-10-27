/** A plot's size the way people talk about it: square metres up to a hectare, hectares above (10,000 sqm = 1 ha). */
export function formatArea(sqm: number): { value: string; unit: string } {
  if (sqm >= 10000) {
    const hectares = sqm / 10000;
    return { value: hectares >= 100 ? Math.round(hectares).toLocaleString("en-US") : String(Number(hectares.toFixed(2))), unit: "ha" };
  }
  return { value: Math.round(sqm).toLocaleString("en-US"), unit: "sqm" };
}
