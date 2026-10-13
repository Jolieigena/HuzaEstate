/** Which link in the top navigation matches the page being shown, by section rather than by exact address, so
 *  Buy and Rent light up for /properties?type=sale and ?type=rent, and a section stays lit on its inner pages. */
export type NavKey = "home" | "buy" | "rent" | "sell" | "build" | "renovate" | "professionals" | "designs" | "shop" | "blog";

export function activeNavKey(pathname: string, type: string | null): NavKey | null {
  const within = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  if (pathname === "/" || within("/home")) return "home";
  if (within("/buy")) return "buy";
  if (within("/rent")) return "rent";
  // The search page itself belongs to Buy or Rent only when one was chosen. A single property's page, or the page with
  // no choice made, belongs to neither.
  if (pathname === "/properties") return type === "sale" ? "buy" : type === "rent" ? "rent" : null;
  if (within("/sell") || within("/post-property")) return "sell";
  if (within("/build") || within("/studio/build")) return "build";
  if (within("/renovate") || within("/studio/renovate")) return "renovate";
  if (within("/professionals")) return "professionals";
  if (within("/designs")) return "designs";
  if (within("/shop")) return "shop";
  if (within("/blog")) return "blog";
  return null;
}
