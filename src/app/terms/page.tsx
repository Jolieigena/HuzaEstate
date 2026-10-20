import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { TERMS } from "@/lib/legal/terms";

export const metadata: Metadata = { title: "Terms of Service | HuzaEstate" };

export default function Page() {
  return <LegalPage doc={TERMS} path="/terms" />;
}
