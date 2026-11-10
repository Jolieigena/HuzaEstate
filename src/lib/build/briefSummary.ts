import { DesignBrief, HOME_STYLE_LABELS } from "./types";

/** The brief, said briefly for the AI: the rooms and plot, and the style the person chose with everything they said about it. */
export function summariseBrief(brief: DesignBrief) {
  const style = brief.style;
  return {
    floors: brief.household.floors,
    plotAreaSqm: brief.plot.areaSqm,
    style: style.primaryStyle ? HOME_STYLE_LABELS[style.primaryStyle] : "",
    styleDetails: {
      alsoLike: style.secondaryStyles.map((s) => HOME_STYLE_LABELS[s]),
      roofStyle: style.roofStyle,
      exteriorColours: style.exteriorColours,
      interiorColours: style.interiorColours,
      windowStyle: style.windowStyle,
      materials: style.preferredMaterials,
      avoid: style.materialsToAvoid,
      layout: style.layoutPreference,
      indoorOutdoor: style.indoorOutdoorConnection,
      naturalLight: style.naturalLightPriority,
      privacy: style.privacyPriority,
    },
    parkingSpaces: brief.household.parkingSpaces,
    priorities: [...brief.sustainability.items, ...brief.accessibility.items].filter((i) => i.priority).map((i) => i.label),
    rooms: brief.household.rooms.map((r) => ({ label: r.label, quantity: r.quantity, preferredSizeSqm: r.preferredSizeSqm })),
  };
}
