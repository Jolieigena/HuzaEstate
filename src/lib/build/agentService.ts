import { newId } from "./factory";
import { AgentMessage, BuildProject, DesignBrief, ExtractedRequirement, HOME_STYLE_LABELS, HomeStyle } from "./types";

export class AgentCancelledError extends Error {
  constructor() {
    super("Huza AI response was cancelled.");
    this.name = "AgentCancelledError";
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new AgentCancelledError());
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function matchNumber(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function detectStyle(text: string): HomeStyle | null {
  const lower = text.toLowerCase();
  const entries = Object.entries(HOME_STYLE_LABELS) as [HomeStyle, string][];
  for (const [key, label] of entries) {
    if (lower.includes(label.toLowerCase())) return key;
  }
  if (lower.includes("african")) return "contemporary_african";
  if (lower.includes("tropical")) return "modern_tropical";
  return null;
}

function detectBudget(text: string): number | null {
  const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:million|m)\b/i);
  if (millionMatch) return Math.round(Number(millionMatch[1]) * 1_000_000);
  const rwfMatch = text.match(/(\d[\d,]{5,})\s*rwf/i);
  if (rwfMatch) return Number(rwfMatch[1].replace(/,/g, ""));
  return null;
}

/**
 * Extracts a best-effort, deterministic set of structured requirements from a
 * free-text prompt. This is a lightweight keyword/regex parser standing in
 * for a real language model — see the module doc comment in this file for
 * why. Every extracted item is marked "suggested" so the user must actively
 * confirm it before it is treated as a confirmed brief requirement.
 */
export function extractRequirementsFromPrompt(text: string): ExtractedRequirement[] {
  const results: ExtractedRequirement[] = [];

  const bedrooms = matchNumber(text, /(\d+)\s*[- ]?(?:bed|bedroom)/i);
  if (bedrooms !== null) results.push({ id: newId("req"), field: "bedrooms", label: "Bedrooms", value: String(bedrooms), status: "suggested" });

  const bathrooms = matchNumber(text, /(\d+)\s*[- ]?(?:bath|bathroom)/i);
  if (bathrooms !== null) results.push({ id: newId("req"), field: "bathrooms", label: "Bathrooms", value: String(bathrooms), status: "suggested" });

  let floors = matchNumber(text, /(\d+)\s*[- ]?(?:floor|storey|story)/i);
  if (floors === null) {
    if (/single[- ]floor|one[- ]floor|single[- ]storey|bungalow/i.test(text)) floors = 1;
    if (/two[- ]floor|double[- ]storey|2[- ]floor/i.test(text)) floors = 2;
  }
  if (floors !== null) results.push({ id: newId("req"), field: "floors", label: "Floors", value: String(floors), status: "suggested" });

  const area = matchNumber(text, /(\d+)\s*(?:sqm|sq\.?\s?m|square met)/i);
  if (area !== null) results.push({ id: newId("req"), field: "plot_area", label: "Plot area", value: `${area} sqm`, status: "suggested" });

  const style = detectStyle(text);
  if (style) results.push({ id: newId("req"), field: "style", label: "Style", value: HOME_STYLE_LABELS[style], status: "suggested" });

  const budget = detectBudget(text);
  if (budget !== null) results.push({ id: newId("req"), field: "budget", label: "Target budget", value: `${budget.toLocaleString()} RWF`, status: "suggested" });

  if (/home office|study room|office space/i.test(text)) {
    results.push({ id: newId("req"), field: "home_office", label: "Home office", value: "Required", status: "suggested" });
  }
  const parking = matchNumber(text, /(\d+)\s*[- ]?(?:parking|car space|garage)/i);
  if (parking !== null) results.push({ id: newId("req"), field: "parking", label: "Parking spaces", value: String(parking), status: "suggested" });
  else if (/garage|parking/i.test(text)) results.push({ id: newId("req"), field: "parking", label: "Parking spaces", value: "Requested (quantity unclear)", status: "conflicting" });

  const sustainability: string[] = [];
  if (/ventilation|cross[- ]breeze/i.test(text)) sustainability.push("Natural ventilation");
  if (/solar/i.test(text)) sustainability.push("Solar readiness");
  if (/rainwater/i.test(text)) sustainability.push("Rainwater harvesting");
  if (/daylight|natural light/i.test(text)) sustainability.push("Maximum daylight");
  if (sustainability.length) {
    results.push({ id: newId("req"), field: "sustainability", label: "Sustainability", value: sustainability.join(", "), status: "suggested" });
  }

  if (/expand|extension|future/i.test(text)) {
    results.push({ id: newId("req"), field: "future_expansion", label: "Future expansion", value: "Should be easy to expand later", status: "suggested" });
  }

  return results;
}

function missingBriefFields(brief: DesignBrief): { field: string; question: string }[] {
  const missing: { field: string; question: string }[] = [];
  const bedroomsReq = brief.household.rooms.find((r) => r.key === "bedrooms");
  if (!bedroomsReq || bedroomsReq.quantity < 1) missing.push({ field: "bedrooms", question: "How many bedrooms do you need?" });
  if (!brief.style.primaryStyle) missing.push({ field: "style", question: "Do you have a preferred style — for example contemporary, minimalist or traditional?" });
  if (!brief.budget.targetBudget) missing.push({ field: "budget", question: "What's your approximate target budget in RWF?" });
  if (!brief.plot.areaSqm) missing.push({ field: "plot_area", question: "Roughly how large is your plot, in square metres?" });
  if (!brief.basics.provinceOrCity) missing.push({ field: "location", question: "Which city or province is the plot in?" });
  return missing;
}

function summarizeExtracted(extracted: ExtractedRequirement[]): string {
  if (extracted.length === 0) return "";
  const confirmed = extracted.filter((r) => r.status !== "conflicting");
  const lines = confirmed.map((r) => `${r.label}: ${r.value}`);
  return `Here's what I understood — ${lines.join("; ")}.`;
}

export interface AgentReplyResult {
  message: AgentMessage;
  extracted: ExtractedRequirement[];
}

/**
 * Mock Huza AI design agent. There is no real server-side AI integration in
 * this prototype: responses are generated deterministically from the prompt
 * and the current brief, with a short simulated delay to keep the
 * conversation feeling responsive. If a real provider is integrated later,
 * this function should be replaced by a call to a server-side API route —
 * never call an AI provider directly from client code.
 */
export const BuildAgentService = {
  async sendMessage(prompt: string, project: BuildProject, signal?: AbortSignal): Promise<AgentReplyResult> {
    await delay(650 + Math.min(prompt.length * 8, 900), signal);

    const extracted = extractRequirementsFromPrompt(prompt);
    const missing = missingBriefFields(project.brief).slice(0, 2);

    const parts: string[] = [];
    const summary = summarizeExtracted(extracted);
    if (summary) parts.push(summary);
    else parts.push("Thanks for sharing that — I've noted it against your project.");

    const conflicting = extracted.filter((r) => r.status === "conflicting");
    if (conflicting.length) {
      parts.push(`I wasn't fully sure about ${conflicting.map((c) => c.label.toLowerCase()).join(", ")} — could you confirm the exact detail?`);
    }

    if (missing.length) {
      parts.push(missing.map((m) => m.question).join(" "));
    } else {
      parts.push("Your brief looks well covered. Review the extracted requirements on the right, then generate your concepts when you're ready.");
    }

    const message: AgentMessage = {
      id: newId("msg"),
      role: "agent",
      content: parts.join(" "),
      timestamp: new Date().toISOString(),
      extracted,
    };

    return { message, extracted };
  },

  welcomeMessage(): AgentMessage {
    return {
      id: newId("msg"),
      role: "agent",
      content:
        "Tell me what you want to build. I can help organise your rooms, style, plot considerations and budget before creating concept directions.",
      timestamp: new Date().toISOString(),
    };
  },

  suggestedPrompts(): string[] {
    return [
      "Help me organise my rooms",
      "Check whether my budget matches my brief",
      "Suggest a layout for my plot",
      "Make the home easier to expand later",
      "Improve natural light and ventilation",
    ];
  },
};
