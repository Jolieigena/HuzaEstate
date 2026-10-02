"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Professionals no longer has its own page — every professional account already shows up in
// Users too (same account, two places to look was the problem), so the Professionals tab there
// now carries the specialised columns (type, specialisation, profile status) this page used to
// own. Kept as a redirect so old links/bookmarks still land somewhere useful.
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/users?role=professional");
  }, [router]);
  return null;
}
