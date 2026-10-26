import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import DeleteAccountForm from "@/components/legal/DeleteAccountForm";
import { DELETE_ACCOUNT } from "@/lib/legal/deleteAccount";

export const metadata: Metadata = { title: "Delete your account | HuzaEstate" };

export default function Page() {
  return (
    <LegalPage doc={DELETE_ACCOUNT} path="/delete-account">
      <DeleteAccountForm />
    </LegalPage>
  );
}
