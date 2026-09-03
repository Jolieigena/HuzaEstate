"use client";

import { RenovationTimelineEstimate } from "@/lib/renovate/types";

export default function TimelinePhases({ timeline }: { timeline: RenovationTimelineEstimate }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Estimated total duration: <span className="font-bold text-slate-900">{timeline.totalDurationWeeks} weeks</span>
        </p>
        {timeline.occupancyWarning && (
          <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">Property remains occupied — expect disruption during high-risk phases.</p>
        )}
      </div>

      <ol className="space-y-3">
        {timeline.phases.map((phase, i) => {
          const isCurrent = phase.key === timeline.currentPhaseKey;
          return (
            <li key={phase.key} className={`flex items-start gap-4 rounded-2xl border p-4 ${isCurrent ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200 bg-white"}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isCurrent ? "bg-[#2ec440] text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
              <div className="flex-grow min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900">{phase.label}</p>
                  <span className="text-xs font-semibold text-slate-400">{phase.estimatedDurationWeeks} week{phase.estimatedDurationWeeks === 1 ? "" : "s"}</span>
                  {phase.canRunInParallelWith.length > 0 && <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Can run in parallel</span>}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      phase.expectedDisruption === "high" ? "bg-red-50 text-red-600" : phase.expectedDisruption === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {phase.expectedDisruption} disruption
                  </span>
                </div>
                <p className="text-sm text-slate-500">{phase.dependency}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
