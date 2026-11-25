"use client";

import { Suspense } from "react";
import { AccessAndDiscountsPage } from "@/components/admin/pages/AccessAndDiscounts";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccessAndDiscountsPage scope="org" />
    </Suspense>
  );
}
