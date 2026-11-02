import { NextResponse } from "next/server";

// What Huza AI can pick out of photos of a property: the rooms or areas shown, what looks like it needs work, and the style the
// property is in. The names are the ones the renovation brief uses, so the answer can fill the brief in directly.
const AREAS = ["kitchen", "bathroom", "living_room", "dining_room", "bedroom", "home_office", "hallway", "exterior_facade", "roofing", "balcony", "terrace", "garden", "landscaping", "garage"] as const;
const STYLES = ["warm_contemporary", "modern", "contemporary_african", "minimalist", "scandinavian", "industrial", "luxury", "traditional", "rustic", "tropical", "affordable_modern"] as const;

interface Finding {
  area: (typeof AREAS)[number];
  problem: string;
  condition: "good" | "fair" | "poor";
}

interface Analysis {
  available: true;
  summary: string;
  style: (typeof STYLES)[number] | null;
  areas: Finding[];
}

const PROMPT = `You look at photos of a home in Rwanda or East Africa that its owner wants to renovate.
Return only JSON: {"summary": string, "style": one of ${STYLES.join("|")} or null, "areas": [{"area": one of ${AREAS.join("|")}, "problem": string, "condition": "good"|"fair"|"poor"}]}.
List each distinct room or outdoor area you can actually see, once, with the main visible problem or what looks dated, worn or damaged, in under 160 characters. If nothing looks wrong, say so.
"summary" is two short sentences describing what you see. "style" is the style the property is in now. Do not guess at anything you cannot see. Never mention prices.`;

function clean(input: unknown, max: number): string {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

function toAnalysis(parsed: Record<string, unknown> | null): Analysis | null {
  if (!parsed) return null;
  const seen = new Set<string>();
  const areas: Finding[] = [];
  for (const item of Array.isArray(parsed.areas) ? (parsed.areas as Record<string, unknown>[]) : []) {
    const area = item.area as Finding["area"];
    if (!(AREAS as readonly string[]).includes(area) || seen.has(area)) continue;
    seen.add(area);
    const condition = item.condition === "good" || item.condition === "poor" ? item.condition : "fair";
    areas.push({ area, problem: clean(item.problem, 200), condition });
  }
  const style = (STYLES as readonly string[]).includes(parsed.style as string) ? (parsed.style as Analysis["style"]) : null;
  return { available: true, summary: clean(parsed.summary, 400), style, areas: areas.slice(0, 8) };
}

async function withGemini(images: string[], key: string): Promise<Analysis | null> {
  const parts = [{ text: PROMPT }, ...images.map((data) => ({ inline_data: { mime_type: "image/jpeg", data } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`Gemini answered ${res.status}`);
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return toAnalysis(typeof raw === "string" ? JSON.parse(raw) : null);
}

async function withOpenAI(images: string[], key: string): Promise<Analysis | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, ...images.map((data) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${data}` } }))] }],
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`OpenAI answered ${res.status}`);
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  return toAnalysis(typeof raw === "string" ? JSON.parse(raw) : null);
}

// POST /api/photo-analysis { images: [base64 JPEG, ...] } - what a vision model sees in the photos of a property. Needs GEMINI_API_KEY
// (or OPENAI_API_KEY) on the server; without one, or when the model cannot be reached, it answers { available: false } and the
// brief is simply not filled in from the photos. It never invents an answer.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const images = (Array.isArray(body?.images) ? body.images : [])
    .filter((value: unknown): value is string => typeof value === "string" && value.length > 100 && value.length < 2_000_000)
    .slice(0, 6);
  if (images.length === 0) return NextResponse.json({ error: "Send at least one photo." }, { status: 400 });

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  try {
    const analysis = geminiKey ? await withGemini(images, geminiKey) : openAiKey ? await withOpenAI(images, openAiKey) : null;
    return NextResponse.json(analysis ?? { available: false });
  } catch (error) {
    console.error("[photo-analysis]", (error as Error).message);
    return NextResponse.json({ available: false });
  }
}
