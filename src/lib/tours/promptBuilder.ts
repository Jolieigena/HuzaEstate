// Builds the World Labs text_prompt from property data so the end user
// never has to type one — this is the single, authoritative place that
// happens. Called server-side (src/app/api/tours/generate/route.ts) as the
// source of truth; the client never gets to supply the final prompt for
// the production flow, only the structured property fields it's built from.

export interface PropertyPromptInput {
  propertyType?: string; // "house" | "apartment" | "land" | ...
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  city?: string;
  description?: string;
}

const DEFAULT_TEST_PROMPT =
  "A realistic modern 3-bedroom, 2-bathroom house with a spacious living room, kitchen, natural lighting, and a garden.";

export function buildPromptFromProperty(input: PropertyPromptInput | undefined | null): string {
  if (!input) return DEFAULT_TEST_PROMPT;

  const { propertyType, bedrooms, bathrooms, location, city, description } = input;

  const place = [location, city].filter(Boolean).join(", ");
  const hasCoreFacts = Boolean(propertyType || bedrooms || bathrooms || place);

  if (!hasCoreFacts) return DEFAULT_TEST_PROMPT;

  const kind = propertyType ? propertyType.toLowerCase() : "property";
  const beds = bedrooms ? `${bedrooms}-bedroom` : undefined;
  const baths = bathrooms ? `${bathrooms}-bathroom` : undefined;
  const specs = [beds, baths].filter(Boolean).join(", ");

  let sentence = "A realistic";
  if (specs) sentence += ` ${specs}`;
  sentence += ` ${kind}`;
  if (place) sentence += ` in ${place}`;

  // No description on file: describe generic interior/exterior detail as
  // part of the same sentence, matching the World Labs docs' example
  // phrasing. With a real description, keep it as its own sentence instead
  // of splicing it mid-clause — the seller's freeform text rarely reads
  // naturally glued onto "...with {description}".
  if (!description) {
    sentence += " with a spacious living room, kitchen, natural lighting, and a garden.";
    return sentence;
  }

  sentence += ".";
  const detail = description.trim();
  sentence += ` ${detail.endsWith(".") ? detail : `${detail}.`}`;

  return sentence;
}
