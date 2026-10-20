import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { PRIVACY } from "@/lib/legal/privacy";

export const metadata: Metadata = { title: "Privacy Policy | HuzaEstate" };

export default function Page() {
  return <LegalPage doc={PRIVACY} path="/privacy" />;
}
