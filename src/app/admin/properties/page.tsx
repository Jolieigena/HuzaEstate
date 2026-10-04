"use client";

import { Suspense } from "react";
import { PropertiesListPage } from "@/components/admin/pages/Properties";

// The page reads its filters from the URL (useSearchParams), which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PropertiesListPage />
    </Suspense>
  );
}
