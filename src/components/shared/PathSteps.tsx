"use client";

import Link from "next/link";

export interface PathStep {
  key: string;
  label: string;
  href: string;
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** The path a person follows in a studio: step names in a row with chevrons between them. Finished steps are green, the current one is underlined. */
export function PathSteps({ steps, current, done, open }: { steps: PathStep[]; current: number; done: boolean[]; open: boolean[] }) {
  return (
    <ol aria-label="Your path" className="print:hidden mb-8 flex items-center gap-x-3 overflow-x-auto whitespace-nowrap border-b border-slate-200 text-sm sm:gap-x-4 sm:text-base">
      {steps.map((step, index) => {
        const isCurrent = index === current;
        const isDone = done[index] && !isCurrent;
        const reachable = open[index];
        const tone = isCurrent ? "font-black text-slate-900" : isDone ? "font-bold text-[#2ec440]" : reachable ? "font-bold text-slate-700" : "font-bold text-slate-300";
        const body = (
          <span className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-3 ${isCurrent ? "border-slate-900" : "border-transparent"} ${tone}`}>
            {isDone && <CheckIcon />}
            {step.label}
          </span>
        );
        return (
          <li
            key={step.key}
            // on a phone the bar scrolls sideways so the current step is in view; only the bar moves, never the page
            ref={isCurrent ? (el) => { const bar = el?.parentElement; if (el && bar) bar.scrollLeft = el.offsetLeft - (bar.clientWidth - el.clientWidth) / 2; } : undefined}
            className="flex items-center gap-x-3 sm:gap-x-4"
          >
            {index > 0 && (
              <span aria-hidden="true" className="-mt-3 text-slate-300">
                ›
              </span>
            )}
            {reachable ? (
              <Link href={step.href} aria-current={isCurrent ? "step" : undefined} className="block">
                {body}
              </Link>
            ) : (
              <span aria-disabled="true" className="block cursor-not-allowed">
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Back and Continue under a step, so the person is always told where to go next. `hints` say what is missing when Continue is off. */
export function PathFooter({ steps, current, open, hints }: { steps: PathStep[]; current: number; open: boolean[]; hints: string[] }) {
  if (current < 1) return null;
  const next = steps[current + 1];
  return (
    <div className="print:hidden mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Link href={steps[current - 1].href} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400">
        Back
      </Link>
      {next && (
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!open[current + 1] && hints[current] && <p className="text-sm font-semibold text-slate-500 sm:text-right">{hints[current]}</p>}
          {open[current + 1] ? (
            <Link href={next.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
              Continue: {next.label}
            </Link>
          ) : (
            <span aria-disabled="true" className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-8 font-bold text-slate-400">
              Continue: {next.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
