import type { Property } from "@/lib/properties/types";
import type { ZillowHome } from "./api";

const SQM_PER_SQFT = 0.092903;

/** The prefix of a US home's id on this site: its page is /properties/us-<number>. */
export const US_HOME_PREFIX = "us-";
export const isUsHomeId = (id: string) => id.startsWith(US_HOME_PREFIX);

const propertyTypeOf = (homeType: string): Property["propertyType"] => {
  const type = homeType.toUpperCase();
  if (type.includes("CONDO") || type.includes("APARTMENT")) return "apartment";
  if (type.includes("LOT") || type.includes("LAND")) return "land";
  return "house";
};

/** A US home dressed as one of our own listings, so the same card and the same page draw it: a street as the title, the town below it. */
export function homeToProperty(home: ZillowHome): Property {
  const [street, ...rest] = home.address.split(",");
  const listed = home.daysOnZillow !== null ? new Date(Date.now() - home.daysOnZillow * 86400000).toISOString() : undefined;
  return {
    id: `${US_HOME_PREFIX}${home.id}`,
    title: street.trim() || home.address,
    description: "",
    price: home.price,
    currency: home.currency,
    location: rest.join(",").trim() || `${home.city}, ${home.state}`,
    city: "",
    bedrooms: home.bedrooms ?? 0,
    bathrooms: home.bathrooms ?? 0,
    sqm: home.sqft !== null ? Math.round(home.sqft * SQM_PER_SQFT) : 0,
    imageUrl: home.image,
    galleryImages: home.photos.length > 1 ? home.photos : undefined,
    type: "sale",
    propertyType: propertyTypeOf(home.homeType),
    country: "United States",
    createdAt: listed,
  };
}
