"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const HIDDEN_ON = ["/login", "/signup", "/become-a-seller"];

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (HIDDEN_ON.includes(pathname)) {
    return null;
  }

  return <Footer />;
}
