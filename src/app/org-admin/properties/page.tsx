"use client";

import { Suspense } from "react";
import { OrgPropertiesListPage } from "@/components/org-admin/pages/Properties";

// The page reads its filters from the URL (useSearchParams), which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrgPropertiesListPage />
    </Suspense>
  );
}
