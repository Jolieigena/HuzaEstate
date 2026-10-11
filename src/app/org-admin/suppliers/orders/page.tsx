"use client";

import { Suspense } from "react";
import { SupplierOrdersTrackerPage } from "@/components/suppliers-admin/SuppliersAdmin";

// The page reads the supplier filter from the URL (useSearchParams), which needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SupplierOrdersTrackerPage scope="org" />
    </Suspense>
  );
}
