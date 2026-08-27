export function Logo({ className = '', dark = false }: { className?: string, dark?: boolean }) {
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Huzalabs Three Lines Icon */}
      <line x1="9.5" y1="6" x2="9.5" y2="33" className="stroke-[#2ec440]" strokeWidth="5"/>
      <line x1="27.5" y1="6" x2="27.5" y2="26" className="stroke-[#2ec440]" strokeWidth="5"/>
      <line x1="27.5" y1="28" x2="27.5" y2="33" className="stroke-[#2ec440]" strokeWidth="5"/>
      <line x1="18.5" y1="13" x2="18.5" y2="23" className="stroke-[#2ec440]" strokeWidth="5"/>
      
      {/* Logo Text */}
      <text x="42" y="27" fontFamily="inherit" fontSize="22" fontWeight="800" letterSpacing="-0.5">
        <tspan className={dark ? "fill-white" : "fill-gray-900"}>Huza</tspan>
        <tspan className="fill-[#2ec440]">Estate</tspan>
      </text>
    </svg>
  );
}
