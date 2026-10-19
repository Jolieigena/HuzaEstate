"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { activeNavKey, type NavKey } from "@/lib/navigation/activeNav";

const NAV_LINKS: { key: NavKey; href: string; label: string }[] = [
  { key: "home", href: "/home", label: "Home" },
  { key: "buy", href: "/properties?type=sale", label: "Buy" },
  { key: "rent", href: "/properties?type=rent", label: "Rent" },
  { key: "sell", href: "/sell", label: "Sell" },
  { key: "designs", href: "/designs", label: "Designs" },
  { key: "build", href: "/build", label: "Build" },
  { key: "renovate", href: "/renovate", label: "Renovate" },
  { key: "shop", href: "/shop", label: "Shop" },
  { key: "professionals", href: "/professionals", label: "Professionals" },
  { key: "blog", href: "/blog", label: "Blog" },
];

function Links({ variant, active, onNavigate }: { variant: "desktop" | "mobile"; active: NavKey | null; onNavigate?: () => void }) {
  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = link.key === active;
        return variant === "desktop" ? (
          <Link
            key={link.key}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative py-2 transition-colors duration-200 active:text-[#2ec440] after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:bg-[#2ec440] after:transition-all after:duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] focus-visible:ring-offset-2 focus-visible:rounded-sm ${
              isActive ? "text-slate-900 font-semibold after:w-full" : "hover:text-slate-900 after:w-0 hover:after:w-full"
            }`}
          >
            {link.label}
          </Link>
        ) : (
          <Link
            key={link.key}
            href={link.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`py-3 px-2 -mx-2 rounded-lg font-semibold border-b border-slate-50 last:border-b-0 transition-colors duration-150 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] ${
              isActive ? "text-[#2ec440]" : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

// Reads the sale/rent choice from the address, which needs a Suspense boundary; until it is read the links render
// without telling Buy from Rent, and every other section is already right.
function WithSearch({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  const type = useSearchParams().get("type");
  return <Links variant={variant} active={activeNavKey(pathname, type)} onNavigate={onNavigate} />;
}

function WithoutSearch({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <Links variant={variant} active={activeNavKey(pathname, null)} onNavigate={onNavigate} />;
}

/** The main navigation links, marking the one for the page you are on. */
export default function NavLinks({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  return (
    <Suspense fallback={<WithoutSearch variant={variant} onNavigate={onNavigate} />}>
      <WithSearch variant={variant} onNavigate={onNavigate} />
    </Suspense>
  );
}
