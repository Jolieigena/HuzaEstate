"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { getRouteDisplay } from "@/lib/navigation/routeDisplay";

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (!getRouteDisplay(pathname).showFooter) {
    return null;
  }

  return <Footer />;
}
