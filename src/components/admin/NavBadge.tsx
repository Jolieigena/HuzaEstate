/** Red count pill for a sidebar item — hidden at zero, capped at 99+. */
export default function NavBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span aria-label={`${count} waiting`} className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
