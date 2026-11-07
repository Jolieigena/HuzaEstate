"use client";

import type { Concept } from "@/lib/build/types";
import { FloorPlanGraphic } from "./FloorPlanSvg";

/** A concept's ground-floor plan, scaled to fill its box. It stands where a picture of a house used to be: concepts are shown by their plans. */
export default function ConceptPlan({ concept, className = "" }: { concept: Pick<Concept, "floors">; className?: string }) {
  const floor = concept.floors[0];
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-slate-50 p-3 ${className}`}>
      {floor && floor.rooms.length > 0 ? (
        <div className="w-full [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-full">
          <FloorPlanGraphic floor={floor} />
        </div>
      ) : (
        <span className="text-xs font-semibold text-slate-400">No plan yet</span>
      )}
    </div>
  );
}
