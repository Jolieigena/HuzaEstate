/** "Busanza, Kigali" for a listing's location and city, leaving a part out when it is empty or only repeats the other
 *  ("Busanza" typed alone is stored as both, which used to read "Busanza, Busanza"). */
export function formatPlace(location?: string, city?: string): string {
  const parts = [location, city].map((part) => (part ?? "").trim()).filter(Boolean);
  if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) return parts[0];
  return parts.join(", ");
}
