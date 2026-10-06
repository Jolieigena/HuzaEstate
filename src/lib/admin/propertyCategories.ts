import { PROPERTY_LABEL_GROUPS } from "@/lib/properties/types";

/** Every property type an organisation can be limited to, grouped for the picker. Same labels sellers
 *  choose from when they post, so a limit to "Villa" means listings posted as villas. */
export const PROPERTY_CATEGORY_GROUPS = PROPERTY_LABEL_GROUPS;

/** "Villa, Condo" - or "All categories" when an organisation is not limited to any. */
export function describePropertyCategories(types: string[] | undefined): string {
  return types?.length ? types.join(", ") : "All categories";
}

/** "Kicukiro, Gasabo" - or "Whole country" when an organisation is not limited to any districts. */
export function describeDistricts(districts: string[] | undefined): string {
  return districts?.length ? districts.join(", ") : "Whole country";
}
