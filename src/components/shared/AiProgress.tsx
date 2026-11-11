"use client";

/* eslint-disable @next/next/no-img-element */

export interface AiProgressTile {
  src?: string;
  label?: string;
}

/** The waiting screen while Huza AI designs: one live line saying what it is doing, a progress bar, and the pictures taking shape. */
export default function AiProgress({
  title,
  stages,
  completedKeys,
  elapsedSec,
  tiles,
  onCancel,
}: {
  title: string;
  stages: { key: string; label: string }[];
  completedKeys: string[];
  elapsedSec: number;
  tiles: AiProgressTile[];
  onCancel: () => void;
}) {
  const done = stages.filter((s) => completedKeys.includes(s.key)).length;
  // The step being worked on is the first one not finished yet.
  const active = stages.find((s) => !completedKeys.includes(s.key)) ?? stages[stages.length - 1];
  const percent = Math.min(96, Math.max(6, Math.round(((done + 0.5) / stages.length) * 100)));
  const shown = tiles.length > 0 ? tiles.slice(0, 4) : [{}, {}, {}];

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
      <div className="flex items-center gap-4">
        <div className="relative h-11 w-11 shrink-0" aria-hidden="true">
          <span className="absolute inset-0 animate-spin rounded-full" style={{ background: "conic-gradient(from 0deg, #2ec440, #a7f3b4, #e2fbe6, #2ec440)", animationDuration: "2.4s" }} />
          <span className="absolute inset-[3px] flex items-center justify-center rounded-full bg-white text-[#2ec440]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm7 11l.9 2.6 2.6.9-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13z" />
            </svg>
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p key={active?.key} className="ai-text mt-0.5 truncate text-sm font-medium" aria-live="polite">
            {active?.label}…
          </p>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium tabular-nums text-slate-400">{elapsedSec}s</span>
      </div>

      <div className="mt-6" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={title}>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="relative h-full rounded-full bg-[#2ec440] transition-all duration-700 ease-out" style={{ width: `${percent}%` }}>
            <span className="ai-sweep absolute inset-0" />
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Step {Math.min(done + 1, stages.length)} of {stages.length}
        </p>
      </div>

      <div className={`mt-6 grid gap-3 ${shown.length === 1 ? "grid-cols-1" : shown.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`} aria-hidden="true">
        {shown.map((tile, index) => (
          <div key={index} className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
            {tile.src && <img src={tile.src} alt="" className="h-full w-full object-cover opacity-70 blur-[2px] saturate-50" />}
            <span className="ai-sweep absolute inset-0" style={{ animationDelay: `${index * 0.35}s` }} />
            {tile.label && <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">{tile.label}</span>}
          </div>
        ))}
      </div>

      <ul className="mt-6 space-y-1.5">
        {stages.map((stage) => {
          const finished = completedKeys.includes(stage.key);
          const current = !finished && stage.key === active?.key;
          return (
            <li key={stage.key} className={`flex items-center gap-2.5 text-sm ${finished ? "text-slate-500" : current ? "font-medium text-slate-900" : "text-slate-300"}`}>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {finished ? (
                  <svg className="h-4 w-4 text-[#2ec440]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : current ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#2ec440]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                )}
              </span>
              {stage.label}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 text-center">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-slate-400 transition-colors hover:text-red-600">
          Cancel
        </button>
      </div>
    </div>
  );
}
