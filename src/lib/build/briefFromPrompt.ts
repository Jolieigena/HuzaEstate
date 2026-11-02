import { extractRequirementsFromPrompt } from "./agentService";
import { emptyBrief } from "./factory";
import { DesignBrief, HOME_STYLE_LABELS, HomeStyle, PropertyUse, ROOM_LABELS, RoomKey } from "./types";

// Reads a person's own words ("a three-bedroom family home on a 300 sqm plot in Kigali") into the brief's fields, so the brief
// opens already filled in with what they said. It is a keyword reader like the one behind the Huza AI conversation (and reuses
// it), not a language model: it fills in what it recognises and leaves the rest empty for the person to answer.

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

// "three-bedroom" and "two floors" read the same as "3-bedroom" and "2 floors".
function withDigits(text: string): string {
  return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b(?=[\s-]+(?:bed|bath|floor|stor|park|car|garage))/gi, (word) => String(NUMBER_WORDS[word.toLowerCase()]));
}

// Where a place in the words points to a country. A city not listed here keeps the country the brief already has.
const COUNTRY_OF_CITY: Record<string, string> = {
  kigali: "Rwanda", musanze: "Rwanda", huye: "Rwanda", rubavu: "Rwanda", rwamagana: "Rwanda", muhanga: "Rwanda", nyagatare: "Rwanda", rusizi: "Rwanda",
  kampala: "Uganda", entebbe: "Uganda", nairobi: "Kenya", mombasa: "Kenya", "dar es salaam": "Tanzania", arusha: "Tanzania", bujumbura: "Burundi", goma: "DR Congo",
};

function placeFrom(text: string): string | null {
  const match = text.match(/\b(?:in|at|near|around)\s+([A-Z][\w'-]+(?:\s+(?:es\s+)?[A-Z][\w'-]+)?)/);
  return match ? match[1].trim() : null;
}

function propertyUseFrom(text: string): PropertyUse | null {
  if (/\brental|to let|to rent|tenants?\b/i.test(text)) return "rental_property";
  if (/holiday|vacation|weekend home/i.test(text)) return "holiday_home";
  if (/family|my home|our home|residence|live in/i.test(text)) return "primary_residence";
  return null;
}

/** A short name for a project, made from what the words say ("2-floor 4-bedroom home in Kigali"). Empty when the words say none of it. */
export function projectNameFromPrompt(words: string): string {
  if (!words.trim()) return "";
  const base = emptyBrief();
  const brief = briefFromPrompt(base, words);
  const bedrooms = brief.household.rooms.find((r) => r.key === "bedrooms")?.quantity ?? 0;
  const parts: string[] = [];
  if (brief.household.floors > base.household.floors) parts.push(`${brief.household.floors}-floor`);
  if (bedrooms > 0) parts.push(`${bedrooms}-bedroom`);
  if (parts.length === 0 && !brief.basics.provinceOrCity) return "";
  parts.push("home");
  const name = parts.join(" ");
  return brief.basics.provinceOrCity ? `${name} in ${brief.basics.provinceOrCity}` : name;
}

/** The brief with whatever the words say filled in. Nothing the person has already entered is overwritten. */
export function briefFromPrompt(brief: DesignBrief, words: string): DesignBrief {
  const text = withDigits(words);
  if (!text.trim()) return brief;
  const next: DesignBrief = JSON.parse(JSON.stringify(brief));
  const found = new Map(extractRequirementsFromPrompt(text).map((item) => [item.field, item.value]));
  const number = (field: string): number | null => {
    const value = Number.parseInt(found.get(field) ?? "", 10);
    return Number.isFinite(value) ? value : null;
  };

  const setRoom = (key: RoomKey, quantity: number) => {
    const room = next.household.rooms.find((r) => r.key === key);
    if (room) {
      if (room.quantity < 1) room.quantity = quantity;
    } else {
      next.household.rooms.push({ key, label: ROOM_LABELS[key], quantity, privacy: "private", isCustom: false });
    }
  };

  const bedrooms = number("bedrooms");
  if (bedrooms) setRoom("bedrooms", bedrooms);
  const bathrooms = number("bathrooms");
  if (bathrooms) setRoom("bathrooms", bathrooms);
  if (found.has("home_office")) setRoom("home_office", 1);

  const floors = number("floors");
  if (floors && floors >= 1 && floors <= 4) next.household.floors = floors;
  const parking = number("parking");
  if (parking !== null) next.household.parkingSpaces = parking;

  const area = number("plot_area");
  if (area && !next.plot.areaSqm) next.plot.areaSqm = area;

  // A budget in dollars is left for the person to enter: the brief's budget is read in francs here.
  const budget = Number.parseInt((found.get("budget") ?? "").replace(/[^\d]/g, ""), 10);
  if (budget && !/\busd\b|\$|dollar/i.test(text) && !next.budget.targetBudget) next.budget.targetBudget = budget;

  const styleLabel = found.get("style");
  if (styleLabel && !next.style.primaryStyle) {
    const key = (Object.entries(HOME_STYLE_LABELS) as [HomeStyle, string][]).find(([, label]) => label === styleLabel)?.[0];
    if (key) next.style.primaryStyle = key;
  }

  const place = placeFrom(words);
  if (place && !next.basics.provinceOrCity) {
    next.basics.provinceOrCity = place;
    const country = COUNTRY_OF_CITY[place.toLowerCase()];
    if (country) next.basics.countryValue = country;
  }

  const use = propertyUseFrom(words);
  if (use && !next.basics.propertyUse) next.basics.propertyUse = use;

  return next;
}
