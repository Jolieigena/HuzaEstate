"use client";

/** An on/off switch. The knob sits inside the track in the normal flow, so it can never slide over the text beside it. */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** What a screen reader says for the switch. */
  label: string;
  disabled?: boolean;
  /** Text shown beside the switch. */
  children?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2ec440]/20 disabled:cursor-not-allowed disabled:opacity-40 ${checked ? "bg-[#2ec440]" : "bg-slate-300"}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
      {children && <span className="text-sm font-bold text-slate-900">{children}</span>}
    </span>
  );
}
