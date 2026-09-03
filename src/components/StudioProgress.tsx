interface StudioProgressProps {
  steps: string[];
  currentIndex?: number;
}

/** Small step indicator shared by the temporary Build/Renovate studio shells. */
export default function StudioProgress({ steps, currentIndex = 0 }: StudioProgressProps) {
  return (
    <ol className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center sm:flex-1">
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                index === currentIndex ? "bg-[#2ec440] text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-sm font-semibold ${index === currentIndex ? "text-slate-900" : "text-slate-400"}`}>{step}</span>
          </div>
          {index < steps.length - 1 && <div className="hidden sm:block flex-1 h-px bg-slate-200 mx-4" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
