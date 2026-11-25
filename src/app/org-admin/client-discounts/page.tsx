import { redirect } from "next/navigation";

// Discounts now sit on the Access & discounts page, as its second tab.
export default function Page() {
  redirect("/org-admin/access-codes?tab=discounts");
}
