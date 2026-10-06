import { ADMIN_REGION_DATA } from "@/lib/adminRegionData";
import { regionsForCountry, type RegionOption } from "@/lib/regions";

/** The regions an administrator can give an organisation within one country. Rwanda keeps its
 *  hand-authored provinces and districts; every other country gets its first-level regions (provinces,
 *  states, counties; Uganda lists districts) as one flat group.
 *
 *  Admin screens only. Sellers still choose a district through lib/regions.ts, which stays Rwanda-only,
 *  so nothing changes on the posting side; listings elsewhere are matched to a region by the server. */
export function adminRegionsForCountry(country: string): RegionOption[] | undefined {
  const rwanda = regionsForCountry(country);
  if (rwanda) return rwanda;
  const names = ADMIN_REGION_DATA[country];
  return names?.length ? [{ region: "Regions", districts: names }] : undefined;
}
