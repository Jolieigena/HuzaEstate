import { newId } from "./factory";
import { RenovationAreaKey, RenovationAssessment, RenovationStyle, SelectedRenovationArea, UploadedFile } from "./types";

// What a vision model made of the photos of a property (see app/api/photo-analysis). `null` when it could not look: no model is set
// up on the server, or it could not be reached. Nothing is filled in from the photos then, and nothing is claimed about them.
export interface PhotoAnalysis {
  summary: string;
  style: RenovationStyle | null;
  areas: { area: RenovationAreaKey; problem: string; condition: "good" | "fair" | "poor" }[];
}

export async function analysePhotos(photos: UploadedFile[]): Promise<PhotoAnalysis | null> {
  const images = photos.map((p) => p.previewUrl?.replace(/^data:image\/jpeg;base64,/, "")).filter((data): data is string => !!data && data.length > 100);
  if (images.length === 0) return null;
  try {
    const res = await fetch("/api/photo-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images }), signal: AbortSignal.timeout(45000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.available === true ? (data as PhotoAnalysis) : null;
  } catch {
    return null;
  }
}

/** The assessment with what the photos show added: the areas that look like they need work, with what was seen, and the current style
 *  when none is chosen yet. Nothing the person has already entered is overwritten. */
export function applyPhotoAnalysis(assessment: RenovationAssessment, analysis: PhotoAnalysis): RenovationAssessment {
  const next: RenovationAssessment = JSON.parse(JSON.stringify(assessment));
  for (const finding of analysis.areas) {
    if (finding.condition === "good" || next.areas.some((a) => a.areaKey === finding.area)) continue;
    const area: SelectedRenovationArea = {
      id: newId("area"),
      areaKey: finding.area,
      currentUse: "",
      approxDimensions: "",
      mainProblem: finding.problem,
      desiredOutcome: "",
      priority: finding.condition === "poor" ? "high" : "medium",
      structuralChangesExpected: false,
      notes: "Suggested from your photos.",
    };
    next.areas.push(area);
  }
  if (analysis.style && !next.style.primaryStyle) next.style.primaryStyle = analysis.style;
  return next;
}
