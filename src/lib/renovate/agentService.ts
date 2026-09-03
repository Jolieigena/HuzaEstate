import { newId } from "./factory";
import {
  AgentMessage,
  ExistingSpaceAnalysis,
  ExtractedRequirement,
  RenovationAssessment,
  RENOVATION_AREA_LABELS,
  RenovationAreaKey,
  RENOVATION_STYLE_LABELS,
  RenovationStyle,
} from "./types";

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

function detectAreas(text: string): RenovationAreaKey[] {
  const lower = text.toLowerCase();
  const found: RenovationAreaKey[] = [];
  const entries = Object.entries(RENOVATION_AREA_LABELS) as [RenovationAreaKey, string][];
  for (const [key, label] of entries) {
    if (lower.includes(label.toLowerCase())) found.push(key);
  }
  if (lower.includes("outside") && !found.includes("exterior_facade")) found.push("exterior_facade");
  return found;
}

function detectStyle(text: string): RenovationStyle | null {
  const lower = text.toLowerCase();
  const entries = Object.entries(RENOVATION_STYLE_LABELS) as [RenovationStyle, string][];
  for (const [key, label] of entries) {
    if (lower.includes(label.toLowerCase())) return key;
  }
  if (lower.includes("african")) return "contemporary_african";
  return null;
}

function detectBudget(text: string): number | null {
  const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:million|m)\b/i);
  if (millionMatch) return Math.round(Number(millionMatch[1]) * 1_000_000);
  const rwfMatch = text.match(/(\d[\d,]{5,})\s*rwf/i);
  if (rwfMatch) return Number(rwfMatch[1].replace(/,/g, ""));
  return null;
}

function detectKeepItems(text: string): string[] {
  const items: string[] = [];
  if (/keep.*(plumbing|plumbing.*position)/i.test(text)) items.push("Existing plumbing positions");
  if (/keep.*window|existing window/i.test(text)) items.push("Existing windows");
  if (/keep.*floor|existing floor/i.test(text)) items.push("Existing flooring");
  if (/keep.*layout|existing layout/i.test(text)) items.push("Existing layout");
  return items;
}

const SAFETY_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /structural|load[- ]bearing/i, label: "Structural walls" },
  { pattern: /extension|extend/i, label: "Building extension" },
  { pattern: /additional floor|second floor|extra floor/i, label: "Additional floor" },
  { pattern: /rewir|electrical/i, label: "Electrical rewiring" },
  { pattern: /gas/i, label: "Gas" },
  { pattern: /asbestos/i, label: "Asbestos or hazardous material" },
  { pattern: /roof/i, label: "Roof structure" },
];

function detectSafetyFlags(text: string): string[] {
  const flags: string[] = [];
  for (const { pattern, label } of SAFETY_KEYWORDS) {
    if (pattern.test(text)) flags.push(label);
  }
  return flags;
}

/**
 * Extracts a best-effort, deterministic set of structured requirements from a
 * free-text renovation prompt. This is a lightweight keyword/regex parser
 * standing in for a real language model — see the module doc comment for
 * why. Every extracted item starts "suggested" so the user must actively
 * confirm it before it feeds concept generation.
 */
export function extractRequirementsFromPrompt(text: string): ExtractedRequirement[] {
  const results: ExtractedRequirement[] = [];

  const areas = detectAreas(text);
  if (areas.length) results.push({ id: newId("req"), field: "areas", label: "Renovation areas", value: areas.map((a) => RENOVATION_AREA_LABELS[a]).join(", "), status: "suggested" });

  const style = detectStyle(text);
  if (style) results.push({ id: newId("req"), field: "style", label: "Style", value: RENOVATION_STYLE_LABELS[style], status: "suggested" });

  const budget = detectBudget(text);
  if (budget !== null) results.push({ id: newId("req"), field: "budget", label: "Target budget", value: `${budget.toLocaleString()} RWF`, status: "suggested" });

  const keep = detectKeepItems(text);
  if (keep.length) results.push({ id: newId("req"), field: "keep", label: "Items to keep", value: keep.join(", "), status: "suggested" });

  const safety = detectSafetyFlags(text);
  if (safety.length) results.push({ id: newId("req"), field: "safety", label: "Safety concerns", value: safety.join(", "), status: "requires_professional_review" });

  const weeksMatch = text.match(/(\d+)\s*[- ]?(?:week|month)/i);
  if (weeksMatch) results.push({ id: newId("req"), field: "timeline", label: "Timeline", value: weeksMatch[0], status: "suggested" });

  if (/local material|locally available/i.test(text)) {
    results.push({ id: newId("req"), field: "materials", label: "Materials", value: "Prefer locally available materials", status: "suggested" });
  }

  if (areas.length === 0) {
    results.push({ id: newId("req"), field: "areas", label: "Renovation areas", value: "Not mentioned", status: "missing" });
  }

  return results;
}

function missingAssessmentFields(assessment: RenovationAssessment): { field: string; question: string }[] {
  const missing: { field: string; question: string }[] = [];
  if (assessment.areas.length === 0) missing.push({ field: "areas", question: "Which areas of the property would you like to renovate?" });
  if (!assessment.style.primaryStyle) missing.push({ field: "style", question: "Do you have a preferred style — for example warm contemporary, minimalist or traditional?" });
  if (!assessment.budgetTimeline.targetBudget) missing.push({ field: "budget", question: "What's your approximate target budget in RWF?" });
  return missing;
}

function summarizeExtracted(extracted: ExtractedRequirement[]): string {
  const confirmed = extracted.filter((r) => r.status !== "conflicting" && r.status !== "missing");
  if (confirmed.length === 0) return "";
  const lines = confirmed.map((r) => `${r.label}: ${r.value}`);
  return `Here's what I understood — ${lines.join("; ")}.`;
}

export interface AgentReplyResult {
  message: AgentMessage;
  extracted: ExtractedRequirement[];
}

/**
 * Mock Huza AI renovation agent. There is no real server-side AI integration
 * in this prototype: responses are generated deterministically from the
 * prompt and the current assessment, with a short simulated delay to keep
 * the conversation feeling responsive. If a real provider is integrated
 * later, this function should be replaced by a call to a server-side API
 * route — never call an AI provider directly from client code.
 */
export const RenovationAgentService = {
  async sendMessage(prompt: string, assessment: RenovationAssessment, signal?: AbortSignal): Promise<AgentReplyResult> {
    await delay(650 + Math.min(prompt.length * 8, 900), signal);

    const extracted = extractRequirementsFromPrompt(prompt);
    const missing = missingAssessmentFields(assessment).slice(0, 2);

    const parts: string[] = [];
    const summary = summarizeExtracted(extracted);
    if (summary) parts.push(summary);
    else parts.push("Thanks for sharing that — I've noted it against your project.");

    const safety = extracted.find((r) => r.field === "safety");
    if (safety) {
      parts.push(`I noticed mention of ${safety.value.toLowerCase()} — this will need a professional inspection before any work proceeds. I can't confirm safety from a description alone.`);
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
        "Tell me what you'd like to renovate. I can help organise the areas, what to keep, remove or change, your style direction and budget before creating renovation concepts.",
      timestamp: new Date().toISOString(),
    };
  },

  suggestedPrompts(): string[] {
    return [
      "Help me organise this renovation",
      "Suggest a lower-cost option",
      "Keep the existing plumbing locations",
      "Improve storage without reducing circulation",
      "Suggest locally available materials",
      "Identify areas needing professional inspection",
      "Create a phased renovation plan",
    ];
  },

  /**
   * Simulated existing-space analysis for a prototype photo upload. Uses
   * deliberately cautious language and never claims to detect structural
   * safety, electrical safety, hidden moisture or regulatory compliance
   * from an image.
   */
  analyzeExistingSpace(fileName: string, areaLabel: string): ExistingSpaceAnalysis {
    return {
      fileId: fileName,
      roomTypeDetected: `Appears to be a ${areaLabel.toLowerCase()}.`,
      visibleFinishes: ["Appears to have painted walls", "Floor finish cannot be confirmed with certainty from this image"],
      lightingCondition: "Appears to have moderate natural light based on the visible window area.",
      visibleStorage: "Some built-in storage is visible; exact capacity cannot be confirmed from an image.",
      potentialConcerns: ["Possible surface wear near visible edges — may require inspection.", "Ceiling condition cannot be confirmed from this angle."],
      uncertainObservations: [
        "Cannot be confirmed from an image: structural condition, electrical safety, hidden moisture or code compliance.",
        "A professional inspection is recommended before relying on any of these observations.",
      ],
    };
  },
};
