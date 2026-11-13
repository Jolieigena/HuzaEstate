import type { Attachment } from "@/lib/ai/attachments";
import { previewRenovation, RenovateRoom } from "./aiPreview";
import { ConceptAreaView, RenovationProject, RENOVATION_AREA_LABELS } from "./types";

const ROOM_FOR_AREA: Record<string, RenovateRoom> = {
  kitchen: "kitchen",
  bathroom: "bathroom",
  living_room: "living-room",
  dining_room: "dining-room",
  bedroom: "bedroom",
  home_office: "home-office",
  exterior_facade: "exterior",
  roofing: "exterior",
  balcony: "exterior",
  terrace: "exterior",
  garage: "exterior",
  garden: "garden",
  landscaping: "garden",
};

/** What the person asked for by default, for the redesign of every room. */
const DEFAULT_WISH = "A balanced renovation: new finishes, lighting and some new furniture, with the same layout.";

/** A small copy of the AI's picture (a JPEG of at most 1100 px), so several of them still fit with the project in the browser. */
export function shrinkPicture(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 1100 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** A view that holds a real picture the AI made, not a stand-in. */
export const hasPicture = (view: ConceptAreaView) => view.afterImage.startsWith("data:image/") && view.beforeImage.startsWith("data:image/");

export type RedesignOutcome = { views: ConceptAreaView[]; made: number; error: string };

/**
 * The AI renovates the photo of every room the person chose. Without `change` it starts from each room's own photo; with it, it starts
 * from the picture it made before and changes only what was asked. A room with no photo gets no picture.
 */
export async function redesignRooms(token: string, project: RenovationProject, change?: { request: string; current: ConceptAreaView[]; attachments?: Attachment[] }): Promise<RedesignOutcome> {
  const style = project.assessment.style.primaryStyle ?? "modern";
  const areas = project.assessment.areas.slice(0, 8);
  const photos = project.uploads.photos.filter((p) => p.previewUrl?.startsWith("data:image/"));
  let error = "";

  const views = await Promise.all(
    areas.map(async (area, index): Promise<ConceptAreaView | null> => {
      const label = area.customLabel || RENOVATION_AREA_LABELS[area.areaKey];
      const room = ROOM_FOR_AREA[area.areaKey] ?? "living-room";
      // The room's own photo; the first room may use any photo, so a single upload still gets its picture.
      const own = photos.find((p) => p.relatedAreaId === area.id)?.previewUrl ?? (index === 0 ? photos[0]?.previewUrl : undefined);
      if (change) {
        const before = change.current.find((v) => v.areaKey === area.areaKey);
        if (!before || !hasPicture(before)) return before ?? null;
        const outcome = await previewRenovation(token, { photos: [before.afterImage], room, style, wish: `Keep this room exactly as it is, and change only this: ${change.request}`, attachments: change.attachments });
        if (!outcome.ok) {
          error = error || outcome.error;
          return before;
        }
        return { ...before, afterImage: await shrinkPicture(outcome.result.imageUrl) };
      }
      if (!own) return null;
      const outcome = await previewRenovation(token, { photos: [own], room, style, wish: [DEFAULT_WISH, area.desiredOutcome].filter(Boolean).join(" ") });
      if (!outcome.ok) {
        error = error || outcome.error;
        return null;
      }
      return { areaKey: area.areaKey, label, beforeImage: own, afterImage: await shrinkPicture(outcome.result.imageUrl) };
    }),
  );
  const list = views.filter((v): v is ConceptAreaView => v !== null);
  return { views: list, made: list.filter(hasPicture).length, error };
}
