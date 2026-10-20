import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { SELLER_TERMS } from "@/lib/legal/sellerTerms";

export const metadata: Metadata = { title: "Seller Terms & Conditions | HuzaEstate" };

export default function Page() {
  return <LegalPage doc={SELLER_TERMS} path="/seller-terms" />;
}
