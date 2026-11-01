import { NextResponse } from "next/server";

const KINDS = ["wall", "tv_unit", "paint", "ceiling", "lighting", "furniture", "other"] as const;
type Kind = (typeof KINDS)[number];

interface Part {
  name: string;
  kind: Kind;
  description: string;
}

interface Draft {
  title: string;
  description: string;
  spaceType?: string;
  parts: Part[];
  instructions: string;
  source: "ai" | "template";
}

const CATEGORY_WORDS: Record<string, string> = { house: "house", interior: "interior", exterior: "exterior", furniture: "furniture", accessories: "accessories" };

// What a design of each kind is usually made of, by what the brief mentions. Used when no language model is set up, and to fill gaps.
const RULES: { test: RegExp; part: Part }[] = [
  { test: /\b(tv|television|sitting|living|lounge|media)\b/i, part: { name: "Built-in TV unit with side shelves", kind: "tv_unit", description: "Low unit under the screen with open shelves on both sides" } },
  { test: /\b(wall|feature|engraved|3d|relief|panel|rib)\b/i, part: { name: "Feature wall panel", kind: "wall", description: "Textured or engraved panel behind the main piece" } },
  { test: /\b(paint|colour|color|finish|wall paint)\b/i, part: { name: "Wall paint", kind: "paint", description: "Bold central colour with a calm tone on the other walls" } },
  { test: /\b(ceiling|gypsum|cove|false ceiling)\b/i, part: { name: "Ceiling design", kind: "ceiling", description: "Stepped or coved ceiling with hidden light strips" } },
  { test: /\b(light|lighting|lamp|ambient|chandelier|led)\b/i, part: { name: "Ambient and architectural lighting", kind: "lighting", description: "Warm strip lights, shelf lighting and a ceiling feature fitting" } },
  { test: /\b(kitchen|cabinet|island|worktop|countertop)\b/i, part: { name: "Kitchen cabinets and worktop", kind: "furniture", description: "Base and wall cabinets with a worktop" } },
  { test: /\b(table|chair|chairs|dining|sofa|couch|seat|set)\b/i, part: { name: "Table and chairs", kind: "furniture", description: "Matching table with chairs" } },
  { test: /\b(wardrobe|wardrobes|storage|bed|cupboard)\b/i, part: { name: "Storage and wardrobes", kind: "furniture", description: "Built-in or free-standing storage" } },
];

function templateDraft(brief: string, category: string, spaceType?: string): Draft {
  const parts: Part[] = [];
  for (const rule of RULES) if (rule.test.test(`${brief} ${spaceType ?? ""}`) && !parts.some((p) => p.kind === rule.part.kind && p.name === rule.part.name)) parts.push(rule.part);
  if (parts.length === 0) parts.push({ name: "Main piece", kind: category === "furniture" ? "furniture" : "other", description: "The main item described in the brief" });
  const space = spaceType || (category === "furniture" ? "Furniture" : "Design");
  // A title is the first few words, cut at a word and not in the middle of one.
  const firstLine = brief.trim().split(/[.\n]/)[0] || space;
  const words = firstLine.split(/\s+/).slice(0, 8).join(" ");
  return {
    title: words.charAt(0).toUpperCase() + words.slice(1),
    description: `${brief.trim()}\n\nThis design is made of ${parts.length} ${parts.length === 1 ? "part" : "parts"}, each of which can be priced and built separately.`.trim(),
    spaceType,
    parts,
    instructions: "Please quote each part separately and give the total. Say which materials and finishes the price assumes, and how long it takes from the day you are told to go ahead.",
    source: "template",
  };
}

function clean(input: unknown, max: number): string {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

async function modelDraft(brief: string, category: string, spaceType?: string): Promise<Draft | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const prompt = `You help a Rwandan home-building platform write a design brief for local builders, furniture makers and manufacturers to price.
Return only JSON: {"title": string, "description": string, "spaceType": string, "parts": [{"name": string, "kind": one of ${KINDS.join("|")}, "description": string}], "instructions": string}.
Break the design into 2 to 8 parts that can each be built and priced separately. Never mention prices. Keep each description under 200 characters.
Kind of design: ${category}. Space: ${spaceType || "not given"}.
Brief: ${brief}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.6 } }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.parts) || parsed.parts.length === 0) return null;
    const parts: Part[] = parsed.parts.slice(0, 8).map((p: Record<string, unknown>) => ({
      name: clean(p.name, 120) || "Part",
      kind: (KINDS as readonly string[]).includes(p.kind as string) ? (p.kind as Kind) : "other",
      description: clean(p.description, 300),
    }));
    return { title: clean(parsed.title, 160) || "New design", description: clean(parsed.description, 4000), spaceType: clean(parsed.spaceType, 80) || spaceType, parts, instructions: clean(parsed.instructions, 4000), source: "ai" };
  } catch {
    return null;
  }
}

// POST /api/design-draft { brief, category, spaceType? } - a first draft of a design for an administrator to edit. Uses a language model
// when GEMINI_API_KEY is set on the server, and otherwise builds the draft from the words of the brief.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const brief = clean(body?.brief, 2000);
  const category = CATEGORY_WORDS[clean(body?.category, 20)] ?? "interior";
  const spaceType = clean(body?.spaceType, 80) || undefined;
  if (brief.length < 5) return NextResponse.json({ error: "Describe the design in a few words." }, { status: 400 });
  const draft = (await modelDraft(brief, category, spaceType)) ?? templateDraft(brief, category, spaceType);
  return NextResponse.json(draft);
}
