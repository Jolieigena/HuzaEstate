import { summariseBrief } from "./briefSummary";
import { groundFloorPicture, shrinkPicture } from "./fullDesignApi";
import { Concept, DesignBrief, ManualFloor } from "./types";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type Plan3dOutcome = { ok: true; pictures: NonNullable<Concept["plan3d"]> } | { ok: false; error: string; unavailable: boolean };

/**
 * The AI draws every floor of the plan as a 3D cutaway picture. The floors are drawn at the same time; the flat plan of each one goes with
 * the request so the picture follows it. `onEach` is called as each picture arrives, so the page can show them as they come.
 */
export async function makePlan3d(token: string, brief: DesignBrief, floors: ManualFloor[], onEach?: (pictures: NonNullable<Concept["plan3d"]>) => void): Promise<Plan3dOutcome> {
  const withRooms = floors.filter((f) => f.rooms.length > 0);
  if (withRooms.length === 0) return { ok: false, error: "There is no plan to draw yet.", unavailable: false };
  const done: NonNullable<Concept["plan3d"]> = [];
  let firstError = "";
  let unavailable = false;

  await Promise.all(
    withRooms.map(async (floor) => {
      const plan = await groundFloorPicture([floor]);
      try {
        const res = await fetch(`${ACCESS_API_URL}/build-ai/plan-3d`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            brief: summariseBrief(brief),
            totalFloors: withRooms.length,
            floor: { name: floor.name, rooms: floor.rooms.map(({ type, name, x, y, w, h }) => ({ type, name, x, y, w, h })) },
            ...(plan ? { plan } : {}),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          firstError = firstError || data?.message || "Something went wrong. Please try again.";
          if (res.status === 503) unavailable = true;
          return;
        }
        const url = await shrinkPicture(data.image as string);
        done.push({ floorId: floor.id, label: floor.name, url });
        onEach?.([...done]);
      } catch {
        firstError = firstError || "Could not reach the server. Please try again.";
      }
    }),
  );
  if (done.length === 0) return { ok: false, error: firstError || "The 3D plan could not be made. Please try again.", unavailable };
  // keep the pictures in the order of the floors, whichever came first
  return { ok: true, pictures: withRooms.flatMap((f) => done.filter((p) => p.floorId === f.id)) };
}
