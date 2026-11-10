import { designToSvg } from "./exportPlan";
import { summariseBrief } from "./briefSummary";
import { DesignBrief, FullDesign, FullDesignPicture, ManualDesign, ManualFloor } from "./types";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** The pictures of a full design, and the view each one shows. */
export const FULL_DESIGN_VIEWS: { key: FullDesignPicture["key"]; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "rear", label: "Back and side" },
  { key: "living", label: "Living room" },
  { key: "kitchen", label: "Kitchen" },
  { key: "bedroom", label: "Main bedroom" },
];

type Outcome<T> = { ok: true; value: T } | { ok: false; error: string; unavailable: boolean };

async function post<T>(token: string, path: string, body: unknown): Promise<Outcome<T>> {
  try {
    const res = await fetch(`${ACCESS_API_URL}/build-ai/full-design/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.message || "Something went wrong. Please try again.", unavailable: res.status === 503 };
    return { ok: true, value: data as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again.", unavailable: false };
  }
}

const roomsOf = (floors: ManualFloor[]) => floors.map((f) => ({ name: f.name, rooms: f.rooms.map(({ type, name, x, y, w, h }) => ({ type, name, x, y, w, h })) }));

/** A picture of the ground floor, for the AI to follow. Empty if the browser cannot make it. */
async function groundFloorPicture(floors: ManualFloor[]): Promise<string | undefined> {
  const ground = floors.find((f) => f.rooms.length > 0);
  if (!ground) return undefined;
  try {
    const { svg, width, height } = designToSvg({ floors: [ground] } as unknown as ManualDesign, "");
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      const scale = Math.min(1, 900 / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      if (!context) return undefined;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return undefined;
  }
}

/** A smaller copy of a picture (a JPEG of at most 1000 px), so five of them still fit with the project in the browser. */
function shrinkPicture(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

type Spec = Pick<FullDesign, "summary" | "exterior" | "interior" | "items">;

/**
 * Makes the full design for a chosen plan: the written design first, then every picture at once. `onProgress` is called with the
 * design as it fills in (the text first, then each picture as it arrives), so the page can show it growing.
 */
export async function createFullDesign(
  token: string,
  brief: DesignBrief,
  floors: ManualFloor[],
  conceptId: string,
  onProgress: (design: FullDesign) => void,
): Promise<{ ok: true; design: FullDesign } | { ok: false; error: string; unavailable: boolean }> {
  const spec = await post<Spec>(token, "spec", { brief: summariseBrief(brief), floors: roomsOf(floors) });
  if (!spec.ok) return spec;
  let design: FullDesign = { generatedAt: new Date().toISOString(), conceptId, ...spec.value, pictures: [] };
  onProgress(design);

  const plan = await groundFloorPicture(floors);
  let firstError = "";
  // One view: the picture comes back whole, and is added to the design as a smaller copy.
  const makeView = async (view: (typeof FULL_DESIGN_VIEWS)[number], reference?: string): Promise<string | undefined> => {
    const result = await post<{ image: string }>(token, "image", {
      kind: view.key,
      brief: summariseBrief(brief),
      floors: roomsOf(floors),
      exterior: design.exterior,
      interior: design.interior,
      ...(plan ? { plan } : {}),
      ...(reference ? { reference } : {}),
    });
    if (!result.ok) {
      firstError = firstError || result.error;
      return undefined;
    }
    const url = await shrinkPicture(result.value.image);
    design = { ...design, pictures: [...design.pictures, { key: view.key, label: view.label, url }] };
    onProgress(design);
    return result.value.image;
  };
  // The front goes first and is shown to all the others, so the pictures are one house in one light and one set of colours.
  const [first, ...others] = FULL_DESIGN_VIEWS;
  const front = await makeView(first);
  await Promise.all(others.map((view) => makeView(view, front)));
  if (design.pictures.length === 0) return { ok: false, error: firstError || "The pictures could not be made. Please try again.", unavailable: false };
  // keep the pictures in the order of the views, whichever came first
  design = { ...design, pictures: FULL_DESIGN_VIEWS.flatMap((v) => design.pictures.filter((p) => p.key === v.key)) };
  return { ok: true, design };
}
