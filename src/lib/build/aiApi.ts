import { newId } from "./factory";
import { summariseBrief } from "./briefSummary";
import { addDefaultOpenings } from "./openings";
import { DesignBrief, ManualFloor, ManualRoomType } from "./types";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

type AiFloor = { name: string; rooms: { type: string; name: string; x: number; y: number; w: number; h: number }[] };
export type AiDesignOutcome = { ok: true; floors: ManualFloor[] } | { ok: false; error: string; unavailable: boolean };

/** The AI's rooms, given the ids and the doors and windows the rest of the page expects. */
function toFloors(aiFloors: AiFloor[]): ManualFloor[] {
  return addDefaultOpenings(
    aiFloors.map((floor, level) => ({
      id: newId("floor"),
      name: floor.name,
      level,
      rooms: floor.rooms.map((room) => ({ id: newId("room"), ...room, type: room.type as ManualRoomType })),
    })),
  );
}

/** Asks the AI for a design from the brief, or, with the current floors and a request, for that design changed. */
export async function designWithAi(token: string, brief: DesignBrief, change?: { request: string; floors: ManualFloor[] }): Promise<AiDesignOutcome> {
  try {
    const res = await fetch(`${ACCESS_API_URL}/build-ai/design`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        brief: summariseBrief(brief),
        ...(change ? { request: change.request, floors: change.floors.map((f) => ({ name: f.name, rooms: f.rooms.map(({ type, name, x, y, w, h }) => ({ type, name, x, y, w, h })) })) } : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.message || "Something went wrong. Please try again.", unavailable: res.status === 503 };
    return { ok: true, floors: toFloors(data.floors as AiFloor[]) };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again.", unavailable: false };
  }
}
